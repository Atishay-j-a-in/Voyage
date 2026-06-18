"use client";

import type { ReactNode } from "react";
import { Sparkles, ArrowRight, Lock } from "../voyage/shared/icons";
import styles from "./auth.module.css";

interface AuthCardProps {
  cardTitle: string;
  primaryLabel: string;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  onPrimarySubmit: (e: React.FormEvent) => void;
  /** OAuth row. Renders above the divider. */
  oAuthSlot: ReactNode;
  /** Body of the form (fields + helper links). */
  formSlot: ReactNode;
  /** Optional inline error to display under the form. */
  error?: string | null;
}

/** "Mission Access" / "Mission Registration" card per the design. */
export function AuthCard({
  cardTitle,
  primaryLabel,
  primaryLoading = false,
  primaryDisabled = false,
  onPrimarySubmit,
  oAuthSlot,
  formSlot,
  error,
}: AuthCardProps): React.ReactElement {
  return (
    <div className={styles.card}>
      <div className="flex flex-col items-center gap-2 mb-7">
        <Sparkles className="h-5 w-5 text-[var(--accent-neon)]" />
        <h2 className="text-[var(--accent-neon)] text-2xl font-semibold tracking-[-0.02em]">
          {cardTitle}
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        {oAuthSlot}

        <Divider label="or" />

        <form onSubmit={onPrimarySubmit} className="flex flex-col gap-4">
          {formSlot}
          {error ? (
            <p role="alert" className="text-red-400 text-sm">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={primaryDisabled || primaryLoading}
            className={styles.primaryCta}
          >
            <span>{primaryLoading ? "Launching..." : primaryLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function Divider({ label }: { label: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-3 my-1">
      <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
      <span className="text-white/45 text-xs uppercase tracking-widest">{label}</span>
      <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
    </div>
  );
}

interface SecondaryCardProps {
  leftTitle: string;
  leftSubtitle: string;
  buttonLabel: string;
  onButtonClick: () => void;
}

export function SecondaryCard({
  leftTitle,
  leftSubtitle,
  buttonLabel,
  onButtonClick,
}: SecondaryCardProps): React.ReactElement {
  return (
    <div className={styles.secondaryCard}>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-tight">{leftTitle}</p>
        <p className="text-white/55 text-sm mt-1">{leftSubtitle}</p>
      </div>
      <button type="button" onClick={onButtonClick} className={styles.secondaryCta}>
        <span>{buttonLabel}</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TrustFooter(): React.ReactElement {
  return (
    <p className="mt-8 flex items-center justify-center gap-1.5 text-white/45 text-xs">
      <Lock className="h-3.5 w-3.5" />
      No credit card required
    </p>
  );
}
