import { Section } from "../shared/Section";
import { ArrowRight, Lock, Sparkles } from "../shared/icons";
import { GetStartedLink } from "../shared/GetStartedLink";
import styles from "../shared/shared.module.css";

export function FinalCtaSection(): React.ReactElement {
  return (
    <Section id="cta" className="py-20 md:py-24">
      <div className="flex justify-center">
        <div
          className={`${styles.card} ${styles.cardHighlighted} w-full max-w-4xl p-10 md:p-14 flex flex-col items-center text-center gap-5`}
        >
          <Sparkles className="h-7 w-7 text-[var(--accent-neon)]" />
          <h2 className="text-white text-[clamp(1.875rem,4vw,3rem)] font-semibold tracking-[-0.035em] leading-[1.1] text-balance">
            Ready to take control
            <br />
            of your <span className="text-[var(--accent-neon)]">time</span>?
          </h2>
          <p className="text-white/70 text-sm md:text-base max-w-md">
            Join thousands of professionals who trust Voyage to stay focused, productive and ahead.
          </p>
          <GetStartedLink
            href="/sign-up"
            className={`${styles.primaryBtn} mt-2 text-base`}
          >
            Start your journey
            <ArrowRight className="h-4 w-4" />
          </GetStartedLink>
          <p className="text-white/55 text-xs md:text-sm flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            No credit card required
          </p>
        </div>
      </div>
    </Section>
  );
}
