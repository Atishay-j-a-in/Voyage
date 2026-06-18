import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { userPreferences } from "@/db/schema";

/**
 * Per-user settings that the workspace reads on the server
 * (and that the settings tray in the workspace mutates from
 * the client). Mirrors the columns on `user_preferences`.
 *
 * - `isOrbActive` is user-controlled. The FloatingOrb in the
 *   workspace is only mounted when this is true.
 * - `isMailConnected` / `isCalendarConnected` are derived
 *   from the OAuth flow. `getIntegrationStatus` (in
 *   `lib/integrations.ts`) recomputes them from
 *   `corsair_accounts` and writes the result here on every
 *   workspace load. The settings panel reads these as
 *   read-only status.
 */
export interface UserPreferences {
  isOrbActive: boolean;
  isMailConnected: boolean;
  isCalendarConnected: boolean;
  summaryTime: string; // HH:MM:SS format
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  isOrbActive: true,
  isMailConnected: false,
  isCalendarConnected: false,
  summaryTime: "09:00:00",
};

/**
 * Read the user's preferences row. Creates one with defaults
 * if the user is brand new.
 */
export async function getUserPreferences(tenantId: string, email: string): Promise<UserPreferences> {
  const rows = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.tenantid, tenantId))
    .limit(1);

  let row = rows[0];
  if (!row) {
    const inserted = await db
      .insert(userPreferences)
      .values({
        tenantid: tenantId,
        emailid: email,
        isOrbActive: true,
        isMailConnected: false,
        isCalendarConnected: false,
      })
      .onConflictDoNothing({
        target: userPreferences.tenantid,
      })
      .returning();
    row = inserted[0];
    if (!row) {
      const retry = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.tenantid, tenantId))
        .limit(1);
      row = retry[0];
    }
  }

  return {
    isOrbActive: row.isOrbActive,
    isMailConnected: row.isMailConnected,
    isCalendarConnected: row.isCalendarConnected,
    summaryTime: row.summaryTime ?? "09:00:00",
  };
}

/**
 * Toggle `isOrbActive` for the user. Returns the new value.
 * Idempotent.
 */
export async function setOrbActive(tenantId: string, isOrbActive: boolean): Promise<boolean> {
  await db
    .update(userPreferences)
    .set({ tenantid: tenantId,isOrbActive: isOrbActive , updatedAt: new Date() }).where(eq(userPreferences.tenantid, tenantId))

 
  return isOrbActive;
}

/**
 * Update the summary time for the user. Accepts HH:MM or HH:MM:SS.
 * Returns the stored value.
 */
export async function setSummaryTime(tenantId: string, summaryTime: string): Promise<string> {
  // Normalise to HH:MM:SS
  const normalized = summaryTime.length === 5 ? `${summaryTime}:00` : summaryTime;
  await db
    .update(userPreferences)
    .set({ summaryTime: normalized, updatedAt: new Date() })
    .where(eq(userPreferences.tenantid, tenantId));
  return normalized;
}

/**
 * Mark one of the connected flags. Called by the OAuth callback
 * after a successful connect. Idempotent.
 */
export async function setConnectedFlag(
  tenantId: string,
  flag: "isMailConnected" | "isCalendarConnected",
  value: boolean,
): Promise<void> {


  await db
    .update(userPreferences)
    .set({ [flag]: value, updatedAt: new Date() })
    .where(eq(userPreferences.tenantid, tenantId));
}