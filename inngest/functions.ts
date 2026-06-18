// src/inngest/functions.ts
import { db } from "@/db/db";
import { inngest } from "./client";
import { notifications, userPreferences, emailEmbeddings, syncStatus } from "@/db/schema";
import { corsair } from "@/server/corsair";
import { generateEmbedding } from "@/server/agent";
import { eq, and } from "drizzle-orm";

/**
 * Gmail Initial Sync
 *
 * Workflow:
 * 1. Fetch 100 emails via Gmail API
 * 2. For each email: check if already embedded → skip if yes
 * 3. Generate embedding → store with unique messageId
 */
export const gmailInitialSync = inngest.createFunction(
  {
    id: "gmail-initial-sync",
    triggers: {
      event: "gmail.initial-sync",
    },
  },
  async ({ event, step }) => {
    const { tenantId } = event.data;

    console.log(`[gmail-initial-sync] Starting sync for tenant: ${tenantId}`);

    // Mark sync as in progress
    await step.run("mark-sync-starting", async () => {
      await db
        .insert(syncStatus)
        .values({
          tenantId,
          gmailSync: "syncing",
        })
        .onConflictDoUpdate({
          target: syncStatus.tenantId,
          set: { gmailSync: "syncing", updatedAt: new Date() },
        });
    });

    // Step 1: Fetch recent emails via Gmail API
    const fetchResult = await step.run("fetch-emails", async () => {
      const tenant = corsair.withTenant(tenantId);
      const result = await tenant.gmail.api.messages.list({
        maxResults: 100,
        q: "newer_than:30d",
      });
      return {
        messages: result.messages ?? [],
        nextPageToken: result.nextPageToken ?? null,
      };
    });

    const messages = fetchResult.messages;
    const nextPageToken = fetchResult.nextPageToken;

    console.log(`[gmail-initial-sync] Fetched ${messages.length} message IDs, nextPageToken: ${nextPageToken ? "yes" : "none"}`);

    // Store page token for continuous sync
    await step.run("store-page-token", async () => {
      if (nextPageToken) {
        await db
          .update(syncStatus)
          .set({ gmailPageToken: nextPageToken, updatedAt: new Date() })
          .where(eq(syncStatus.tenantId, tenantId));
      }
    });

    // Step 2: Fetch full email details
    const fullEmails = await step.run("fetch-full-emails", async () => {
      const tenant = corsair.withTenant(tenantId);
      const emails = [];

      for (const msg of messages) {
        if (!msg.id) continue;
        try {
          const full = await tenant.gmail.api.messages.get({
            id: msg.id,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
          });
          emails.push(full);
        } catch (err) {
          console.error(`[gmail-initial-sync] Failed to fetch ${msg.id}:`, err);
        }
      }
      return emails;
    });

    console.log(`[gmail-initial-sync] Fetched ${fullEmails.length} full emails`);

    // Step 3: Check which are already embedded
    const existingIds = await step.run("check-existing-embeddings", async () => {
      const messageIds = fullEmails
        .filter((e) => e.id)
        .map((e) => e.id as string);

      if (messageIds.length === 0) return [];

      const existing = await db
        .select({ messageid: emailEmbeddings.messageid })
        .from(emailEmbeddings)
        .where(
          and(
            eq(emailEmbeddings.tenantid, tenantId),
          )
        );

      return existing.map((e) => e.messageid);
    });

    console.log(`[gmail-initial-sync] ${existingIds.length} already embedded`);

    // Step 4: Generate embeddings for new emails only
    let embeddedCount = 0;
    await step.run("generate-embeddings", async () => {
      const results = [];

      for (const email of fullEmails) {
        if (!email.id) continue;

        // Skip if already embedded
        if (existingIds.includes(email.id)) {
          continue;
        }

        const headers = email.payload?.headers ?? [];
        const subject = headers.find((h: any) => h.name === "Subject")?.value ?? "";
        const from = headers.find((h: any) => h.name === "From")?.value ?? "";
        const snippet = email.snippet ?? "";

        const textToEmbed = `Subject: ${subject}\nFrom: ${from}\nSnippet: ${snippet}`;

        try {
          const embedding = await generateEmbedding([textToEmbed]);
          if (!embedding) continue;

          await db
            .insert(emailEmbeddings)
            .values({
              tenantid: tenantId,
              messageid: email.id,
              embedding,
            })
            .onConflictDoNothing();

          results.push({ messageId: email.id, success: true });
          embeddedCount++;
        } catch (err) {
          console.error(`[gmail-initial-sync] Embedding failed for ${email.id}:`, err);
          results.push({ messageId: email.id, success: false, error: String(err) });
        }
      }
      return results;
    });

    console.log(`[gmail-initial-sync] Embedded ${embeddedCount} new emails`);

    // Step 5: Mark sync as complete (or keep syncing if there are more pages)
    await step.run("mark-sync-complete", async () => {
      if (nextPageToken) {
        // More pages to sync — keep status as "syncing" so continuous sync picks it up
        await db
          .update(syncStatus)
          .set({
            gmailSync: "syncing",
            updatedAt: new Date(),
          })
          .where(eq(syncStatus.tenantId, tenantId));
      } else {
        // All done
        await db
          .insert(syncStatus)
          .values({
            tenantId,
            gmailSync: "success",
            gmailSyncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: syncStatus.tenantId,
            set: {
              gmailSync: "success",
              gmailSyncedAt: new Date(),
              gmailPageToken: null,
              updatedAt: new Date(),
            },
          });
      }
    });

    console.log(`[gmail-initial-sync] Sync complete for tenant: ${tenantId}`);

    return {
      success: true,
      totalFetched: fullEmails.length,
      alreadyEmbedded: existingIds.length,
      newlyEmbedded: embeddedCount,
    };
  }
);

/**
 * Gmail Continuous Sync
 *
 * Runs every 90 seconds via cron. Fetches the next 100 emails from
 * Gmail API using a stored page token, generates embeddings for new
 * ones, and stores the token for the next run. Stops when there are
 * no more pages (nextPageToken is null).
 */
export const gmailContinuousSync = inngest.createFunction(
  {
    id: "gmail-continuous-sync",
    triggers: {
      cron: "*/1 * * * *",
    },
  },
  async ({ step }) => {
    // Find tenants that are mid-sync (have a page token stored)
    const activeTenants = await step.run("find-active-tenants", async () => {
      return db
        .select({
          tenantId: syncStatus.tenantId,
          pageToken: syncStatus.gmailPageToken,
        })
        .from(syncStatus)
        .where(
          and(
            eq(syncStatus.gmailSync, "syncing"),
          )
        );
    });

    console.log(`[gmail-continuous-sync] Found ${activeTenants.length} active tenants`);

    for (const tenant of activeTenants) {
      const { tenantId, pageToken } = tenant;

      // Step 1: Fetch next 100 emails
      const result = await step.run(`fetch-batch-${tenantId}`, async () => {
        const t = corsair.withTenant(tenantId);
        const params: any = { maxResults: 100, q: "newer_than:30d" };
        if (pageToken) {
          params.pageToken = pageToken;
        }
        const res = await t.gmail.api.messages.list(params);
        return {
          messages: res.messages ?? [],
          nextPageToken: res.nextPageToken ?? null,
        };
      });

      const { messages, nextPageToken } = result;
      console.log(`[gmail-continuous-sync] Tenant ${tenantId}: fetched ${messages.length} messages, nextPageToken: ${nextPageToken ? "yes" : "none"}`);

      if (messages.length === 0) {
        // No more messages — mark sync as complete
        await step.run(`mark-complete-${tenantId}`, async () => {
          await db
            .update(syncStatus)
            .set({
              gmailSync: "success",
              gmailSyncedAt: new Date(),
              gmailPageToken: null,
              updatedAt: new Date(),
            })
            .where(eq(syncStatus.tenantId, tenantId));
        });
        continue;
      }

      // Step 2: Fetch full email details and embed new ones
      await step.run(`embed-batch-${tenantId}`, async () => {
        const t = corsair.withTenant(tenantId);

        for (const msg of messages) {
          if (!msg.id) continue;

          // Check if already embedded
          const existing = await db
            .select({ messageid: emailEmbeddings.messageid })
            .from(emailEmbeddings)
            .where(
              and(
                eq(emailEmbeddings.tenantid, tenantId),
                eq(emailEmbeddings.messageid, msg.id),
              )
            );

          if (existing.length > 0) continue;

          // Fetch full email
          let full: any;
          try {
            full = await t.gmail.api.messages.get({
              id: msg.id,
              format: "metadata",
              metadataHeaders: ["Subject", "From", "Date"],
            });
          } catch {
            continue;
          }

          const headers = full.payload?.headers ?? [];
          const subject = headers.find((h: any) => h.name === "Subject")?.value ?? "";
          const from = headers.find((h: any) => h.name === "From")?.value ?? "";
          const snippet = full.snippet ?? "";

          const textToEmbed = `Subject: ${subject}\nFrom: ${from}\nSnippet: ${snippet}`;

          try {
            const embedding = await generateEmbedding([textToEmbed]);
            if (!embedding) continue;

            await db
              .insert(emailEmbeddings)
              .values({
                tenantid: tenantId,
                messageid: msg.id,
                embedding,
              })
              .onConflictDoNothing();
          } catch (err) {
            console.error(`[gmail-continuous-sync] Embed failed for ${msg.id}:`, err);
          }
        }
      });

      // Step 3: Update page token or mark complete
      await step.run(`update-token-${tenantId}`, async () => {
        if (nextPageToken) {
          await db
            .update(syncStatus)
            .set({
              gmailPageToken: nextPageToken,
              updatedAt: new Date(),
            })
            .where(eq(syncStatus.tenantId, tenantId));
        } else {
          await db
            .update(syncStatus)
            .set({
              gmailSync: "success",
              gmailSyncedAt: new Date(),
              gmailPageToken: null,
              updatedAt: new Date(),
            })
            .where(eq(syncStatus.tenantId, tenantId));
        }
      });
    }

    return { processedTenants: activeTenants.length };
  }
);

/**
 * Gmail Webhook Handler
 *
 * Triggered by realtime webhooks AFTER initial sync.
 * Uses the Corsair DB side — no API calls needed.
 */
export const gmailChanged = inngest.createFunction(
  {
    id: "gmail-changed",
    triggers: {
      event: "gmail/message.changed",
    },
  },
  async ({ event, step }) => {
    console.log("[gmail-changed] Received event:", event.data);

    // Look up tenant from userPreferences
    const rows = await step.run("lookup-tenant", async () => {
      return db
        .select({ tenantId: userPreferences.tenantid })
        .from(userPreferences)
        .where(eq(userPreferences.emailid, event.data.emailAddress));
    });

    if (!rows.length || !rows[0].tenantId) {
      console.log("[gmail-changed] No tenant found for email:", event.data.emailAddress);
      return { success: false, reason: "tenant_not_found" };
    }

    const tenantId = rows[0].tenantId;

    // Insert notification
    await step.run("insert-notification", async () => {
      await db.insert(notifications).values({
        tenantId,
        title: "Mailbox Updated",
        body: `History ID ${event.data.historyId}`,
      });
    });

    // Query new emails from Corsair DB
    const emails = await step.run("query-db-emails", async () => {
      const tenant = corsair.withTenant(tenantId);
      return tenant.gmail.db.messages.search({
        limit: 10,
      });
    });

    console.log(`[gmail-changed] Found ${emails.length} emails for tenant ${tenantId}`);

    // Check which are already embedded, then embed new ones
    await step.run("embed-new-emails", async () => {
      for (const email of emails) {
        const data = email.data as any;
        const messageId = data?.id;
        if (!messageId) continue;

        // Check if already embedded
        const existing = await db
          .select({ messageid: emailEmbeddings.messageid })
          .from(emailEmbeddings)
          .where(
            and(
              eq(emailEmbeddings.tenantid, tenantId),
              eq(emailEmbeddings.messageid, messageId),
            )
          );

        if (existing.length > 0) {
          continue; // Already embedded, skip
        }

        const snippet = data?.snippet ?? "";
        const subject = data?.subject ?? "";
        const from = data?.from ?? "";

        const textToEmbed = `Subject: ${subject}\nFrom: ${from}\nSnippet: ${snippet}`;

        try {
          const embedding = await generateEmbedding([textToEmbed]);
          if (!embedding) continue;

          await db
            .insert(emailEmbeddings)
            .values({
              tenantid: tenantId,
              messageid: messageId,
              embedding,
            })
            .onConflictDoNothing();

          console.log(`[gmail-changed] Embedded email ${messageId}`);
        } catch (err) {
          console.error(`[gmail-changed] Embedding failed for ${messageId}:`, err);
        }
      }
    });

    return { success: true };
  }
);

/**
 * Daily Email Summary
 *
 * Runs every minute via cron. For each tenant whose configured
 * summaryTime matches the current IST time (Asia/Kolkata, UTC+5:30),
 * fetches the last 24h of emails and stores a summary notification.
 */
export const dailyEmailSummary = inngest.createFunction(
  {
    id: "daily-email-summary",
    triggers: {
      cron: "* * * * *",
    },
  },
  async ({ step }) => {
    // Get current IST time in HH:MM format
    const now = new Date();
    const istParts = new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).formatToParts(now);
    const istHH = istParts.find((p) => p.type === "hour")?.value ?? "00";
    const istMM = istParts.find((p) => p.type === "minute")?.value ?? "00";
    const currentHHMM = `${istHH}:${istMM}`;

    console.log(`[daily-email-summary] IST time: ${currentHHMM}`);

    // Find tenants whose summaryTime matches current IST HH:MM
    const tenants = await step.run("find-due-tenants", async () => {
      return db
        .select({
          tenantId: userPreferences.tenantid,
          emailId: userPreferences.emailid,
        })
        .from(userPreferences)
        .where(eq(userPreferences.summaryTime, `${currentHHMM}:00`));
    });

    if (tenants.length === 0) {
      console.log(`[daily-email-summary] No tenants due at ${currentHHMM}`);
      return { processed: 0 };
    }

    console.log(`[daily-email-summary] Found ${tenants.length} tenants due`);

    let processed = 0;
    for (const tenant of tenants) {
      try {
        const summary = await step.run(`generate-summary-${tenant.tenantId}`, async () => {
          const t = corsair.withTenant(tenant.tenantId);
          const messages = await t.gmail.db.messages.search({ limit: 200 });

          const nowMs = Date.now();
          const twentyFourHoursAgo = nowMs - 24 * 60 * 60 * 1000;

          // Filter to last 24h
          const recent = messages.filter((msg) => {
            const data = msg.data as any;
            const internalDate = Number(data?.internalDate || 0);
            return internalDate >= twentyFourHoursAgo;
          });

          if (recent.length === 0) {
            return { count: 0, body: "No new emails in the last 24 hours." };
          }

          // Build a compact summary
          const subjects = recent.map((msg) => {
            const data = msg.data as any;
            const headers = data?.payload?.headers ?? [];
            const subject = headers.find((h: any) => h.name === "Subject")?.value ?? data?.subject ?? "(no subject)";
            const from = headers.find((h: any) => h.name === "From")?.value ?? data?.from ?? "";
            const fromName = from.match(/^"?([^"<]+)"?\s*</)?.[1]?.trim() ?? from.split("@")[0] ?? "";
            return `• ${fromName ? fromName + ": " : ""}${subject}`;
          });

          const body = [
            `📧 Email Summary — Last 24 hours`,
            ``,
            `${recent.length} email${recent.length === 1 ? "" : "s"} received.`,
            ``,
            ...subjects.slice(0, 20),
            subjects.length > 20 ? `\n...and ${subjects.length - 20} more` : "",
          ].join("\n");

          return { count: recent.length, body };
        });

        // Store as notification
        await step.run(`store-notification-${tenant.tenantId}`, async () => {
          await db.insert(notifications).values({
            tenantId: tenant.tenantId,
            title: `Daily Email Summary — ${summary.count} emails`,
            body: summary.body,
          });
        });

        processed++;
        console.log(`[daily-email-summary] Summary sent to ${tenant.tenantId}: ${summary.count} emails`);
      } catch (err) {
        console.error(`[daily-email-summary] Failed for ${tenant.tenantId}:`, err);
      }
    }

    return { processed };
  }
);
