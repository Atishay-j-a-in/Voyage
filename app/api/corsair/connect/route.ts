import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateOAuthUrl } from "corsair/oauth";
import { corsair } from "@/lib/corsair";
import {
  CORSAIR_REDIRECT_URI,
  OAUTH_STATE_COOKIE,
  SUPPORTED_PLUGINS,
  type SupportedPlugin,
} from "@/lib/integrations";

/**
 * POST /api/corsair/connect
 * body: { plugin: "gmail" | "googlecalendar" }
 *
 * The Voyager doc-security rule:
 *   - This route is authenticated.
 *   - The tenantId is the Clerk session user id, NEVER a query
 *     parameter.
 *   - We mint a state cookie (HMAC-signed by corsair) and return
 *     the provider's auth URL to the client, which then does
 *     window.location.assign(url). Doing the redirect server-side
 *     would lose the React state we want preserved (the user came
 *     here from the workspace dialog).
 */
export async function POST(request: Request): Promise<NextResponse> {
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

  const plugin = (body as { plugin?: string } | null)?.plugin;
  if (!plugin || !SUPPORTED_PLUGINS.includes(plugin as SupportedPlugin)) {
    return NextResponse.json(
      { error: "plugin must be one of: " + SUPPORTED_PLUGINS.join(", ") },
      { status: 400 },
    );
  }

  let url: string;
  let state: string;
  try {
    const result = await generateOAuthUrl(corsair, plugin, {
      tenantId: userId,
      redirectUri: CORSAIR_REDIRECT_URI,
    });
    url = result.url;
    state = result.state;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to build OAuth URL: ${message}` },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ url });
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });
  return res;
}