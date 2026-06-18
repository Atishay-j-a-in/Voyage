import styles from "./shared.module.css";

interface SectionHeaderProps {
  eyebrow?: string;
  /** Inline-renderable: text fragments and/or a word that should be highlighted
   *  in neon. Pass children as a string OR a ReactNode; the `accent` marker
   *  is rendered separately for clean control. */
  title: React.ReactNode;
  accent?: string;
  description?: React.ReactNode;
  align?: "center" | "left";
}

/**
 * Reusable section header: small mono-cased eyebrow + display title with
 * one neon-accented phrase + optional subhead. Centered by default.
 */
export function SectionHeader({
  eyebrow,
  title,
  accent,
  description,
  align = "center",
}: SectionHeaderProps): React.ReactElement {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col ${alignment} gap-4 max-w-3xl`}>
      {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
      <h2 className={`${styles.sectionTitle} text-[clamp(2rem,4.2vw,3.4rem)]`}>
        {title}
        {accent ? <span className={styles.accent}> {accent}</span> : null}
      </h2>
      {description ? (
        <p className="text-white/70 text-base md:text-lg max-w-prose leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
  );
}
