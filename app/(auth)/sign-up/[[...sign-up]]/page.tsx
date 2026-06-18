"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignUp, useUser } from "@clerk/nextjs";

import { WarpBackground } from "../../../_components/auth/WarpBackground";
import { BrandingPanel } from "../../../_components/auth/BrandingPanel";
import { voyageAuthAppearance } from "../../../_components/auth/clerkAppearance";
import type { SimMode } from "../../../_components/voyage/warp";

/**
 * Sign-up page. Same env-resilience pattern as sign-in: pass
 * `forceRedirectUrl` explicitly so a stale dev-server env does not
 * bounce us to /workspace.
 */
export default function SignUpPage(): React.ReactElement {
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
          <BrandingPanel variant="sign-up" />
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
              <SignUp
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