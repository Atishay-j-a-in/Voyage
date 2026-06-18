import "server-only";
import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { pool } from "@/db/db";

/**
 * Server-only corsair instance.
 *
 * The Voyage project uses a multi-tenant model where the Clerk user
 * id is the tenant id. The DB is the existing pg pool from `db/db.ts`.
 *
 * - multiTenancy: true  -> always call `corsair.withTenant(userId)`
 *   before issuing any tenant-scoped call.
 * - The instance is cached on globalThis so Next.js dev-mode HMR
 *   does not keep recreating it.
 *
 * Required env:
 *   CORSAIR_KEK  - 32-byte base64 key (openssl rand -base64 32).
 *                  The corsair.setup step is run once per plugin
 *                  integration (gmail / googlecalendar) to write
 *                  client_id / client_secret into corsair_integrations.
 */
declare global {
  // eslint-disable-next-line no-var
  var __voyage_corsair: ReturnType<typeof createCorsair> | undefined;
}

function buildCorsair() {
  const kek = process.env.CORSAIR_KEK;
  if (!kek) {
    throw new Error(
      "[corsair] CORSAIR_KEK is not set. Generate one with `openssl rand -base64 32` and add it to .env.",
    );
  }
  return createCorsair({
    plugins: [gmail(), googlecalendar()],
    database: pool,
    kek,
    multiTenancy: true,
  });
}

export const corsair = globalThis.__voyage_corsair ?? buildCorsair();
if (process.env.NODE_ENV !== "production") {
  globalThis.__voyage_corsair = corsair;
}