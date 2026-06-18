import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/lib/corsair";
import { inngest } from "@/inngest/client";
import { OAUTH_STATE_COOKIE } from "@/lib/integrations";

/**
 * GET /api/corsair/callback
 * query: ?code=...&state=...
 *
 * Google redirects the user here after they approve the OAuth
 * grant. We:
 *   1. Verify the user is signed in (defence in depth; the
 *      middleware also enforces this).
 *   2. Verify the `state` returned by Google matches the
 *      `oauth_state` cookie we set in /api/corsair/connect.
 *      This is the CSRF protection recommended by the
 *      corsair Production OAuth guide.
 *   3. Hand off to `processOAuthCallback` - this exchanges the
 *      code for tokens and writes the encrypted account row
 *      into `corsair_accounts`.
 *   4. Mirror the connection into `user_preferences` so the
 *      Settings tray can show live connected state without a
 *      join against corsair_accounts.
 *   5. If Gmail connected, trigger initial sync via Inngest.
 *   6. Clear the cookie and redirect to /workspace. The
 *      workspace page server-checks the integration status and
 *      either shows the connect dialog (if nothing linked) or
 *      the actual shell.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");

  // Build a redirect back to /workspace that the client can
  // also follow on any failure. We always clear the cookie.
  const backToWorkspace = (): NextResponse => {
    const res = NextResponse.redirect(new URL("/workspace", url));
    res.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return res;
  };

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", url));
  }

  if (providerError) {
    // The user denied the grant at Google's consent screen. Take
    // them back to /workspace; the dialog will reappear because
    // the account row was never written.
    console.warn(`[corsair/callback] provider error: ${providerError}`);
    return backToWorkspace();
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 },
    );
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const storedState = readCookie(cookieHeader, OAUTH_STATE_COOKIE);
  if (!storedState || storedState !== state) {
    // CSRF: the state from the URL does not match the one we
    // set. Drop the cookie and reject.
    return NextResponse.json(
      { error: "Invalid state (possible CSRF)" },
      { status: 400 },
    );
  }

  try {
    const result = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: `${process.env.APP_URL ?? new URL("/", url).origin}/api/corsair/callback`,
    });

    console.log(`[corsair/callback] OAuth success. Plugin: ${result.plugin}, Tenant: ${userId}`);

    // If Gmail was just connected, trigger initial sync
    if (result.plugin === "gmail") {
      console.log(`[corsair/callback] Gmail connected for tenant ${userId}, triggering initial sync`);
      await inngest.send({
        name: "gmail.initial-sync",
        data: { tenantId: userId },
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[corsair/callback] failed: ${message}`);
    return backToWorkspace();
  }

  return backToWorkspace();
}

/** Tiny cookie parser. Avoids depending on a heavier helper. */
function readCookie(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq);
    if (k === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
}