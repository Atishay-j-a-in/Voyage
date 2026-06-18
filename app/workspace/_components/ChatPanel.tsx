"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { FormEvent, KeyboardEvent, ReactElement } from "react";
import {
  Sparkles,
  Send,
  Paperclip,
  Plus,
  Settings2,
} from "../../_components/voyage/shared/icons";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: number;
}

interface ChatSession {
  id: string;
  title: string | null;
  createdAt: string;
}

const MIDDOT = "\u00B7";
const ELLIPSIS = "\u2026";

const SUGGESTIONS: Array<{ title: string; subtitle: string; prompt: string }> = [
  {
    title: "Triage my inbox",
    subtitle: "Sort unread threads by priority",
    prompt: "Triage my inbox and group the most important threads.",
  },
  {
    title: "Draft a reply",
    subtitle: "Write a professional response",
    prompt: "Draft a friendly reply to the latest important email.",
  },
  {
    title: "Find a meeting slot",
    subtitle: "Open 30 minutes this Friday",
    prompt: "Find a 30-minute open window on Friday for a sync.",
  },
  {
    title: "Summarize last week",
    subtitle: "Calendar + email digest",
    prompt: "Summarize last week's meetings and important emails.",
  },
];

interface ChatPanelProps {
  loadSessionId?: string | null;
  onSessionLoaded?: () => void;
}

export function ChatPanel({ loadSessionId, onSessionLoaded }: ChatPanelProps): ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const streamingRef = useRef(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Set<string>>(new Set());

  const toggleThought = (id: string): void => {
    setExpandedThoughts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Auto-scroll to the bottom on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isThinking]);

  // Load sessions on mount
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => {});
  }, []);

  // Handle external session load request (from tray)
  useEffect(() => {
    if (loadSessionId) {
      loadSession(loadSessionId).then(() => onSessionLoaded?.());
    }
  }, [loadSessionId]);

  const loadSession = useCallback(async (id: string) => {
    setSessionId(id);
    try {
      const res = await fetch(`/api/chat?sessionId=${id}`);
      const data = await res.json();
      const loaded: ChatMessage[] = (data.messages ?? []).flatMap(
        (m: any) => {
          const msgs: ChatMessage[] = [];
          if (m.usertext) {
            msgs.push({
              id: `u-${m.id}`,
              role: "user",
              text: m.usertext,
              at: new Date(m.createdAt).getTime(),
            });
          }
          if (m.agenttext) {
            msgs.push({
              id: `a-${m.id}`,
              role: "assistant",
              text: m.agenttext,
              at: new Date(m.createdAt).getTime(),
            });
          }
          return msgs;
        }
      );
      setMessages(loaded);
    } catch (err) {
      console.error("[ChatPanel] Failed to load session:", err);
    }
  }, []);

  const startNew = (): void => {
    setSessionId(null);
    setMessages([]);
  };

  const send = async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || streamingRef.current) return;

    const userMsg: ChatMessage = {
      id: `u${Date.now()}`,
      role: "user",
      text: trimmed,
      at: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setIsThinking(true);
    streamingRef.current = true;

    // Create placeholder for assistant message
    const assistantId = `a${Date.now()}`;
    setMessages((m) => [
      ...m,
      { id: assistantId, role: "assistant", text: "", at: Date.now() },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          try {
            const event = JSON.parse(json);

            if (event.error) {
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, text: `Error: ${event.error}` }
                    : msg
                )
              );
              break;
            }

            if (event.done) {
              // Update session ID if new
              if (event.sessionId && !sessionId) {
                setSessionId(event.sessionId);
                setSessions((prev) => [
                  {
                    id: event.sessionId,
                    title: trimmed.slice(0, 80),
                    createdAt: new Date().toISOString(),
                  },
                  ...prev,
                ]);
              }
              break;
            }

            if (event.delta) {
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, text: msg.text + event.delta }
                    : msg
                )
              );
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      console.error("[ChatPanel] Stream error:", err);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                text: msg.text || "Failed to get response. Please try again.",
              }
            : msg
        )
      );
    } finally {
      setIsThinking(false);
      streamingRef.current = false;
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    send(draft);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex h-full w-full items-center justify-center px-6 py-6">
      <div className="liquid-glass relative flex h-full w-full max-w-4xl flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-[var(--accent-neon)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[-0.01em] text-white">
                Voyage
              </p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#10b981] align-middle" />
                {`Online ${MIDDOT}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <IconButton aria-label="New conversation" onClick={startNew}>
              <Plus className="h-4 w-4" />
            </IconButton>
            <IconButton aria-label="Chat settings">
              <Settings2 className="h-4 w-4" />
            </IconButton>
          </div>
        </header>

        {/* Sessions sidebar (shown when there are sessions) */}
        {!isEmpty && sessions.length > 0 && (
          <div className="border-b border-white/[0.06] px-4 py-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-transparent">
              {sessions.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => loadSession(s.id)}
                  className={
                    "shrink-0 rounded-lg px-3 py-1.5 text-[11px] transition-colors " +
                    (s.id === sessionId
                      ? "bg-[var(--accent-neon)]/20 text-[var(--accent-neon)]"
                      : "text-white/50 hover:bg-white/[0.05] hover:text-white/70")
                  }
                >
                  {s.title?.slice(0, 30) ?? "New chat"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="scrollbar-transparent relative flex-1 overflow-y-auto"
        >
          {isEmpty ? (
            <SuggestionGrid onPick={send} />
          ) : (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-6">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  expandedThoughts={expandedThoughts}
                  onToggleThought={toggleThought}
                />
              ))}
              {isThinking && messages[messages.length - 1]?.text === "" && (
                <ThinkingBubble />
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={onSubmit}
          className="border-t border-white/[0.06] px-6 py-4"
        >
          <div className="liquid-glass-bubble-refract relative mx-auto flex w-full max-w-2xl items-end gap-2 p-2 pl-3">
            <div className="liquid-sheen" />
            <IconButton aria-label="Attach file" className="shrink-0">
              <Paperclip className="h-4 w-4" />
            </IconButton>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={`Ask Voyage anything${ELLIPSIS}`}
              className="scrollbar-transparent relative z-10 max-h-32 flex-1 resize-none bg-transparent px-1 py-2 text-[14px] text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!draft.trim() || isThinking}
              className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-neon)] text-black transition-opacity disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IconButton({
  children,
  className = "",
  ...rest
}: React.ComponentProps<"button"> & { children: ReactElement }): ReactElement {
  return (
    <button
      type="button"
      {...rest}
      className={
        "flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white " +
        className
      }
    >
      {children}
    </button>
  );
}

function MessageBubble({
  message,
  expandedThoughts,
  onToggleThought,
}: {
  message: ChatMessage;
  expandedThoughts: Set<string>;
  onToggleThought: (id: string) => void;
}): ReactElement {
  const isUser = message.role === "user";

  // Parse <thought>...</thought> from assistant messages
  const thoughtMatch = message.text.match(/^<thought>([\s\S]*?)<\/thought>\s*/);
  const thought = thoughtMatch?.[1] ?? null;
  const displayText = thought && thoughtMatch ? message.text.slice(thoughtMatch[0].length) : message.text;
  const isExpanded = expandedThoughts.has(message.id);

  return (
    <div className={"flex w-full " + (isUser ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed " +
          (isUser
            ? "rounded-br-md bg-[var(--accent-neon)]/[0.10] border border-[var(--accent-neon)]/30 text-white"
            : "liquid-glass-bubble-refract text-white/90")
        }
      >
        {/* Thought toggle for assistant messages with thought */}
        {!isUser && thought && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => onToggleThought(message.id)}
              className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/60 transition-colors"
            >
              <svg
                className={
                  "h-3 w-3 transition-transform duration-200 " +
                  (isExpanded ? "rotate-90" : "")
                }
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Reasoning
            </button>
            {isExpanded && (
              <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] text-white/50 italic">
                {thought}
              </div>
            )}
          </div>
        )}

        <p className="whitespace-pre-wrap text-balance">{displayText}</p>
        <p className="mt-1 text-right text-[10.5px] uppercase tracking-[0.16em] text-white/35">
          {formatTime(message.at)}
        </p>
      </div>
    </div>
  );
}

function ThinkingBubble(): ReactElement {
  return (
    <div className="flex justify-start">
      <div className="liquid-glass-bubble-refract flex items-center gap-2 px-4 py-3">
        <Sparkles className="h-3.5 w-3.5 text-[var(--accent-neon)] animate-pulse" />
        <span className="text-[13px] text-white/65">
          {`Voyage is thinking${ELLIPSIS}`}
        </span>
        <span className="ml-2 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:240ms]" />
        </span>
      </div>
    </div>
  );
}

function SuggestionGrid({
  onPick,
}: {
  onPick: (text: string) => void;
}): ReactElement {
  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col justify-center gap-8 px-6 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white text-balance">
          {`What should we tackle first${MIDDOT}`}
        </h2>
        <p className="max-w-md text-[13px] text-white/55">
          Pick a starter or just type below. Voyage reads your inbox,
          calendar, and tasks in real time.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="liquid-glass-bubble-refract group flex flex-col items-start gap-1.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.08]"
          >
            <span className="text-[13.5px] font-semibold text-white">
              {s.title}
            </span>
            <span className="text-[12px] text-white/55">{s.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatTime(at: number): string {
  const d = new Date(at);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
