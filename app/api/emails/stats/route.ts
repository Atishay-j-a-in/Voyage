import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { corsair } from "@/server/corsair";

/**
 * GET /api/emails/stats
 *
 * Returns email count for the last 24 hours.
 */
export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenant = corsair.withTenant(userId);
    const messages = await tenant.gmail.db.messages.search({ limit: 200 });

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    let count = 0;
    for (const msg of messages) {
      const data = msg.data as any;
      const internalDate = Number(data?.internalDate || 0);
      if (internalDate >= twentyFourHoursAgo) {
        count++;
      }
    }

    return NextResponse.json({ count });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api/emails/stats] Failed:", message);
    return NextResponse.json({ count: 0, error: message }, { status: 500 });
  }
}
