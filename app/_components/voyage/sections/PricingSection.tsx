import { Section } from "../shared/Section";
import { SectionHeader } from "../shared/SectionHeader";
import { Check } from "../shared/icons";
import styles from "../shared/shared.module.css";
import type { ReactNode } from "react";

interface PricingTier {
  name: string;
  description: string;
  price: string;
  unit?: string;
  badge: string;
  highlighted?: boolean;
  features: string[];
  cta: string;
  ctaStyle: "primary" | "outlineNeon" | "outlineWhite";
  footnote?: string;
}

const TIERS: PricingTier[] = [
  {
    name: "Free",
    description: "Get started at no cost.",
    price: "$0",
    unit: "/ month",
    badge: "50,000 tokens / month",
    features: [
      "AI Chat & Assistant",
      "Gmail & Calendar Integration",
      "Contact Aliases",
      "Semantic Search",
      "Up to 50,000 tokens / month",
    ],
    cta: "Get Started",
    ctaStyle: "outlineNeon",
  },
  {
    name: "Pro",
    description: "For individuals who want more.",
    price: "$7",
    unit: "/ month",
    badge: "5,000,000 tokens / month",
    highlighted: true,
    features: [
      "Everything in Free",
      "Up to 5,000,000 tokens / month",
      "Priority AI Processing",
      "Advanced Email Summaries",
      "Priority Support",
      "Early Access to New Features",
    ],
    cta: "Start Free Trial",
    ctaStyle: "primary",
    footnote: "7-day free trial. Cancel anytime.",
  },
  {
    name: "Enterprise",
    description: "For teams with advanced needs.",
    price: "Custom",
    badge: "Custom token limit",
    features: [
      "Everything in Pro",
      "Custom token limit",
      "Team Workspaces",
      "Dedicated Support",
      "Custom Integrations & SSO",
      "SLA & Security Review",
    ],
    cta: "Contact Sales",
    ctaStyle: "outlineNeon",
  },
];

function CtaButton({
  style,
  children,
}: {
  style: PricingTier["ctaStyle"];
  children: ReactNode;
}) {
  if (style === "primary") {
    return <button type="button" className={styles.primaryBtn + " w-full"}>{children}</button>;
  }
  if (style === "outlineNeon") {
    return <button type="button" className={styles.outlineNeonBtn + " w-full"}>{children}</button>;
  }
  return (
    <button
      type="button"
      className="pointer-events-auto w-full rounded-full px-5 py-3.5 text-white border border-white/15 transition-colors duration-300 hover:bg-white/5"
    >
      {children}
    </button>
  );
}

export function PricingSection(): React.ReactElement {
  return (
    <Section id="pricing" className="py-24 md:py-32">
      <div className="flex flex-col items-center gap-12">
        <SectionHeader
          eyebrow="PRICING"
          title="Simple plans."
          accent="Powerful impact."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-6xl items-stretch">
          {TIERS.map((t) => (
            <article
              key={t.name}
              className={`${styles.card} p-7 flex flex-col gap-5 ${
                t.highlighted ? styles.cardHighlighted : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-white text-2xl font-semibold tracking-[-0.02em]">
                    {t.name}
                  </h3>
                  <p className="text-white/55 text-sm mt-1">{t.description}</p>
                </div>
                {t.highlighted ? (
                  <span className={styles.popularBadge}>Most Popular</span>
                ) : null}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-white text-4xl md:text-5xl font-semibold tracking-[-0.03em]">
                  {t.price}
                </span>
                {t.unit ? (
                  <span className="text-white/55 text-sm">{t.unit}</span>
                ) : null}
              </div>

              <span className="inline-flex w-fit items-center rounded-full border border-[rgba(0,240,255,0.45)] px-3 py-1 text-xs text-[var(--accent-neon)] bg-[rgba(0,240,255,0.06)]">
                {t.badge}
              </span>

              <ul className="flex flex-col gap-2.5 text-white/80 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 mt-0.5 text-[var(--accent-neon)] shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <CtaButton style={t.ctaStyle}>{t.cta}</CtaButton>
                {t.footnote ? (
                  <p className="mt-3 text-center text-white/45 text-xs">
                    {t.footnote}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
