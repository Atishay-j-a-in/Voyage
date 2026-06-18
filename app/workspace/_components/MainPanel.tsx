"use client";

import { useState, useRef, useEffect } from "react";
import type { ReactElement } from "react";
import {
  CalendarDays,
  Star,
  Reply,
  ReplyAll,
  Forward,
  Send,
  X,
} from "../../_components/voyage/shared/icons";
import type { EmailThread } from "../_data/mock";

type ComposeMode = "reply" | "replyAll" | "forward";

/**
 * Main content panel. Shows the breadcrumb, the selected email
 * (subject, sender, body, reply actions), or a placeholder when
 * nothing is selected.
 */
export function MainPanel({
  thread,
  onToggleCalendar,
  calendarOpen,
}: {
  thread: EmailThread | undefined;
  onToggleCalendar: () => void;
  calendarOpen: boolean;
}): ReactElement {
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("reply");
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (composeOpen) {
      setResult(null);
      setTimeout(() => {
        if (composeMode === "forward") {
          toRef.current?.focus();
        } else {
          bodyRef.current?.focus();
        }
      }, 50);
    }
  }, [composeOpen, composeMode]);

  const openCompose = (mode: ComposeMode): void => {
    setComposeMode(mode);
    setBody("");
    setResult(null);

    if (mode === "forward") {
      setTo("");
    } else {
      setTo(thread?.rawFrom ?? "");
    }

    setComposeOpen(true);
  };

  const handleSend = (): void => {
    if (!thread) return;
    if (composeMode === "forward" && !to.trim()) return;

    setSending(true);
    setResult(null);

    const originalBody = thread.body[thread.body.length - 1] ?? "";

    fetch("/api/emails/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: composeMode,
        to: to.trim(),
        subject: thread.rawSubject || thread.subject,
        body,
        originalFrom: thread.rawFrom,
        originalBody: composeMode === "forward" ? originalBody : undefined,
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to send");
        setResult("Sent successfully!");
        setTimeout(() => setComposeOpen(false), 1200);
      })
      .catch((err) => setResult(err.message || "Failed to send."))
      .finally(() => setSending(false));
  };

  const composeTitle =
    composeMode === "reply"
      ? "Reply"
      : composeMode === "replyAll"
      ? "Reply All"
      : "Forward";

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb */}
      <div className="flex h-12 items-center gap-2 border-b border-white/[0.06] px-5 text-[13px] text-white/65">
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label={calendarOpen ? "Hide calendar sidebar" : "Show calendar sidebar"}
            aria-pressed={calendarOpen}
            onClick={onToggleCalendar}
            className={
              "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors " +
              (calendarOpen
                ? "border-[var(--accent-neon)]/40 bg-[var(--accent-neon)]/[0.08] text-[var(--accent-neon)]"
                : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.07] hover:text-white")
            }
          >
            <CalendarDays className="h-4 w-4" />
            <span>{calendarOpen ? "Hide calendar" : "Show calendar"}</span>
          </button>
        </div>
      </div>

      {thread ? (
        <article className="flex-1 overflow-y-auto px-10 py-8">
          <header className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-white text-balance">
                {thread.subject}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                {thread.messageCount && thread.messageCount > 1 && (
                  <span className="rounded-md bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium text-white/60">
                    {thread.messageCount} messages
                  </span>
                )}
                {thread.isImportant && (
                  <span className="rounded-md bg-[var(--accent-neon)]/40 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-neon)]">
                    Important
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-neon)] text-black text-sm font-semibold">
                {thread.sender.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="font-semibold text-white">{thread.sender}</span>
                  {thread.rawFrom && (
                    <span className="text-white/40 truncate max-w-[200px]">
                      &lt;{thread.rawFrom}&gt;
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-white/45">
                  <span>{thread.recipients?.[0] ?? "to me"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-white/55">
                <span>{thread.timestamp}</span>
                {thread.isStarred && <Star className="h-4 w-4 text-[var(--accent-neon)]" />}
              </div>
            </div>
          </header>

          {/* Thread messages */}
          <div className="mt-8 space-y-6">
            {thread.body.map((message, i) => {
              const lines = message.split("\n");
              const headerLine = lines[0] ?? "";
              const bodyLines = lines.slice(1).join("\n");
              const headerMatch = headerLine.match(/^\[(.+?) — (.+?)\]$/);
              const msgSender = headerMatch ? headerMatch[1] : thread.sender;
              const msgTime = headerMatch ? headerMatch[2] : "";

              return (
                <div
                  key={i}
                  className={
                    "rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 " +
                    (i === thread.body.length - 1 ? "" : "opacity-80")
                  }
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-neon)]/70 text-white text-[11px] font-semibold">
                        {msgSender.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-medium text-white/90">{msgSender}</span>
                    </div>
                    <span className="text-[11px] text-white/40">{msgTime}</span>
                  </div>
                  <div className="text-[14px] leading-[1.7] text-white/85 whitespace-pre-wrap">
                    {bodyLines || "(empty)"}
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="mt-10 flex items-center gap-2">
            <ActionButton Icon={Reply} label="Reply" onClick={() => openCompose("reply")} />
            <ActionButton Icon={ReplyAll} label="Reply all" onClick={() => openCompose("replyAll")} />
            <ActionButton Icon={Forward} label="Forward" onClick={() => openCompose("forward")} />
          </footer>
        </article>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
          Select a thread to read.
        </div>
      )}

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0a0a0f] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <h3 className="text-[15px] font-semibold text-white">{composeTitle}</h3>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-lg p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Fields */}
            <div className="flex flex-col border-b border-white/[0.06]">
              {composeMode === "forward" && (
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
              )}
              <div className="flex items-center px-5 py-3">
                <label className="w-14 text-[12px] text-white/45">Subject</label>
                <span className="flex-1 text-[13px] text-white/70">
                  {composeMode === "forward"
                    ? thread?.subject
                    : `Re: ${thread?.subject}`}
                </span>
              </div>
            </div>

            {/* Body */}
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                composeMode === "forward"
                  ? "Add a message before forwarding..."
                  : "Write your reply..."
              }
              rows={10}
              className="w-full resize-none bg-transparent px-5 py-4 text-[13px] text-white placeholder:text-white/30 outline-none"
            />

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
              <div className="text-[12px]">
                {result && (
                  <span className={result.includes("Sent") ? "text-green-400" : "text-red-400"}>
                    {result}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="rounded-lg px-4 py-2 text-[13px] text-white/60 hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || (composeMode === "forward" && !to.trim())}
                  className="flex items-center gap-2 rounded-lg bg-[var(--accent-neon)] px-4 py-2 text-[13px] font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  Icon,
  label,
  onClick,
}: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-white/85 hover:bg-white/[0.07] transition-colors"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
