"use client";

import { useState, useEffect, useTransition } from "react";
import type { ReactElement } from "react";
import {
  Sparkles,
  Mail,
  CalendarDays,
  Settings as SettingsIcon,
  Check,
  Lock,
  Clock,
} from "../../_components/voyage/shared/icons";
import type { UserPreferences } from "@/lib/userPreferences";

interface SubscriptionData {
  plan: string;
  tokenLimit: number;
  tokenUsed: number;
  totalTokensAllTime: number;
  totalRequests: number;
}

export interface SettingsPanelProps {
  preferences: UserPreferences;
  onPreferencesChange?: (next: UserPreferences) => void;
}

export function SettingsPanel({
  preferences,
  onPreferencesChange,
}: SettingsPanelProps): ReactElement {
  const [orbActive, setOrbActive] = useState<boolean>(preferences.isOrbActive);
  const [summaryTime, setSummaryTime] = useState<string>(preferences.summaryTime ?? "09:00");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [emailCount24h, setEmailCount24h] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then(setSub)
      .catch(() => {});
    fetch("/api/emails/stats")
      .then((r) => r.json())
      .then((d) => setEmailCount24h(d.count ?? 0))
      .catch(() => setEmailCount24h(0));
  }, []);

  const handleToggleOrb = (next: boolean): void => {
    setError(null);
    const previous = orbActive;
    setOrbActive(next);
    startTransition(async () => {
      try {
        const res = await fetch("/api/user-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOrbActive: next }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        onPreferencesChange?.({
          ...preferences,
          isOrbActive: next,
        });
      } catch (e) {
        setOrbActive(previous);
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const usagePercent = sub
    ? Math.min(100, Math.round((sub.tokenUsed / sub.tokenLimit) * 100))
    : 0;

  const handleSummaryTimeChange = (next: string): void => {
    setError(null);
    const previous = summaryTime;
    setSummaryTime(next);
    startTransition(async () => {
      try {
        const res = await fetch("/api/user-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summaryTime: next }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        onPreferencesChange?.({
          ...preferences,
          summaryTime: next,
        });
      } catch (e) {
        setSummaryTime(previous);
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const planLabel =
    sub?.plan === "pro"
      ? "Pro"
      : sub?.plan === "enterprise"
      ? "Enterprise"
      : "Free";

  return (
    <div className="flex h-full flex-col gap-6 px-5 py-6 text-white">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.32em] text-[var(--accent-neon)]/80">
          <SettingsIcon className="h-3.5 w-3.5" />
          Settings
        </div>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-white/95">
          Command Center
        </h2>
        <p className="text-[12px] text-white/55 leading-relaxed">
          Adjust what the workspace renders for you.
        </p>
      </header>

      {/* Plan & Usage */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Plan</SectionLabel>
        <div className="liquid-glass-bubble-refract flex flex-col gap-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[var(--accent-neon)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">{planLabel} Plan</p>
                <p className="text-[11px] text-white/45">
                  {sub?.tokenLimit?.toLocaleString() ?? "—"} tokens/month
                </p>
              </div>
            </div>
            <span className="rounded-full border border-[var(--accent-neon)]/40 bg-[var(--accent-neon)]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent-neon)]">
              Active
            </span>
          </div>

          {/* Usage bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-white/55">AI Usage</span>
              <span className="text-white/70 font-mono">
                {sub?.tokenUsed?.toLocaleString() ?? 0} / {sub?.tokenLimit?.toLocaleString() ?? "—"}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usagePercent}%`,
                  background:
                    usagePercent > 90
                      ? "#ef4444"
                      : usagePercent > 70
                      ? "#f59e0b"
                      : "var(--accent-neon)",
                }}
              />
            </div>
            <p className="mt-1 text-[10.5px] text-white/40">
              {sub?.totalRequests ?? 0} requests this period
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Workspace</SectionLabel>
        <ToggleRow
          Icon={Sparkles}
          title="IT"
          subtitle="A free spirit that roams freely."
          value={orbActive}
          onChange={handleToggleOrb}
          disabled={pending}
        />
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Daily Summary</SectionLabel>
        <div className="liquid-glass-bubble-refract flex items-center gap-4 px-4 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[var(--accent-neon)]">
            <Clock className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white tracking-[-0.01em]">
              Email Summary Time
            </p>
            <p className="text-[11.5px] text-white/55 leading-snug mt-0.5">
              Receive a summary of the past 24h emails at this time daily.
            </p>
          </div>
          <input
            type="time"
            value={summaryTime.slice(0, 5)}
            onChange={(e) => handleSummaryTimeChange(e.target.value)}
            disabled={pending}
            className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[13px] font-mono text-white/90 outline-none focus:border-[var(--accent-neon)]/50 transition-colors [color-scheme:dark]"
          />
        </div>
        <div className="liquid-glass-bubble-refract flex items-center gap-4 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[var(--accent-neon)]">
            <Mail className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white tracking-[-0.01em]">
              Emails in last 24h
            </p>
            <p className="text-[11.5px] text-white/55 leading-snug mt-0.5">
              Your summary will include these emails.
            </p>
          </div>
          <span className="text-[20px] font-bold font-mono text-[var(--accent-neon)]">
            {emailCount24h === null ? (
              <span className="inline-block h-5 w-8 animate-pulse rounded bg-white/10" />
            ) : (
              emailCount24h
            )}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Connections</SectionLabel>
        <StatusRow
          Icon={Mail}
          title="Gmail"
          connected={preferences.isMailConnected}
        />
        <StatusRow
          Icon={CalendarDays}
          title="Google Calendar"
          connected={preferences.isCalendarConnected}
        />
      </section>

      {error ? (
        <p role="alert" className="text-[12px] text-red-400">
          {error}
        </p>
      ) : null}

      <footer className="mt-auto flex items-center gap-1.5 text-[11px] text-white/40">
        <Lock className="h-3 w-3" />
        Preferences are saved to your account.
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">
      {children}
    </p>
  );
}

function ToggleRow({
  Icon,
  title,
  subtitle,
  value,
  onChange,
  disabled,
}: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled: boolean;
}): ReactElement {
  return (
    <div
      className={
        "liquid-glass-bubble-refract flex items-center gap-4 px-4 py-3.5 " +
        (disabled ? "opacity-70" : "")
      }
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[var(--accent-neon)]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white tracking-[-0.01em]">
          {title}
        </p>
        <p className="text-[11.5px] text-white/55 leading-snug mt-0.5">
          {subtitle}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300 " +
          (value
            ? "bg-[var(--accent-neon)]/25 border-[var(--accent-neon)]/60"
            : "bg-white/[0.05] border-white/10") +
          (disabled ? " cursor-progress" : " cursor-pointer")
        }
      >
        <span
          className={
            "absolute top-0.5 h-[18px] w-[18px] rounded-full transition-all duration-300 " +
            (value
              ? "left-[22px] bg-[var(--accent-neon)] shadow-[0_0_12px_var(--accent-neon)]"
              : "left-0.5 bg-white/70")
          }
        />
      </button>
    </div>
  );
}

function StatusRow({
  Icon,
  title,
  connected,
}: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  connected: boolean;
}): ReactElement {
  return (
    <div className="liquid-glass-bubble-refract flex items-center gap-4 px-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white tracking-[-0.01em]">
          {title}
        </p>
        <p className="text-[11.5px] text-white/55 mt-0.5">
          {connected ? "Connected" : "Not connected"}
        </p>
      </div>
      <span
        className={
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] " +
          (connected
            ? "border-[var(--accent-neon)]/40 text-[var(--accent-neon)] bg-[var(--accent-neon)]/10"
            : "border-white/10 text-white/45 bg-white/[0.03]")
        }
      >
        {connected ? <Check className="h-3 w-3" /> : null}
        {connected ? "Live" : "Off"}
      </span>
    </div>
  );
}
