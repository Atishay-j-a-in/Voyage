import "server-only";
import { db } from "@/db/db";
import { corsairAccounts, corsairIntegrations } from "@/db/corsair";
import {  eq } from "drizzle-orm";
import { userPreferences } from "@/db/schema";
/** Plugin ids registered by the @corsair-dev/* plugins. */

export const SUPPORTED_PLUGINS = ["gmail", "googlecalendar"] as const;
export type SupportedPlugin = (typeof SUPPORTED_PLUGINS)[number];

/** The redirect uri that providers (Google) will call back to. */
export const CORSAIR_REDIRECT_URI = `${process.env.APP_URL ?? "http://localhost:3000"}/api/corsair/callback`;

/** Cookie name used to carry the HMAC-signed OAuth state. */
export const OAUTH_STATE_COOKIE = "corsair_oauth_state";

/**
 * The minimum set of plugins the user must connect at least one
 * of to enter the workspace. The product brief: "at least one
 * of Gmail or Google Calendar".
 */
export const REQUIRED_AT_LEAST_ONE: readonly SupportedPlugin[] = [
  "gmail",
  "googlecalendar",
];

export interface IntegrationStatus {
  /** True when both required plugins are connected. */
  hasBoth: boolean;
}

/**
 * Look up which of the supported plugins the given tenant has
 * linked.
 *
 * We query `corsair_accounts` directly rather than joining
 * `corsair_integrations`. Two reasons:
 *   1. The check is "does this tenant have an account row for
 *      this plugin id?" - the integrations table is the catalog
 *      of available plugins. The account row IS the fact we
 *      care about.
 *   2. If `corsair setup` has never been run, the integrations
 *      table is empty, and a join from it would return zero
 *      rows and falsely report "no integrations". Querying
 *      accounts directly is robust either way.
 *
 * Cost: a single index lookup on (tenant_id, integration_id).
 */
export async function getIntegrationStatus(tenantId: string): Promise<IntegrationStatus> {
  
  const integrations = await db
  .select({
    integrationName: corsairIntegrations.name,
  })
  .from(corsairAccounts)
  .innerJoin(
    corsairIntegrations,
    eq(corsairAccounts.integrationId, corsairIntegrations.id)
  )
  .where(eq(corsairAccounts.tenantId, tenantId));
  const connected = integrations.map((integration) =>{
    return integration.integrationName;
  } )

  const gmail = connected.includes("gmail");
  const googlecalendar = connected.includes("googlecalendar");
  await db
  .update(userPreferences)
  .set({
    isMailConnected: gmail,
    isCalendarConnected: googlecalendar,
    updatedAt: new Date(),
  })
  .where(eq(userPreferences.tenantid, tenantId));
  // await db.insert(userPreferences).values({
  //   tenantid: tenantId,
  //   isOrbActive: true,
  //   isGoogleConnected: gmail,
  //   isCalendarConnected: googlecalendar,
  // }).onConflictDoNothing();
  return {
    hasBoth: gmail && googlecalendar,
  };
}