import { Mail, CalendarDays, Sparkles } from "../voyage/shared/icons";

/**
 * Left-column brand panel for the auth pages. Logo at top, large
 * headline naming the page as the "Auth Junction" with a neon accent
 * phrase, subhead, three product highlights, and a small mono-cased
 * hint that the asteroids in the background are interactive and
 * physically collide.
 */
export function BrandingPanel({
  variant,
}: {
  variant: "sign-in" | "sign-up";
}): React.ReactElement {
  const subhead =
    variant === "sign-in"
      ? "Auth Junction. The field has slowed to terminal velocity. Drift in, sign in, continue your voyage."
      : "Auth Junction. The field has slowed to terminal velocity. Drift in, register, and we will plot your course.";

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[500px] mx-auto text-center gap-6 py-12">
      <div className="flex flex-col items-center gap-6">
        

        <span className="font-mono text-[11px] tracking-[0.32em] uppercase text-[var(--accent-neon)]/85">
          Auth Junction
        </span>

        <h1 className="font-semibold tracking-[-0.04em] leading-[1.05] text-white text-[clamp(2.25rem,4.5vw,3.5rem)] text-balance">
          {variant === "sign-in" ? (
            <>
              Slow your
              <br />
              <span className="text-[var(--accent-neon)]">velocity.</span>
            </>
          ) : (
            <>
              Match the
              <br />
              <span className="text-[var(--accent-neon)]">local drift.</span>
            </>
          )}
        </h1>
      </div>

      <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-md">
        {subhead}
      </p>

      <div className="mt-2 grid grid-cols-3 gap-6 w-full max-w-md">
        <Highlight Icon={Mail} label="Smart Email" />
        <Highlight Icon={CalendarDays} label="Calendar Mastery" />
        <Highlight Icon={Sparkles} label="AI Assistant" />
      </div>

      <HintChip variant={variant} />
    </div>
  );
}

function Highlight({
  Icon,
  label,
}: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <Icon className="h-7 w-7 text-[var(--accent-neon)]" />
      <span className="text-white/80 text-sm">{label}</span>
    </div>
  );
}

/**
 * Small mono-cased pill that doubles as flavor copy and a user hint:
 * the asteroids in the background drift at terminal velocity, are
 * clickable, and physically collide with each other.
 */
function HintChip({
  variant,
}: {
  variant: "sign-in" | "sign-up";
}): React.ReactElement {
  const tone = variant === "sign-in" ? "Drift, sign in, continue." : "Drift, register, plot course.";
  return (
    <div
      role="note"
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--neon-warn)]/55 bg-[var(--neon-warn)]/10 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--neon-warn)] shadow-[0_0_18px_rgba(255,40,80,0.18)]"
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--neon-warn)] shadow-[0_0_10px_var(--neon-warn)] animate-pulse"
        aria-hidden="true"
      />
      <span className="text-[var(--neon-warn)]">Asteroids collide · </span>
      <span className="text-[var(--neon-warn)]/50" aria-hidden="true">·</span>
      <span className="text-[var(--neon-warn)]/75 normal-case tracking-normal">{tone}</span>
    </div>
  );
}
