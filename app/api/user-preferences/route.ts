import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { setOrbActive, setSummaryTime } from "@/lib/userPreferences";

/**
 * PATCH /api/user-preferences
 * body: { isOrbActive?: boolean, summaryTime?: string }
 *
 * Auth-gated. The Clerk user id is the tenant id.
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body as { isOrbActive?: unknown; summaryTime?: string } | null;

  // Handle isOrbActive toggle
  if (payload?.isOrbActive !== undefined) {
    if (typeof payload.isOrbActive !== "boolean") {
      return NextResponse.json(
        { error: "isOrbActive must be a boolean" },
        { status: 400 },
      );
    }
    const isOrbActive = await setOrbActive(userId, payload.isOrbActive);
    return NextResponse.json({ isOrbActive });
  }

  // Handle summaryTime update
  if (payload?.summaryTime !== undefined) {
    const time = payload.summaryTime;
    // Validate HH:MM or HH:MM:SS
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
      return NextResponse.json(
        { error: "summaryTime must be in HH:MM or HH:MM:SS format" },
        { status: 400 },
      );
    }
    const summaryTime = await setSummaryTime(userId, time);
    return NextResponse.json({ summaryTime });
  }

  return NextResponse.json(
    { error: "Provide isOrbActive or summaryTime" },
    { status: 400 },
  );
}