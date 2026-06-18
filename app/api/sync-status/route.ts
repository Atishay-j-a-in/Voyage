import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { syncStatus } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(syncStatus)
    .where(eq(syncStatus.tenantId, userId))
    .limit(1);

  const row = rows[0];

  return NextResponse.json({
    gmailSync: row?.gmailSync ?? "idle",
    calendarSync: row?.calendarSync ?? "idle",
    gmailSyncedAt: row?.gmailSyncedAt ?? null,
    calendarSyncedAt: row?.calendarSyncedAt ?? null,
    updatedAt: row?.updatedAt ?? null,
  });
}