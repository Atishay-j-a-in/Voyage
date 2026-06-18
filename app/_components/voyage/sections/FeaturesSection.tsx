import { Section } from "../shared/Section";
import { SectionHeader } from "../shared/SectionHeader";
import {
  Sparkles,
  Mail,
  CalendarDays,

  Layers3,
} from "../shared/icons";
import type { ComponentType, SVGProps } from "react";
import styles from "../shared/shared.module.css";

interface FeatureItem {
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const FEATURES: FeatureItem[] = [
  {
    title: "AI Assistant",
    description: "Your intelligent co-pilot that understands context and gets things done.",
    Icon: Sparkles,
  },
  {
    title: "Smart Email",
    description: "Summarize, prioritize and reply — all in one clean, distraction-free inbox.",
    Icon: Mail,
  },
  {
    title: "Calendar Mastery",
    description: "Schedule, reschedule and plan your day with natural language.",
    Icon: CalendarDays,
  },
  
  {
    title: "Unified Workspace",
    description: "All your tools, connected and organized in one beautiful space.",
    Icon: Layers3,
  },
];

export function FeaturesSection(): React.ReactElement {
  return (
    <Section id="features" className="py-24 md:py-36">
      <div className="flex flex-col   items-center gap-12">
        <SectionHeader
          eyebrow="FEATURES"
          title="Everything you need to"
          accent="focus and get more done."
        />

        <div className="grid  grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {FEATURES.map(({ title, description, Icon }) => (
            <article
              key={title}
              className={`${styles.card} p-6 md:p-7 flex flex-col items-center text-center gap-3`}
            >
              <div className="h-12 w-12 rounded-xl flex items-center justify-center text-[var(--accent-neon)] bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.18)]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-white text-lg font-semibold tracking-[-0.01em]">
                {title}
              </h3>
              <p className="text-white/65 text-sm leading-relaxed">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
