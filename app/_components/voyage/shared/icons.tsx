"use client";

import type { SVGProps } from "react";
import {
  Sparkles,
  Mail,
  PanelLeft,
  CalendarDays,
  Send,
  Paperclip,
  Mic,
  Plus,
  Settings2,
  Wand2,
  Focus,
  Layers3,
  ArrowRight,
  PlayCircle,
  Lock,
  Star,
  Check,
  Quote,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
  Filter,
  Reply,
  ReplyAll,
  Forward,
  Star as StarFilled,
  MoreVertical,
  FileText,
  Trash,
  SendHorizontal,
  Clock,
  Keyboard,
} from "lucide-react";

/**
 * Voyage icon set.
 *
 * Backed by `lucide-react` \u2014 every icon is a thin re-export so the
 * rest of the codebase keeps its single import path
 * (`from ".../voyage/shared/icons"`). The library's standard
 * props apply: `size`, `color`, `strokeWidth`, `className`, etc.
 * We also accept the full React `SVGProps` surface for free.
 *
 * Brand marks (LinkedIn, Gmail, Google, Google Calendar) are not in
 * the standard Lucide set, so we keep a tiny number of inline SVGs
 * just for those. They use the same prop shape and the `lucide`
 * `1.5` stroke convention so they blend in.
 */

export type IconProps = SVGProps<SVGSVGElement>;

export {
  Sparkles,
  Mail,
  PanelLeft,
  CalendarDays,
  Send,
  Paperclip,
  Mic,
  Plus,
  Settings2,
  Wand2,
  Focus,
  Layers3,
  ArrowRight,
  PlayCircle,
  Lock,
  Star,
  Check,
  Quote,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
  Filter,
  Reply,
  ReplyAll,
  Forward,
  StarFilled,
  MoreVertical,
  FileText,
  Trash,
  SendHorizontal,
  Clock,
  Keyboard,
};

/** Outline (unfilled) star; aliased separately so callers can pick. */
export const StarOutline: React.ComponentType<SVGProps<SVGSVGElement>> = Star;

// ---------------------------------------------------------------------------
// Brand marks (inline). Lucide does not ship these and they are unlikely to
// change, so a small hand-rolled set is the cleanest path.
// ---------------------------------------------------------------------------

/** LinkedIn brand mark. */
export function LinkedIn(props: IconProps) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 4.5C4 3.4 4.9 2.5 6 2.5s2 .9 2 2-.9 2-2 2-2-.9-2-2zM4.4 8.5h3.2V21H4.4V8.5zM10.6 8.5h3v1.7c.5-.9 1.7-1.9 3.5-1.9 3.7 0 4.4 2.4 4.4 5.6V21h-3.2v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-3.2V8.5z" />
    </svg>
  );
}

/** Alias of `Mail` for callers that historically imported `MailIcon`. */
export const MailIcon = Mail;

/** Gmail multicolor mark. */
export function GmailMark(props: IconProps) {
  return (
    <svg
      {...props}
      viewBox="0 0 64 48"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gmail-red" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#EA4335" />
          <stop offset="1" stopColor="#C5221F" />
        </linearGradient>
        <linearGradient id="gmail-blue" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4285F4" />
          <stop offset="1" stopColor="#1A73E8" />
        </linearGradient>
        <linearGradient id="gmail-yellow" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FBBC05" />
          <stop offset="1" stopColor="#F9AB00" />
        </linearGradient>
        <linearGradient id="gmail-green" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#34A853" />
          <stop offset="1" stopColor="#1E8E3E" />
        </linearGradient>
      </defs>
      <path d="M2 8l30 22 30-22v32a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" fill="#fff" />
      <path d="M2 8l30 22 30-22L52 4H12L2 8z" fill="url(#gmail-red)" />
      <path d="M2 8v32a4 4 0 0 0 4 4h6V18L2 8z" fill="url(#gmail-blue)" />
      <path d="M62 8v32a4 4 0 0 1-4 4h-6V18l10-10z" fill="url(#gmail-green)" />
      <path d="M12 4h40L32 22 12 4z" fill="url(#gmail-yellow)" opacity="0.85" />
    </svg>
  );
}

/** Google Calendar multicolor mark. */
export function GoogleCalendarMark(props: IconProps) {
  return (
    <svg
      {...props}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <rect x="6" y="10" width="52" height="48" rx="6" fill="#fff" />
      <rect x="6" y="10" width="52" height="14" rx="6" fill="#1A73E8" />
      <rect x="6" y="20" width="52" height="4" fill="#1A73E8" />
      <rect x="16" y="6" width="6" height="12" rx="2" fill="#1A73E8" />
      <rect x="42" y="6" width="6" height="12" rx="2" fill="#1A73E8" />
      <text
        x="32"
        y="50"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="#1A73E8"
      >
        31
      </text>
    </svg>
  );
}

/** Google multicolor "G" mark. */
export function GoogleMark(props: IconProps) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9c-.3 1.4-1.1 2.5-2.3 3.3v2.7h3.7c2.2-2 3.3-4.9 3.3-7.8z"
        fill="#4285F4"
      />
      <path
        d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.7c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 20.5 7.6 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.6 13.9c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V6.8H1.8A11 11 0 0 0 1 12c0 1.8.4 3.4 1 4.9l3.6-3z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.5c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 2.1 15.1 1 12 1 7.6 1 3.7 3.5 1.8 7.1l3.8 2.9C6.5 7.4 9 5.5 12 5.5z"
        fill="#EA4335"
      />
    </svg>
  );
}