import styles from "./shared.module.css";

interface SectionProps {
  id: string;
  children: React.ReactNode;
  /** Extra Tailwind classes for spacing/sizing. */
  className?: string;
}

/**
 * Frame a section with the dark overlay so the WebGL canvas reads as a
 * subtle backdrop. The inner container centers content with a max-width
 * and a vertical rhythm.
 */
export function Section({ id, children, className = "" }: SectionProps): React.ReactElement {
  return (
    <section
      id={id}
      className={`${styles.section} w-full ${className}`}
    >
      <div className={`${styles.sectionInner} mx-auto w-full max-w-7xl px-4 md:px-8`}>
        {children}
      </div>
    </section>
  );
}
