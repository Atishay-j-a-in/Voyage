import { Section } from "../shared/Section";
import { SectionHeader } from "../shared/SectionHeader";
import { Quote, Star } from "../shared/icons";
import styles from "../shared/shared.module.css";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  /** Monogram shown in the avatar disc. */
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Voyage has completely changed how I work. My inbox is finally under control and I can focus on deep work.",
    name: "Rohit Sharma",
    role: "Product Manager",
    initials: "RS",
  },
  {
    quote:
      "The AI understands exactly what I need and saves me hours every week.",
    name: "Sneha Iyer",
    role: "Founder, Studio S",
    initials: "SI",
  },
  {
    quote:
      "A beautiful product that actually helps me get more done. Highly recommended!",
    name: "Arjun Patel",
    role: "Software Engineer",
    initials: "AP",
  },
];

export function TestimonialsSection(): React.ReactElement {
  return (
    <Section id="testimonials" className="py-24 md:py-32">
      <div className="flex flex-col items-center gap-12">
        <SectionHeader
          eyebrow="LOVED BY PRODUCTIVE MINDS"
          title="What our users say"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className={`${styles.card} p-7 flex flex-col gap-5`}
            >
              <Quote className="h-6 w-6 text-[var(--accent-neon)]" />
              <p className="text-white/85 text-[15px] leading-relaxed">
                {t.quote}
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-[13px] font-semibold text-white/90 border border-white/10"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0,240,255,0.35), rgba(40,60,90,0.6))",
                  }}
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-white text-sm font-semibold">
                    {t.name}
                  </span>
                  <span className="text-white/55 text-xs">{t.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex items-center gap-3 text-white/75 text-sm">
          <div className="flex items-center gap-1 text-[var(--accent-neon)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4" />
            ))}
          </div>
          <span className="text-white/55">4.9/5 from 1,200+ users</span>
        </div>
      </div>
    </Section>
  );
}
