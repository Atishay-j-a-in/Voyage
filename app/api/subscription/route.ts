import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { subscriptions, aiUsageEvents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * GET /api/subscription
 * Returns the current subscription and usage stats for the tenant.
 */
export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get subscription
  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, userId))
    .limit(1);

  const sub = subRows[0] ?? {
    plan: "free",
    tokenLimit: 10000,
    tokenUsed: 0,
  };

  // Get total tokens used
  const usageResult = await db
    .select({
      totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`,
      totalRequests: sql<number>`count(*)`,
    })
    .from(aiUsageEvents)
    .where(eq(aiUsageEvents.tenantId, userId));

  const usage = usageResult[0] ?? { totalTokens: 0, totalRequests: 0 };

  return NextResponse.json({
    plan: sub.plan,
    tokenLimit: sub.tokenLimit,
    tokenUsed: sub.tokenUsed ?? 0,
    totalTokensAllTime: Number(usage.totalTokens),
    totalRequests: Number(usage.totalRequests),
  });
}
