"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Mail, CalendarDays, Sparkles, Lock, ChevronRight } from "../../_components/voyage/shared/icons";

/**
 * ConnectDialog
 * -------------
 * Shown by /workspace when the freshly-signed-in user has zero
 * rows in `corsair_accounts` for either `gmail` or
 * `googlecalendar`. The user can connect either (or both) by
 * triggering the production OAuth flow documented in
 * `corsair.md`. After either connect, the user can click
 * "Continue" - we re-fetch the page (server component) and the
 * dialog disappears in favour of the workspace.
 *
 * Per the product brief: at least ONE of the two integrations
 * is required. This dialog is only rendered when zero are
 * connected, so the "Skip" link is intentionally absent - the
 * user cannot get to the workspace without connecting one.
 */
export function ConnectDialog(): ReactElement {
  const [pending, startTransition] = useTransition();
  const [busyPlugin, setBusyPlugin] = useState<"gmail" | "googlecalendar" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = (plugin: "gmail" | "googlecalendar"): void => {
    setError(null);
    setBusyPlugin(plugin);
    startTransition(async () => {
      try {
        const res = await fetch("/api/corsair/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plugin }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { url?: string };
        if (!data.url) throw new Error("Server did not return a redirect URL");
        // Hand off to the provider. The cookie carrying the
        // HMAC-signed state is already set by the server. After
        // approval Google redirects to /api/corsair/callback
        // which writes the account row and re-routes here.
        window.location.assign(data.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setBusyPlugin(null);
      }
    });
  };

  return (
    <main className="relative min-h-[100dvh] w-full flex items-center justify-center px-6 py-16">
      <StarFieldBackdrop />
      <div className="liquid-glass-strong relative w-full max-w-xl p-8 md:p-10 flex flex-col gap-7">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[var(--accent-neon)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-mono text-[11px] tracking-[0.32em] uppercase text-[var(--accent-neon)]/85">
            Auth Junction
          </span>
          <h1 className="font-semibold tracking-[-0.035em] leading-[1.1] text-white text-[clamp(1.75rem,3.6vw,2.5rem)] text-balance">
            Connect at least <span className="text-[var(--accent-neon)]">one</span> to dock.
          </h1>
          <p className="max-w-md text-white/70 text-sm md:text-base leading-relaxed">
            Voyage needs a connection to either your Gmail or Google Calendar to
            start triaging. Pick one - you can add the other any time from the
            integrations page.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <ConnectRow
            Icon={Mail}
            title="Connect Gmail"
            subtitle="Summarize, prioritize and reply to threads with AI"
            busy={pending && busyPlugin === "gmail"}
            disabled={pending}
            onClick={() => start("gmail")}
          />
          <ConnectRow
            Icon={CalendarDays}
            title="Connect Google Calendar"
            subtitle="Schedule, plan and stay on top of your day"
            busy={pending && busyPlugin === "googlecalendar"}
            disabled={pending}
            onClick={() => start("googlecalendar")}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="text-center text-red-400 text-xs md:text-sm"
          >
            {error}
          </p>
        ) : null}

        <footer className="flex items-center justify-center gap-1.5 text-white/45 text-xs">
          <Lock className="h-3.5 w-3.5" />
          You can revoke access at any time from your Google account.
        </footer>
      </div>
    </main>
  );
}

function ConnectRow({
  Icon,
  title,
  subtitle,
  busy,
  disabled,
  onClick,
}: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  subtitle: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "liquid-glass-bubble-refract group flex items-center gap-4 px-5 py-4 text-left transition-colors duration-300 " +
        (disabled && !busy ? "opacity-50 cursor-not-allowed" : "hover:bg-white/[0.08]") +
        (busy ? " cursor-progress" : "")
      }
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[var(--accent-neon)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm md:text-[15px] font-semibold tracking-[-0.01em]">
          {busy ? "Connecting..." : title}
        </p>
        <p className="text-white/55 text-xs md:text-[13px] mt-0.5">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-[var(--accent-neon)] transition-colors" />
    </button>
  );
}

/**
 * Static star backdrop so the dialog doesn't sit on a flat black
 * square. Inline because the dialog must be self-contained - it
 * is rendered before the workspace shell mounts.
 */
function StarFieldBackdrop(): ReactElement {
  // Deterministic LCG so the field is identical between renders.
  let seed = 0x1f2c3b4a;
  const rand = (): number => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const stars: Array<{ top: number; left: number; size: number; op: number }> = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      top: rand() * 100,
      left: rand() * 100,
      size: rand() < 0.7 ? 1 : 1.5,
      op: 0.12 + Math.pow(rand(), 2.4) * 0.4,
    });
  }
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white star-twinkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.op,
            animationDuration: `${2400 + Math.floor(rand() * 4400)}ms`,
            animationDelay: `${Math.floor(rand() * 6000)}ms`,
          }}
        />
      ))}
    </div>
  );
}