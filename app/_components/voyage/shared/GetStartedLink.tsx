import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./shared.module.css";

interface GetStartedLinkProps {
  href?: string;
  variant?: "primary" | "outlineNeon" | "outlineWhite" | "pill";
  className?: string;
  children: ReactNode;
}

/**
 * Anchor that sends the user to the sign-up page. The default
 * destination is `/sign-up` (per the Clerk env config). Pass a
 * different `href` to override (e.g. the Nav uses `/sign-in`).
 *
 * Renders as a styled link that matches the Voyage CTA aesthetic
 * without forcing a full page reload — Next's `<Link>` does
 * client-side navigation, which keeps the warp sim in place until
 * the route actually changes.
 */
export function GetStartedLink({
  href = "/sign-up",
  variant = "primary",
  className = "",
  children,
}: GetStartedLinkProps): React.ReactElement {
  const variantClass =
    variant === "primary"
      ? styles.primaryBtn
      : variant === "outlineNeon"
      ? styles.outlineNeonBtn
      : variant === "pill"
      ? "inline-flex items-center justify-center shrink-0 font-semibold text-[13px] px-4 py-1.5 rounded-full transition-[transform,background-color] duration-300 hover:scale-105 hover:bg-[var(--accent-neon)]"
      : "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3.5 text-white font-medium text-base bg-transparent transition-colors duration-300 hover:bg-white/5";

  return (
    <Link href={href} className={`${variantClass} ${className}`}>
      {children}
    </Link>
  );
}
