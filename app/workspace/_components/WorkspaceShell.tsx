"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { UserMenu } from "./UserMenu";
import { NavRail, type NavItemId} from "./NavRail";
import { MainPanel } from "./MainPanel";
import { CalendarSidebar } from "./CalendarSidebar";
import { TrayView, type TrayId } from "./TrayView";
import { StarField } from "./StarField";
import { FloatingOrb } from "./FloatingOrb";
import { ChatPanel } from "./ChatPanel";
import { RefractGlobal } from "./NeonRefract";
import { useEmails } from "@/lib/useEmails";
import { useSyncStatus } from "@/lib/useSyncStatus";
import { useCalendarEvents } from "@/lib/useCalendarEvents";
import type { UserPreferences } from "@/lib/userPreferences";
import type { EmailThread, MailFolder } from "../_data/mock";

/**
 * Workspace shell. Layout:
 *
 *   Rail (72px) | Left (380px) | Main (flex) | Calendar (340px)
 *
 * The left slot is one of:
 *   - "context"  : the Inbox thread list (default)
 *   - "tray"     : a contextual panel driven by the rail mode
 *   - null       : collapsed
 *
 * Clicking a rail icon switches the slot to the matching tray. The
 * "context" view is reached by clicking the Mail icon (it routes to
 * the same Mail tray but with the Inbox-style row layout, or we can
 * keep a dedicated "context" view \u2014 currently we use the Mail tray
 * for both). The breadcrumb has a `[[` button that opens the tray
 * for the current rail mode, or collapses it.
 *
 * The calendar sidebar is independent (`]` to toggle, plus a button
 * in the breadcrumb). State persists in localStorage.
 */

const PANEL_DURATION_MS = 220;
const PANEL_WIDTH = 320; // was 380; trimmed by ~15% so the inbox / tray lists feel less wide.

type LeftSlot =
  | { kind: "tray"; trayId: TrayId }
  | { kind: "hidden" };

export interface WorkspaceShellProps {
  preferences: UserPreferences;
}
export function WorkspaceShell({ preferences }: WorkspaceShellProps): ReactElement {
  // Fetch real emails from Corsair DB
  const { emails: realEmails } = useEmails();
  useSyncStatus(); // polls sync status in background

  // Use real emails only — no mock fallback
  const threads: EmailThread[] = realEmails;

  // First-visit default: the AI Chat tray is open on the left so
  // the chat window is the user's landing experience. The Mail
  // inbox is one rail-click away. The useEffect below overrides
  // this with whatever the user chose on their last visit
  // (persisted in localStorage).
  const [left, setLeft] = useState<LeftSlot>({ kind: "hidden" });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mainMode, setMainMode] = useState<"chat" | "mail">("chat");
  // Active mail folder. "inbox" is the default; clicking a mail-folder rail button
  // (Drafts / Sent / Trash) updates this.
  const [mailFolder, setMailFolder] = useState<MailFolder | "inbox">("inbox");
  const [hydrated, setHydrated] = useState(false);
  // Local mirror of server-rendered preferences. The Settings tray
  // mutates this via PATCH and bubbles the new value up. We start
  // from the SSR snapshot so the orb is correctly absent on first
  // paint when the user has it disabled.
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [loadSessionId, setLoadSessionId] = useState<string | null>(null);

  // Fetch real calendar events for the selected month
  const calFrom = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString();
  const calTo = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
  const { events: calendarEvents } = useCalendarEvents(calFrom, calTo);

  useEffect(() => {
    try {
      // Bump this key whenever the default left slot changes so
      // a returning user's stale layout (e.g. the old mail-default)
      // doesn't override the new default. v2: default is AI Chat tray.
      const VERSION_KEY = "voyage.workspace.layout.v4";
      const raw = window.localStorage.getItem(VERSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<{
          left: LeftSlot;
          calendarOpen: boolean;
          mainMode: "chat" | "mail";
        }>;
        if (parsed.left && typeof parsed.left === "object" && "kind" in parsed.left) {
          setLeft(parsed.left as LeftSlot);
        }
        if (typeof parsed.calendarOpen === "boolean") {
          setCalendarOpen(parsed.calendarOpen);
        }
        if (parsed.mainMode === "chat" || parsed.mainMode === "mail") {
          setMainMode(parsed.mainMode);
        }
      } else {
        // Migrate the old v1 key (or clear it) so it doesn't haunt us.
        window.localStorage.removeItem("voyage.workspace.layout");
      }
    } catch {
      // ignore corrupted state
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        "voyage.workspace.layout.v4",
        JSON.stringify({ left, calendarOpen, mainMode }),
      );
    } catch {
      // ignore
    }
  }, [left, calendarOpen, hydrated]);

  // Keyboard shortcuts: `[` toggles left panel, `]` toggles calendar,
  // Ctrl+ArrowRight/Left cycles through rail items.
  const railOrder = useMemo<NavItemId[]>(
    () => ["ai", "mail", "drafts", "sent", "trash", "contacts", "summary", "keys", "settings"],
    [],
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // [ → toggle left panel
      if (e.key === "[" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setLeft((l) =>
          l.kind === "hidden" ? { kind: "tray", trayId: "mail" } : { kind: "hidden" },
        );
        return;
      }

      // ] → toggle calendar
      if (e.key === "]" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setCalendarOpen((v) => !v);
        return;
      }

      // Ctrl+ArrowRight → next rail item
      if (e.ctrlKey && e.key === "ArrowRight") {
        e.preventDefault();
        setLeft((cur) => {
          const currentId = cur.kind === "tray" ? cur.trayId : null;
          const idx = currentId ? railOrder.indexOf(currentId) : -1;
          const nextIdx = (idx + 1) % railOrder.length;
          const nextId = railOrder[nextIdx];
          if (nextId === "drafts" || nextId === "sent" || nextId === "trash") {
            setMailFolder(nextId);
            setMainMode("mail");
            return { kind: "tray", trayId: "mail" };
          }
          setMainMode("chat");
          return { kind: "tray", trayId: nextId };
        });
        return;
      }

      // Ctrl+ArrowLeft → previous rail item
      if (e.ctrlKey && e.key === "ArrowLeft") {
        e.preventDefault();
        setLeft((cur) => {
          const currentId = cur.kind === "tray" ? cur.trayId : null;
          const idx = currentId ? railOrder.indexOf(currentId) : railOrder.length;
          const nextIdx = (idx - 1 + railOrder.length) % railOrder.length;
          const nextId = railOrder[nextIdx];
          if (nextId === "drafts" || nextId === "sent" || nextId === "trash") {
            setMailFolder(nextId);
            setMainMode("mail");
            return { kind: "tray", trayId: "mail" };
          }
          setMainMode("chat");
          return { kind: "tray", trayId: nextId };
        });
        return;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [railOrder]);

  const selectedThread: EmailThread | undefined = threads.find(
    (t) => t.id === selectedThreadId,
  );

  // Rail selection: clicking an icon always opens the matching tray.
  // Clicking the icon that's already active collapses the panel.
  // Map a rail item id to a tray + a (possibly mail) mode change.
  // Mail-folder ids (drafts / sent / trash) open the mail tray
  // and set mailFolder so the thread list filters accordingly.
  const handleRailSelect = (id: NavItemId): void => {
    if (id === "settings") {
      setLeft((cur) =>
        cur.kind === "tray" && cur.trayId === "settings"
          ? { kind: "hidden" }
          : { kind: "tray", trayId: "settings" });
      return;
    }
    if (id === "drafts" || id === "sent" || id === "trash") {
      setMailFolder(id);
      setLeft({ kind: "tray", trayId: "mail" });
      setMainMode("mail");
      return;
    }
    if (id === "mail") {
      setMailFolder("inbox");
      setLeft((cur) => cur.kind === "tray" && cur.trayId === "mail"
        ? { kind: "hidden" }
        : { kind: "tray", trayId: "mail" });
      setMainMode("mail");
      return;
    }
    // Other rail items: open their tray, set main to chat.
    setLeft((cur) => {
      if (cur.kind === "tray" && cur.trayId === id) {
        return { kind: "hidden" };
      }
      return { kind: "tray", trayId: id as TrayId };
    });
    setMainMode("chat");
  };

  const handleSelectThread = (id: string): void => {
    setSelectedThreadId(id);
    setMainMode("mail");
  };

  // Active rail id (for the highlight in the rail).
  const activeRailId: NavItemId | null =
    left.kind === "tray"
      ? left.trayId
      : null;

  const leftOpen = left.kind !== "hidden";
  const leftTrayId: TrayId | null = left.kind === "tray" ? left.trayId : null;

  return (
    <div
      className="relative flex h-[100dvh] w-full text-white bg-[var(--void)] overflow-hidden"
      style={
        {
          ["--panel-duration" as string]: `${PANEL_DURATION_MS}ms`,
        } as React.CSSProperties
      }
    >
      <RefractGlobal />
      <StarField />
      <NavRail activeId={activeRailId} onSelect={handleRailSelect} />

      <CollapsiblePanel open={leftOpen} width={PANEL_WIDTH} side="left">
        {leftTrayId ? (
          <TrayView
            trayId={leftTrayId}
            threads={threads}
            selectedId={selectedThreadId}
            onSelectThread={handleSelectThread}
            mailFolder={mailFolder}
            preferences={prefs}
            onPreferencesChange={setPrefs}
            onSelectSession={(id) => {
              setLoadSessionId(id);
              setMainMode("chat");
            }}
          />
        ) : null}
      </CollapsiblePanel>

      <main className="relative flex-1 min-w-0 h-full overflow-hidden">
        {mainMode === "chat" ? (
          <ChatPanel loadSessionId={loadSessionId} onSessionLoaded={() => setLoadSessionId(null)} />
        ) : (
          <MainPanel
            thread={selectedThread}
            onToggleCalendar={() => setCalendarOpen((v) => !v)}
            calendarOpen={calendarOpen}
          />
        )}
      </main>

      <CollapsiblePanel open={calendarOpen} width={340} side="right">
        <CalendarSidebar
          events={calendarEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </CollapsiblePanel>

      {prefs.isOrbActive ? <FloatingOrb calendarOpen={calendarOpen} /> : null}
      <UserMenuCorner />
    </div>
  );
}

/**
 * Floating user menu in the bottom-left of the rail.
 */
function UserMenuCorner(): ReactElement {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-30">
      <div className="pointer-events-auto">
        <UserMenu />
      </div>
    </div>
  );
}

/**
 * Horizontally-collapsing panel. Width and opacity transition
 * 220ms ease-out; user input always wins.
 */
function CollapsiblePanel({
  open,
  width,
  side,
  children,
}: {
  open: boolean;
  width: number;
  side: "left" | "right";
  children: ReactElement | null;
}): ReactElement {
  return (
    <aside
      data-side={side}
      data-open={open ? "true" : "false"}
      className={
        side === "left"
          ? "relative h-full shrink-0 border-r border-white/[0.06] bg-[var(--void)] overflow-hidden transition-[width,opacity] ease-out"
          : "relative h-full shrink-0 border-l border-white/[0.06] bg-[var(--void)] overflow-hidden transition-[width,opacity] ease-out"
      }
      style={{
        width: open ? `${width}px` : "0px",
        opacity: open ? 1 : 0,
        transitionDuration: "var(--panel-duration)",
        pointerEvents: open ? "auto" : "none",
      }}
      aria-hidden={!open}
    >
      <div className="h-full" style={{ width: `${width}px` }}>
        {children}
      </div>
    </aside>
  );
}