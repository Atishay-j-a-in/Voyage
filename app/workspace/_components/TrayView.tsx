"use client";

import { useEffect, useState, useRef } from "react";
import type { ReactElement } from "react";
import {
  Search,
  Sparkles,
  Mail,
  CalendarDays,
  Users,
  Settings,
  Clock,
  Trash,
  Send,
  Plus,
  Keyboard,
} from "../../_components/voyage/shared/icons";
import { SettingsPanel } from "./SettingsPanel";
import { useSearch } from "@/lib/useSearch";
import { useContacts } from "@/lib/useContacts";
import { useCalendarEvents } from "@/lib/useCalendarEvents";
import type { UserPreferences } from "@/lib/userPreferences";
import type { MailFolder } from "../_data/mock";
import type { EmailThread } from "../_data/mock";

/**
 * Tray content panel. Shows contextual content for whichever rail
 * mode is active. Reuses the slot the ContextPanel (mail inbox) used
 * to occupy; only one of them is mounted at a time.
 */

export type TrayId = "ai" | "mail" | "calendar" | "contacts" | "settings" | "summary" | "keys";

export const TRAY_META: Record<
  TrayId,
  { title: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
> = {
  ai:       { title: "AI Chat",       Icon: Sparkles },
  mail:     { title: "Mail",          Icon: Mail },
  calendar: { title: "Calendar",      Icon: CalendarDays },
  contacts: { title: "Contacts",      Icon: Users },
  settings: { title: "Settings",      Icon: Settings },
  summary:  { title: "Summary",       Icon: Clock },
  keys:     { title: "Key Bindings",  Icon: Keyboard },
};

export interface TrayViewProps {
  trayId: TrayId;
  threads?: EmailThread[];
  selectedId?: string;
  onSelectThread?: (id: string) => void;
  mailFolder?: MailFolder;
  preferences?: UserPreferences;
  onPreferencesChange?: (next: UserPreferences) => void;
  onSelectSession?: (id: string) => void;
}

const DEFAULT_PREFS: UserPreferences = {
  isOrbActive: true,
  isMailConnected: false,
  isCalendarConnected: false,
  summaryTime: "09:00:00",
};

export function TrayView({
  trayId,
  threads,
  selectedId,
  onSelectThread,
  mailFolder,
  preferences,
  onPreferencesChange,
  onSelectSession,
}: TrayViewProps): ReactElement {
  switch (trayId) {
    case "ai":
      return <AITray onSelectSession={onSelectSession} />;
    case "mail":
      return (
        <MailTray
          threads={threads ?? []}
          selectedId={selectedId ?? ""}
          onSelect={onSelectThread ?? (() => {})}
          mailFolder={mailFolder ?? "inbox"}
        />
      );
    case "calendar":
      return <CalendarTray />;
    case "contacts":
      return <ContactsTray />;
    case "settings":
      return (
        <SettingsPanel
          preferences={preferences ?? DEFAULT_PREFS}
          onPreferencesChange={onPreferencesChange}
        />
      );
    case "summary":
      return <SummaryTray preferences={preferences ?? DEFAULT_PREFS} onPreferencesChange={onPreferencesChange} />;
    case "keys":
      return <KeysTray />;
  }
}

// ---------------------------------------------------------------------------

function HeaderRow({ title }: { title: string }): ReactElement {
  return (
    <div className="flex h-12 items-center justify-between px-5 border-b border-white/[0.05]">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-white">
        {title}
      </h2>
    </div>
  );
}

// --- Compose email modal ----------------------------------------------------

function ComposeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): ReactElement | null {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const toRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTo("");
      setSubject("");
      setBody("");
      setResult(null);
      setTimeout(() => toRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleSend = (): void => {
    if (!to.trim() || !subject.trim()) return;
    setSending(true);
    setResult(null);

    fetch("/api/emails/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to send");
        setResult("Email sent successfully!");
        setTimeout(onClose, 1500);
      })
      .catch((err) => setResult(err.message || "Failed to send email."))
      .finally(() => setSending(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0a0a0f] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h3 className="text-[15px] font-semibold text-white">New Message</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-0 border-b border-white/[0.06]">
          <div className="flex items-center border-b border-white/[0.04] px-5 py-3">
            <label className="w-14 text-[12px] text-white/45">To</label>
            <input
              ref={toRef}
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/30 outline-none"
            />
          </div>
          <div className="flex items-center px-5 py-3">
            <label className="w-14 text-[12px] text-white/45">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/30 outline-none"
            />
          </div>
        </div>

        {/* Body */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          rows={10}
          className="w-full resize-none bg-transparent px-5 py-4 text-[13px] text-white placeholder:text-white/30 outline-none"
        />

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
          <div className="text-[12px]">
            {result && (
              <span className={result.includes("success") ? "text-green-400" : "text-red-400"}>
                {result}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-[13px] text-white/60 hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !to.trim() || !subject.trim()}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent-neon)] px-4 py-2 text-[13px] font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- AI tray ---------------------------------------------------------------

interface SessionItem {
  id: string;
  title: string | null;
  createdAt: string;
}

function AITray({ onSelectSession }: { onSelectSession?: (id: string) => void }): ReactElement {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d`;
  };

  return (
    <div className="flex h-full flex-col">
      <HeaderRow title="AI Chat" />
      <div className="px-5 pt-3 pb-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/35">
        Recent
      </div>
      <ul className="scrollbar-transparent flex-1 overflow-y-auto pb-3">
        {loading && (
          <li className="px-5 py-6 text-center text-[12px] text-white/40">
            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-neon)]" />
          </li>
        )}
        {!loading && sessions.length === 0 && (
          <li className="px-5 py-6 text-center text-[12.5px] text-white/45">
            No conversations yet.
          </li>
        )}
        {sessions.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelectSession?.(s.id)}
              className="group flex w-full flex-col gap-1 border-l-2 border-transparent px-5 py-3 text-left transition-colors hover:bg-white/[0.025]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-white/90">
                  {s.title ?? "New conversation"}
                </span>
                <span className="shrink-0 text-[11px] text-white/40">
                  {formatTime(s.createdAt)}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Calendar tray (upcoming events) --------------------------------------

function CalendarTray(): ReactElement {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59).toISOString();
  const { events, loading } = useCalendarEvents(from, to);

  return (
    <div className="flex h-full flex-col">
      <HeaderRow title="Calendar" />
      <div className="px-5 pt-1 pb-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/35">
        Upcoming
      </div>
      <ul className="scrollbar-transparent flex-1 overflow-y-auto pb-3 space-y-1 px-3">
        {loading && (
          <li className="px-3 py-6 text-center text-[12px] text-white/40">
            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-neon)]" />
          </li>
        )}
        {!loading && events.length === 0 && (
          <li className="px-3 py-6 text-center text-[12.5px] text-white/45">
            No upcoming events.
          </li>
        )}
        {events.map((evt) => {
          const start = new Date(evt.start);
          const end = new Date(evt.end);
          const startHour = start.getHours() + start.getMinutes() / 60;
          const endHour = end.getHours() + end.getMinutes() / 60;
          return (
            <li
              key={evt.id}
              className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-3"
            >
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#7c3aed]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white">
                  {evt.title}
                </p>
                <p className="text-[11px] text-white/45">
                  {formatHour(startHour)} – {formatHour(endHour)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// --- Summary tray -----------------------------------------------------------

function SummaryTray({
  preferences,
  onPreferencesChange,
}: {
  preferences: UserPreferences;
  onPreferencesChange?: (next: UserPreferences) => void;
}): ReactElement {
  const [summaryTime, setSummaryTime] = useState(preferences.summaryTime ?? "09:00");
  const [emailCount, setEmailCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/emails/stats")
      .then((r) => r.json())
      .then((d) => setEmailCount(d.count ?? 0))
      .catch(() => setEmailCount(0));
  }, []);

  const handleSave = (): void => {
    setSaving(true);
    fetch("/api/user-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summaryTime }),
    })
      .then(() => {
        onPreferencesChange?.({ ...preferences, summaryTime });
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <div className="flex h-full flex-col">
      <HeaderRow title="Summary" />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Email count card */}
        <div className="liquid-glass-bubble-refract rounded-xl px-4 py-5 text-center">
          <div className="text-[36px] font-bold font-mono text-[var(--accent-neon)]">
            {emailCount === null ? (
              <span className="inline-block h-9 w-16 animate-pulse rounded bg-white/10" />
            ) : (
              emailCount
            )}
          </div>
          <p className="mt-1 text-[12px] text-white/55">emails in the last 24 hours</p>
        </div>

        {/* Time picker */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40 mb-2">
            Delivery Time
          </p>
          <div className="liquid-glass-bubble-refract flex items-center gap-3 px-4 py-3">
            <Clock className="h-4 w-4 text-[var(--accent-neon)]" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-white">
                Daily at {formatTimeLabel(summaryTime)}
              </p>
              <p className="text-[11px] text-white/45 mt-0.5">
                Summary of emails from the past 24h
              </p>
            </div>
            <input
              type="time"
              value={summaryTime.slice(0, 5)}
              onChange={(e) => setSummaryTime(e.target.value)}
              className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[13px] font-mono text-white/90 outline-none focus:border-[var(--accent-neon)]/50 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-[var(--accent-neon)] px-4 py-2.5 text-[13px] font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Schedule"}
        </button>
      </div>
    </div>
  );
}

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${m.toString().padStart(2, "0")} ${period}`;
}

// --- Key Bindings tray ------------------------------------------------------

interface KeyBinding {
  keys: string[];
  description: string;
}

const KEY_BINDINGS: KeyBinding[] = [
  { keys: ["["], description: "Toggle left panel (mail tray)" },
  { keys: ["]"], description: "Toggle calendar sidebar" },
  { keys: ["Ctrl", "ArrowRight"], description: "Next rail section" },
  { keys: ["Ctrl", "ArrowLeft"], description: "Previous rail section" },
];

function KeysTray(): ReactElement {
  return (
    <div className="flex h-full flex-col">
      <HeaderRow title="Key Bindings" />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="text-[11px] text-white/45 mb-4">
          Keyboard shortcuts for faster navigation. These work when you are not focused on an input field.
        </p>
        <ul className="space-y-2">
          {KEY_BINDINGS.map((kb, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <span className="text-[13px] text-white/80">{kb.description}</span>
              <div className="flex items-center gap-1 shrink-0">
                {kb.keys.map((k, j) => (
                  <span key={j}>
                    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-md border border-white/[0.12] bg-white/[0.06] px-2 text-[11px] font-mono font-medium text-white/80">
                      {k}
                    </kbd>
                    {j < kb.keys.length - 1 && (
                      <span className="mx-0.5 text-white/30 text-[10px]">+</span>
                    )}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// --- Contacts tray ---------------------------------------------------------

function ContactsTray(): ReactElement {
  const { contacts, loading, add, remove } = useContacts();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    const result = await add(name.trim(), email.trim());
    if (result) {
      setName("");
      setEmail("");
      setShowAdd(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const colors = ["var(--accent-neon)", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  const getColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex h-full flex-col">
      <HeaderRow title="Contacts" />
      <div className="px-5 pt-4 pb-3">
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] px-3 py-2.5 text-[12px] font-medium text-white/60 hover:border-white/20 hover:text-white/80 transition-colors"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showAdd ? "Cancel" : "Add Contact"}
        </button>
      </div>

      {showAdd && (
        <div className="mx-5 mb-3 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 space-y-2">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !name.trim() || !email.trim()}
            className="w-full rounded-md bg-[var(--accent-neon)] px-3 py-2.5 text-[13px] font-bold text-white hover:brightness-110 disabled:opacity-40 transition-all"
          >
            {saving ? "Saving…" : "Save Contact"}
          </button>
        </div>
      )}

      {loading && (
        <div className="px-5 py-6 text-center text-[12px] text-white/40">
          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-neon)]" />
        </div>
      )}

      {!loading && contacts.length === 0 && (
        <div className="px-5 py-6 text-center text-[12.5px] text-white/45">
          No contacts yet. Add one above.
        </div>
      )}

      <ul className="scrollbar-transparent flex-1 overflow-y-auto pb-3">
        {contacts.map((c) => (
          <li key={c.id} className="group">
            <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.025] transition-colors">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                style={{ background: getColor(c.name) }}
              >
                {getInitials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white">
                  {c.name}
                </p>
                <p className="truncate text-[11px] text-white/45">{c.emailid}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="shrink-0 rounded p-1 text-white/20 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all"
                aria-label={`Delete ${c.name}`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatHour(h: number): string {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const period = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${min.toString().padStart(2, "0")} ${period}`;
}
// --- Mail tray (compact re-use of context-style rows) ---------------------

function MailTray({
  threads,
  selectedId,
  onSelect,
  mailFolder,
}: {
  threads: EmailThread[];
  selectedId: string;
  onSelect: (id: string) => void;
  mailFolder: MailFolder;
}): ReactElement {
  const { results: searchResults, loading: searchLoading, query: searchQuery, search, clear: clearSearch } = useSearch();
  const isSearching = searchQuery.trim().length > 0;
  const [composeOpen, setComposeOpen] = useState(false);

  const filtered = isSearching
    ? searchResults
    : threads.filter((t) => t.folder === mailFolder);

  const handleDelete = (id: string): void => {
    // Move to trash via corsair API
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Move email with id ${id} to trash using corsair.gmail.api.messages.modify({ id: '${id}', addLabelIds: ['TRASH'] })` }),
    }).catch(() => {});
  };

  return (
    <div className="flex h-full flex-col">
      <HeaderRow title="Mail" />
      <div className="px-5 pt-4 pb-3">
        <label className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 text-sm text-white/55 focus-within:border-white/15 focus-within:text-white/80">
          <Search className="h-4 w-4" />
          <input
            type="text"
            placeholder="Search mail..."
            value={searchQuery}
            onChange={(e) => search(e.target.value)}
            className="w-full bg-transparent text-white placeholder:text-white/40 focus:outline-none"
          />
          {isSearching && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-white/40 hover:text-white/70 transition-colors"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </label>
      </div>
      {/* Compose button */}
      <div className="px-5 pb-3">
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-neon)] px-4 py-2.5 text-[13px] font-semibold text-black hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Compose
        </button>
      </div>
      {searchLoading && (
        <div className="px-5 py-4 text-center text-[12px] text-white/40">
          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-neon)]" />
          <p className="mt-1">Searching…</p>
        </div>
      )}
      {!searchLoading && isSearching && filtered.length > 0 && (
        <div className="px-5 pb-1 text-[11px] text-white/35">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
        </div>
      )}
      <ul className="scrollbar-transparent flex-1 overflow-y-auto pb-3">
        {!searchLoading && filtered.length === 0 ? (
          <li className="px-5 py-6 text-center text-[12.5px] text-white/45">
            {isSearching
              ? `No results for "${searchQuery}"`
              : `Nothing in ${mailFolder} yet.`}
          </li>
        ) : (
          filtered.map((t) => (
            <li key={t.id} className="group/item">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(t.id);
                }}
                className={
                  "flex w-full cursor-pointer flex-col gap-1.5 border-l-2 px-5 py-4 text-left transition-colors " +
                  (t.id === selectedId
                    ? "border-[var(--accent-neon)] bg-white/[0.04]"
                    : "border-transparent hover:bg-white/[0.025]")
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={
                        "h-2 w-2 shrink-0 rounded-full " +
                        (t.isUnread ? "bg-[var(--accent-neon)]" : "bg-transparent")
                      }
                    />
                    <span
                      className={
                        "truncate text-[13px] " +
                        (t.isUnread ? "font-semibold text-white" : "font-medium text-white/85")
                      }
                    >
                      {t.sender}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="shrink-0 text-[11px] text-white/45">
                      {t.timestamp}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(t.id);
                      }}
                      className="shrink-0 rounded p-1 text-white/20 opacity-0 group-hover/item:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      aria-label="Move to trash"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="pl-4 space-y-0.5">
                  <p className="truncate text-[12px] font-medium text-white/70">
                    {t.subject}
                  </p>
                  <p className="truncate text-[11.5px] text-white/50">
                    {t.snippet}
                  </p>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  );
}
