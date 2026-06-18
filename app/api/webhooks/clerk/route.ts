import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { subscriptions, userPreferences } from "@/db/schema";

/**
 * POST /api/webhooks/clerk
 *
 * Handles Clerk webhook events. When a user is created,
 * initializes their subscription (free plan) and user preferences.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const event = body.type;

  if (event === "user.created") {
    const userId = body.data?.id;
    const email = body.data?.email_addresses?.[0]?.email_address ?? "";

    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    try {
      // Create free subscription (10,000 tokens/month)
      await db
        .insert(subscriptions)
        .values({
          tenantId: userId,
          plan: "free",
          tokenLimit: 10000,
          tokenUsed: 0,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .onConflictDoNothing();

      // Create user preferences
      await db
        .insert(userPreferences)
        .values({
          tenantid: userId,
          emailid: email,
        })
        .onConflictDoNothing();

      console.log(`[webhooks/clerk] Initialized subscription for ${userId}`);
    } catch (err) {
      console.error("[webhooks/clerk] Error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
