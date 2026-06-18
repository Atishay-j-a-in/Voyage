"use client";

import { useWarpSim } from "./useWarpSim";
import { Hero } from "./Hero";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { FeaturesSection } from "./sections/FeaturesSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";
import { IntegrationsSection } from "./sections/IntegrationsSection";
import { PricingSection } from "./sections/PricingSection";
import { FinalCtaSection } from "./sections/FinalCtaSection";
import styles from "./Stage.module.css";

/**
 * Page composition:
 *  - z=0  : fixed full-bleed WebGL canvas (warp sim).
 *  - z=5  : content sections stacked on top, each with a semi-transparent
 *           black overlay so the warp reads as a subtle backdrop. Outer
 *           wrappers use `pointer-events: none`; cards/buttons/links
 *           re-enable (handled in shared.module.css).
 *  - z=50 : floating glass Nav.
 */
export function Stage(): React.ReactElement {
  const { canvasRef, error } = useWarpSim();

  return (
    <>
      <div className={styles.canvasLayer} aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>

      <Nav />

      <main className={styles.overlay}>
        <Hero />
        <FeaturesSection />
        <TestimonialsSection />
        <IntegrationsSection />
        <PricingSection />
        <FinalCtaSection />
        <Footer />
      </main>

      {error ? (
        <p
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md text-center text-xs font-mono tracking-widest uppercase text-white/60 z-50"
        >
          {error instanceof Error ? error.message : "WebGL unavailable"}
        </p>
      ) : null}
    </>
  );
}
