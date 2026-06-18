import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/dist/server/web/spec-extension/response";

/**
 * Next.js 16 uses `proxy.ts` (not `middleware.ts`) for middleware.
 * The matcher + route-protection pattern is identical; only the
 * filename changes.
 */

const isProtectedRoute = createRouteMatcher([
  "/workspace(.*)",
  "/loading",
]);

const backendRoutes = createRouteMatcher([
  "/api/connect(.*)","/api/auth(.*)","/api/emails(.*)","/api/search(.*)","/api/chat(.*)","/api/calendar(.*)",
  "/api/contacts(.*)","/api/summary(.*)","/api/keys(.*)","/api/subscription(.*)","/api/user-preferences(.*)",
])
export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated } = await auth()
  // Auth.protect() auto-redirects unauthenticated users to the configured
  // sign-in URL (NEXT_PUBLIC_CLERK_SIGN_IN_URL, defaulting to /sign-in).
  if (isProtectedRoute(req)) {

    await auth.protect();
  }
  if (backendRoutes(req) && !isAuthenticated){
    return new NextResponse('Unauthorized', { status: 401 })
  }
});

export const config = {
  // Match all routes except Next internals and static assets.
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
