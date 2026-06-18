import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { corsair } from "@/server/corsair";

function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function decodeBase64(data: string): string {
  try {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function formatISTDate(epochOrDate: string | number): string {
  const ts = typeof epochOrDate === "string" ? Number(epochOrDate) : epochOrDate;
  if (!ts || isNaN(ts)) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    return d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } else if (diffHours < 48) {
    return "Yesterday";
  } else {
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }
}

function extractSenderName(from: string): string {
  if (!from) return "Unknown";
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return decodeHtmlEntities(match[1].trim());
  if (from.includes("@")) {
    const part = from.split("@")[0];
    return decodeHtmlEntities(part.replace(/[._-]/g, " "));
  }
  return decodeHtmlEntities(from);
}

function getHeader(headers: any[], name: string): string {
  if (!Array.isArray(headers) || headers.length === 0) return "";
  return headers.find((h: any) => h.name === name)?.value ?? "";
}

function extractBody(payload: any): string {
  if (!payload) return "";

  // Try body.data directly
  if (payload.body?.data) {
    return decodeHtmlEntities(decodeBase64(payload.body.data));
  }

  // Try parts
  if (payload.parts) {
    const textPart = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return decodeHtmlEntities(decodeBase64(textPart.body.data));
    }
    const htmlPart = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      const html = decodeBase64(htmlPart.body.data);
      return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    }
  }

  return "";
}

/**
 * GET /api/emails
 *
 * Returns synced emails from the Corsair DB.
 * Fetches individual messages, groups by threadId.
 */
export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenant = corsair.withTenant(userId);

    // Fetch individual messages from DB
    const messages = await tenant.gmail.db.messages.search({
      limit: 100,
    });

    console.log(`[api/emails] Fetched ${messages.length} messages for tenant ${userId}`);

    // Log first message for debugging
    if (messages.length > 0) {
      const firstData = messages[0].data as any;
      console.log("[api/emails] Sample data keys:", Object.keys(firstData || {}));
      console.log("[api/emails] Sample payload keys:", Object.keys(firstData?.payload || {}));
      console.log("[api/emails] Sample labels:", firstData?.labelIds);
      console.log("[api/emails] Sample snippet:", firstData?.snippet);
      console.log("[api/emails] Sample from:", firstData?.from);
      console.log("[api/emails] Sample subject:", firstData?.subject);
    }

    // Group messages by threadId
    const threadMap = new Map<string, any[]>();

    for (const msg of messages) {
      try {
        const data = msg.data as any;
        const labelIds: string[] = data?.labelIds ?? [];

        // Skip TRASH and SPAM
        if (labelIds.includes("TRASH") || labelIds.includes("SPAM")) continue;

        const threadId = data?.threadId ?? msg.entity_id ?? msg.id;
        if (!threadMap.has(threadId)) {
          threadMap.set(threadId, []);
        }
        threadMap.get(threadId)!.push(msg);
      } catch (err) {
        console.error("[api/emails] Error reading message:", err);
      }
    }

    console.log(`[api/emails] Grouped into ${threadMap.size} threads`);

    // Convert each thread group to EmailThread format
    const emailThreads: any[] = [];

    for (const [threadId, threadMessages] of threadMap) {
      try {
        // Sort by internalDate ascending (oldest first)
        threadMessages.sort((a, b) => {
          const aData = a.data as any;
          const bData = b.data as any;
          return Number(aData?.internalDate || 0) - Number(bData?.internalDate || 0);
        });

        // Get the latest message
        const latestMsg = threadMessages[threadMessages.length - 1];
        const latestData = latestMsg.data as any;
        const latestHeaders = latestData?.payload?.headers ?? [];

        // Get subject from first message
        const firstMsg = threadMessages[0];
        const firstData = firstMsg.data as any;
        const firstHeaders = firstData?.payload?.headers ?? [];

        // Try headers first, then data.subject, then snippet
        const subject = decodeHtmlEntities(
          getHeader(firstHeaders, "Subject") ||
          firstData?.subject ||
          firstData?.snippet?.slice(0, 80) ||
          "(no subject)"
        );

        // Try headers first, then data.from
        const from = getHeader(latestHeaders, "From") || latestData?.from || "";

        // Use snippet as the main content since headers may be empty
        const snippet = decodeHtmlEntities(latestData?.snippet || "");

        const internalDate = latestData?.internalDate || "";

        // Check labels across all messages
        const allLabelIds: string[] = threadMessages.flatMap((m) => {
          const d = m.data as any;
          return (d?.labelIds ?? []) as string[];
        });
        const isUnread = allLabelIds.includes("UNREAD");
        const isStarred = allLabelIds.includes("STARRED");
        const isImportant = allLabelIds.includes("IMPORTANT") || allLabelIds.includes("CATEGORY_PRIMARY");

        // Build body from all messages
        const bodyLines = threadMessages.map((m) => {
          const d = m.data as any;
          const headers = d?.payload?.headers ?? [];
          const msgFrom = getHeader(headers, "From") || d?.from || "";
          const msgDate = d?.internalDate || "";
          const msgBody = extractBody(d?.payload);
          const msgSnippet = decodeHtmlEntities(d?.snippet || "");
          const senderName = extractSenderName(msgFrom);
          const timestamp = formatISTDate(msgDate);
          return `[${senderName} — ${timestamp}]\n${msgBody || msgSnippet || "(empty)"}`;
        });

        emailThreads.push({
          id: threadId,
          sender: from ? extractSenderName(from) : "You",
          subject,
          snippet: snippet || bodyLines[0]?.slice(0, 120) || "",
          timestamp: formatISTDate(internalDate),
          isPrimary: isImportant,
          isUnread,
          isStarred,
          isImportant,
          labels: allLabelIds,
          folder: allLabelIds.includes("SENT") ? "sent" : "inbox" as const,
          body: bodyLines,
          recipients: ["to me"],
          rawFrom: from,
          rawSubject: subject,
          rawDate: internalDate || "",
          messageCount: threadMessages.length,
        });
      } catch (err) {
        console.error("[api/emails] Error processing thread:", err);
      }
    }

    // Sort by date descending (newest first)
    emailThreads.sort((a, b) => {
      return Number(b.rawDate || 0) - Number(a.rawDate || 0);
    });

    console.log(`[api/emails] Returning ${emailThreads.length} threads`);

    return NextResponse.json({ emails: emailThreads, total: emailThreads.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api/emails] Failed:", message);
    return NextResponse.json({ error: message, emails: [], total: 0 }, { status: 500 });
  }
}
