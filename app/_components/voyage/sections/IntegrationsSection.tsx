import { Section } from "../shared/Section";
import { SectionHeader } from "../shared/SectionHeader";
import { ArrowRight, GmailMark, GoogleCalendarMark } from "../shared/icons";
import styles from "../shared/shared.module.css";

interface IntegrationCardData {
  title: string;
  description: string;
  Mark: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const INTEGRATIONS: IntegrationCardData[] = [
  {
    title: "Gmail",
    description:
      "Connect your Gmail to summarize, prioritize and manage your emails with AI.",
    Mark: GmailMark,
  },
  {
    title: "Google Calendar",
    description:
      "Connect your calendar to schedule, plan and stay on top of your day effortlessly.",
    Mark: GoogleCalendarMark,
  },
];

export function IntegrationsSection(): React.ReactElement {
  return (
    <Section id="integrations" className="py-24 md:py-32">
      <div className="flex flex-col items-center gap-12">
        <SectionHeader
          eyebrow="CONNECT WHAT MATTERS"
          title="Works with the tools you"
          accent="already use."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-5xl">
          {INTEGRATIONS.map(({ title, description, Mark }) => (
            <article
              key={title}
              className={`${styles.card} p-7 flex items-start gap-5`}
            >
              <div className="h-14 w-14 shrink-0 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center p-2">
                <Mark className="h-9 w-9" />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <h3 className="text-white text-lg font-semibold tracking-[-0.01em]">
                  {title}
                </h3>
                <p className="text-white/65 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Connect ${title}`}
                className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-[var(--accent-neon)] border border-[rgba(0,240,255,0.4)] transition-colors duration-300 hover:bg-[rgba(0,240,255,0.12)]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
