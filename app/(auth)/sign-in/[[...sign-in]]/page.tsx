"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignIn, useUser } from "@clerk/nextjs";

import { WarpBackground } from "../../../_components/auth/WarpBackground";
import { BrandingPanel } from "../../../_components/auth/BrandingPanel";
import { voyageAuthAppearance } from "../../../_components/auth/clerkAppearance";
import type { SimMode } from "../../../_components/voyage/warp";

/**
 * Sign-in page.
 *
 * We pass `forceRedirectUrl="/loading"` explicitly so Clerk's HOC
 * redirects to the loading route regardless of any env-var staleness
 * on the dev server (Next.js inlines `NEXT_PUBLIC_*` at startup, so
 * editing `.env` and hot-reloading does NOT pick up the new value
 * until the server is restarted). Pairing that with the unmount
 * guard below makes the navigation airtight.
 */
export default function SignInPage(): React.ReactElement {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const modeRef = useRef<SimMode>("slow");

  useEffect(() => {
    if (isLoaded && isSignedIn) router.push("/loading");
  }, [isLoaded, isSignedIn, router]);

  const showForm = isLoaded && !isSignedIn;

  return (
    <main className="relative min-h-[100dvh] w-full text-white">
      <WarpBackground modeRef={modeRef} />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-[100dvh]">
        <section className="flex items-center justify-center px-6 md:px-10">
          <BrandingPanel variant="sign-in" />
        </section>

        <section
          className="flex items-center justify-center px-6 md:px-10 py-16"
          style={{
            background:
              "linear-gradient(180deg, rgba(2, 3, 5, 0.86) 0%, rgba(2, 3, 5, 0.94) 100%)",
          }}
        >
          <div className="w-full max-w-[460px]">
            {showForm && (
              <SignIn
                appearance={voyageAuthAppearance}
                routing="hash"
                forceRedirectUrl="/loading"
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}