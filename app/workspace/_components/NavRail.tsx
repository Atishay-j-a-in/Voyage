"use client";

import type { ReactElement } from "react";
import {
  Sparkles,
  Inbox,
  FileText,
  Trash,
  SendHorizontal,
  Users,
  Settings,
  Clock,
  Keyboard,
} from "../../_components/voyage/shared/icons";
import type { TrayId } from "./TrayView";

/**
 * 72px global navigation rail. Always visible, never collapses.
 *
 * The rail surface itself is a liquid-glass panel that picks up
 * the same cursor-driven neon refraction as the rest of the
 * workspace (via the global `.glass-refract` selector and
 * `RefractGlobal`). The rail is a flex column of glass icon
 * buttons: a small top group, a flexible middle spacer, and a
 * bottom group for the Settings button.
 *
 * Clicking a top item either:
 *   - Opens a tray (AI / Mail / Contacts).
 *   - Opens the mail tray and flips main to email
 *     (Drafts / Sent / Trash). These are mail folders - they
 *     behave like the Mail icon for navigation but filter the
 *     thread list in the tray.
 *
 * The rail does not navigate between routes - it only drives
 * in-page state.
 */

export type MailFolderId = "drafts" | "sent" | "trash";
export type NavItemId = TrayId | MailFolderId | "settings";

interface NavItem {
  id: NavItemId;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Items that are mail folders share behavior with the Mail icon. */
  isMailFolder?: boolean;
}

const TOP_ITEMS: NavItem[] = [
  { id: "ai",       label: "AI Chat",   Icon: Sparkles },
  { id: "mail",     label: "Mail",      Icon: Inbox },
  { id: "drafts",   label: "Drafts",    Icon: FileText,       isMailFolder: true },
  { id: "sent",     label: "Sent",      Icon: SendHorizontal, isMailFolder: true },
  { id: "trash",    label: "Trash",     Icon: Trash,          isMailFolder: true },
  { id: "contacts", label: "Contacts",  Icon: Users },
  { id: "summary",  label: "Summary",   Icon: Clock },
  { id: "keys",     label: "Key Bindings", Icon: Keyboard },
];

const BOTTOM_ITEMS: NavItem[] = [
  { id: "settings", label: "Settings", Icon: Settings },
];

export interface NavRailProps {
  activeId: NavItemId | null;
  onSelect: (id: NavItemId) => void;
}

export function NavRail({ activeId, onSelect }: NavRailProps): ReactElement {
  return (
    <nav
      className="liquid-glass relative z-20 flex h-full w-[72px] shrink-0 flex-col items-center justify-between border-r border-white/[0.06] py-4"
      aria-label="Primary"
    >
      <ul className="flex flex-col items-center gap-1">
        {TOP_ITEMS.map((it) => (
          <li key={it.id}>
            <RailButton
              item={it}
              active={it.id === activeId}
              onClick={() => onSelect(it.id)}
            />
          </li>
        ))}
      </ul>
      <ul className="flex flex-col items-center gap-1 pb-16">
        {BOTTOM_ITEMS.map((it) => (
          <li key={it.label}>
            <RailButton
              item={it}
              active={it.id === activeId}
              onClick={() => onSelect(it.id)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function RailButton({
  item,
  active = false,
  onClick,
}: {
  item: NavItem;
  active?: boolean;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      title={item.label}
      aria-label={item.label}
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      className={
        "group flex h-10 w-10 items-center justify-center rounded-xl border border-transparent transition-colors duration-200 ease-out " +
        (active
          ? "liquid-glass-bubble-refract border-white/[0.12] text-[var(--accent-neon)]"
          : "text-white/55 hover:text-white hover:bg-white/[0.04]")
      }
    >
      <item.Icon className="h-5 w-5" />
    </button>
  );
}