"use client";

import { GetStartedLink } from "./shared/GetStartedLink";
import styles from "./shared/shared.module.css";
import Image from "next/image";

/**
 * Floating glass nav. Pointer events are auto so it remains clickable
 * above the WebGL canvas. The nav has a fixed minimum height so the
 * logo image (rendered at 40px / h-10) can never blow up the pill.
 */
export function Nav(): React.ReactElement {
  return (
    <nav
      style={{ minHeight: 64 }}
      className={`${styles.nav} fixed top-6 md:top-8 left-1/2 -translate-x-1/2 mx-auto w-max max-w-[calc(100vw-2rem)] rounded-full border border-white/10 bg-[var(--bg-glass)] backdrop-blur-xl px-3 md:px-5 py-2 flex items-center gap-3 md:gap-5 lg:gap-6 text-[13px] text-white/85 shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50`}
    >
      <a
        href="#top"
        className="flex items-center gap-2 font-bold tracking-[-0.02em] text-white text-[15px] shrink-0"
      >
        <Image
          src="/favicon.png"
          alt="Voyage logo"
          width={100}
          height={100}
          className="h-10 w-10 shrink-0 object-contain"
          priority
        />
        <span className="leading-none">VOYAGE</span>
      </a>
      <span className="h-5 w-px bg-white/10" aria-hidden="true" />
      <a
        href="#features"
        className="text-white/70 hover:text-white transition-colors duration-300 hidden sm:inline"
      >
        Features
      </a>
      <a
        href="#integrations"
        className="text-white/70 hover:text-white transition-colors duration-300 hidden md:inline"
      >
        Integrations
      </a>
      <a
        href="#pricing"
        className="text-white/70 hover:text-white transition-colors duration-300 hidden sm:inline"
      >
        Pricing
      </a>
      <GetStartedLink href="/sign-in" variant="pill">
        Get Started
      </GetStartedLink>
    </nav>
  );
}

