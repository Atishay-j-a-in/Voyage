import { ArrowRight, PlayCircle } from "./shared/icons";
import { GetStartedLink } from "./shared/GetStartedLink";
import styles from "./Stage.module.css";

/**
 * Center-aligned cinematic hero. The hero is the ONLY section that has
 * a transparent background, so the WebGL warp sim reads as the full
 * backdrop. Subsequent sections apply a semi-transparent black overlay.
 *
 * The primary CTA navigates to /sign-up so visitors can launch their
 * voyage without a separate sign-in detour.
 */
export function Hero(): React.ReactElement {
  return (
    <div
      id="top"
      className="relative min-h-[100dvh] flex flex-col px-4 md:px-8 py-12 md:py-16"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-5xl mx-auto w-full pt-24 md:pt-28">
        <h1 className="font-sans font-semibold tracking-[-0.04em] leading-[1.02] text-white text-[clamp(3rem,7vw,5.75rem)] text-balance">
          Your time.
          <br />
          <span className="text-[var(--accent-neon)]">Navigated</span>.
        </h1>

        <p className="mt-7 max-w-[52ch] text-white/75 text-base md:text-lg leading-relaxed">
          Voyage is your AI co-pilot for email and calendar —
          <br className="hidden sm:inline" />
          helping you focus on what truly matters.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <GetStartedLink
            href="/sign-up"
            className={`${styles.cta} bg-white text-black px-7 py-3.5 text-base gap-2 hover:bg-[var(--accent-neon)]`}
          >
            Start your journey
            <ArrowRight className="h-4 w-4" />
          </GetStartedLink>

          <a
            href="#features"
            className={`${styles.cta} inline-flex items-center justify-center gap-2 bg-transparent text-white font-medium text-base px-5 py-3.5 rounded-full border border-white/15 transition-colors duration-300 hover:bg-white/5`}
          >
            <PlayCircle className="h-4 w-4 text-[var(--accent-neon)]" />
            Watch how it works
          </a>
        </div>

       
      </div>
    </div>
  );
}
