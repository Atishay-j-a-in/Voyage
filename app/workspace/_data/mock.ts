/**
 * Mock data for the workspace.
 *
 * In a real build this would be hydrated from the Gmail + Google
 * Calendar APIs. For the prototype, we ship a deterministic set
 * that matches the design image: an Amazon ML email as the
 * selected thread, plus a few peer threads, and a Friday calendar
 * day with 4 events.
 */




export type MailFolder = "inbox" | "drafts" | "sent" | "trash";

export interface EmailThread {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  /** ISO timestamp (or human label like "9:41 AM"). */
  timestamp: string;
  isPrimary: boolean;
  isUnread: boolean;
  isStarred: boolean;
  isImportant: boolean;
  /** Gmail labels */
  labels?: string[];
  /** Mail folder this thread belongs to. "inbox" is the default. */
  folder: MailFolder;
  body: string[];
  recipients: string[];
  /** Raw From header for detail view */
  rawFrom?: string;
  /** Raw subject for detail view */
  rawSubject?: string;
  /** Number of messages in thread */
  messageCount?: number;
}

export const mockEmailThreads: EmailThread[] = [
  {
    id: "amazon-ml",
    sender: "Amazon ML Team",
    subject: "Amazon ML Summer School – Applications Open",
    snippet: "Dear Arjun, we are excited to announce that…",
    timestamp: "9:41 AM",
    isPrimary: true,
    isUnread: true,
    isStarred: true,
    isImportant: true,
    folder: "inbox",
    recipients: ["no-reply@amazon.com", "to me"],
    rawFrom: "Amazon ML Team <no-reply@amazon.com>",
    body: [
      "Dear Arjun,",
      "",
      "We are excited to announce that applications for the Amazon ML Summer School are now open!",
      "",
      "This is an incredible opportunity to learn from industry experts and work on real-world projects.",
      "",
      "Best regards,",
      "Amazon ML Team",
    ],
  },
  {
    id: "rahul",
    sender: "Rahul Chatterjee",
    subject: "Interview Schedule – Next Steps",
    snippet: "Hi Arjun, following up on our conversation…",
    timestamp: "8:30 AM",
    isPrimary: false,
    isUnread: false,
    isStarred: false,
    isImportant: false,
    folder: "inbox",
    recipients: ["rahul@example.com"],
    rawFrom: "Rahul Chatterjee <rahul@example.com>",
    body: ["Hi Arjun,", "", "Following up on our conversation."],
  },
  {
    id: "gsoc",
    sender: "Google Summer of Code",
    subject: "Welcome to GSoC 2024!",
    snippet: "Congratulations! You have been selected…",
    timestamp: "Yesterday",
    isPrimary: false,
    isUnread: false,
    isStarred: false,
    isImportant: false,
    folder: "inbox",
    recipients: ["gsoc@example.org"],
    rawFrom: "Google Summer of Code <gsoc@example.org>",
    body: ["Congratulations!"],
  },
  {
    id: "linkedin",
    sender: "LinkedIn",
    subject: "New job recommendations for you",
    snippet: "We found 12 new opportunities that match…",
    timestamp: "May 23",
    isPrimary: false,
    isUnread: false,
    isStarred: false,
    isImportant: false,
    folder: "inbox",
    recipients: ["noreply@linkedin.com"],
    rawFrom: "LinkedIn <noreply@linkedin.com>",
    body: ["We found 12 new opportunities for you."],
  },
  {
    id: "spotify",
    sender: "Spotify",
    subject: "Your weekly listening report is here",
    snippet: "You listened to 326 songs this week. Check…",
    timestamp: "May 22",
    isPrimary: false,
    isUnread: false,
    isStarred: false,
    isImportant: false,
    folder: "inbox",
    recipients: ["noreply@spotify.com"],
    rawFrom: "Spotify <noreply@spotify.com>",
    body: ["326 songs this week."],
  },
  {
    id: "notion",
    sender: "Notion Team",
    subject: "Introducing Notion AI",
    snippet: "Write better, faster with the power of AI…",
    timestamp: "May 21",
    isPrimary: false,
    isUnread: false,
    isStarred: false,
    isImportant: false,
    folder: "inbox",
    recipients: ["team@notion.so"],
    rawFrom: "Notion Team <team@notion.so>",
    body: ["Introducing Notion AI."],
  },
  {
    id: "michael",
    sender: "Michael Wilson",
    subject: "Important Announcement",
    snippet: "Project update — please review…",
    timestamp: "May 20",
    isPrimary: false,
    isUnread: false,
    isStarred: false,
    isImportant: false,
    folder: "inbox",
    recipients: ["michael@example.com"],
    rawFrom: "Michael Wilson <michael@example.com>",
    body: ["Project update."],
  },
  {
    id: "draft-product-spec",
    sender: "Draft",
    subject: "Product spec - draft",
    snippet: "Working draft of the next product spec.",
    timestamp: "Yesterday",
    isPrimary: false,
    isUnread: false,
    isStarred: false,
    isImportant: false,
    folder: "drafts",
    recipients: ["to me"],
    rawFrom: "",
    body: ["Draft body."],
  },
  {
    id: "sent-quick-followup",
    sender: "Sent",
    subject: "Quick follow-up",
    snippet: "Sent: looking forward to hearing back.",
    timestamp: "Mon 4:12 PM",
    isPrimary: false,
    isUnread: false,
    isStarred: false,
    isImportant: false,
    folder: "sent",
    recipients: ["to contact@acme.com"],
    rawFrom: "",
    body: ["Sent body."],
  },
  {
    id: "trash-old-newsletter",
    sender: "Old newsletter",
    subject: "Weekly digest - April",
    snippet: "Deleted newsletter from April.",
    timestamp: "Apr 12",
    isPrimary: false,
    isUnread: false,
    isStarred: false,
    isImportant: false,
    folder: "trash",
    recipients: ["noreply@news.example"],
    rawFrom: "",
    body: ["Trashed body."],
  },
];

export type CalendarEvent = {
  id: string;
  title: string;
  /** 24h hour [0,24). */
  startHour: number;
  endHour: number;
  variant: "primary" | "secondary";
};

export const MOCK_EVENTS: CalendarEvent[] = [
  { id: "standup",    title: "Team Standup",      startHour: 9,    endHour: 9.5,  variant: "primary" },
  { id: "review",     title: "Product Review",    startHour: 10.5, endHour: 12.5, variant: "primary" },
  { id: "client",     title: "Client Call",       startHour: 13,   endHour: 14,   variant: "secondary" },
  { id: "proposal",   title: "Review Proposal",   startHour: 15,   endHour: 16,   variant: "primary" },
];

export const MOCK_FILTERS = [
  { id: "primary",   label: "Primary",   badge: undefined as string | undefined },
  { id: "promotions", label: "Promotions", badge: undefined as string | undefined },
  { id: "updates",   label: "Updates",   badge: "2 new" },
];

/** 6x7 month grid for May 2024 (Sun-first). First cell is the Sun
 *  preceding May 1. */
export const MOCK_MONTH: {
  monthLabel: string;
  today: number;
  days: Array<{ day: number; muted: boolean; isToday: boolean }>;
} = {
  monthLabel: "June 2026",
  today: 18,
  days: [
    { day: 28, muted: true,  isToday: false }, { day: 29, muted: true,  isToday: false },
    { day: 30, muted: true,  isToday: false }, { day: 1,  muted: false, isToday: false },
    { day: 2,  muted: false, isToday: false }, { day: 3,  muted: false, isToday: false },
    { day: 4,  muted: false, isToday: false },
    { day: 5,  muted: false, isToday: false }, { day: 6,  muted: false, isToday: false },
    { day: 7,  muted: false, isToday: false }, { day: 8,  muted: false, isToday: false },
    { day: 9,  muted: false, isToday: false }, { day: 10, muted: false, isToday: false },
    { day: 11, muted: false, isToday: false },
    { day: 12, muted: false, isToday: false }, { day: 13, muted: false, isToday: false },
    { day: 14, muted: false, isToday: false }, { day: 15, muted: false, isToday: false },
    { day: 16, muted: false, isToday: false }, { day: 17, muted: false, isToday: false },
    { day: 18, muted: false, isToday: false },
    { day: 19, muted: false, isToday: false }, { day: 20, muted: false, isToday: false },
    { day: 21, muted: false, isToday: false }, { day: 22, muted: false, isToday: false },
    { day: 23, muted: false, isToday: false }, { day: 24, muted: false, isToday: true  },
    { day: 25, muted: false, isToday: false },
    { day: 26, muted: false, isToday: false }, { day: 27, muted: false, isToday: false },
    { day: 28, muted: false, isToday: false }, { day: 29, muted: false, isToday: false },
    { day: 30, muted: false, isToday: false }, { day: 31, muted: false, isToday: false },
    { day: 1,  muted: true,  isToday: false },
  ],
};
// ---------------------------------------------------------------------------
// Tray mode content (shown in the left panel when a rail icon is clicked).
// ---------------------------------------------------------------------------

export interface TrayContact {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  isOnline: boolean;
}

export const MOCK_CONTACTS: TrayContact[] = [
  { id: "c1", name: "Arjun Mehta",     role: "Voyage \u00B7 Admin",   initials: "AM", color: "#5b21b6", isOnline: true  },
  { id: "c2", name: "Priya Nair",      role: "Product",                initials: "PN", color: "#0ea5e9", isOnline: true  },
  { id: "c3", name: "Rahul Chatterjee", role: "Engineering",           initials: "RC", color: "#10b981", isOnline: false },
  { id: "c4", name: "Sara Iyer",       role: "Design",                 initials: "SI", color: "#f59e0b", isOnline: true  },
  { id: "c5", name: "Karan Joshi",     role: "Sales",                  initials: "KJ", color: "#ef4444", isOnline: false },
];

export interface TrayAIConversation {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
}

export const MOCK_AI_CONVERSATIONS: TrayAIConversation[] = [
  { id: "ai1", title: "Summarize this week\u2019s inbox",   preview: "I grouped 47 unread threads by sender\u2026", updatedAt: "2m"  },
  { id: "ai2", title: "Draft reply to Amazon ML Team",     preview: "Thank you for the opportunity \u2014 I would love\u2026", updatedAt: "12m" },
  { id: "ai3", title: "Find a 30-min slot Friday",         preview: "Best open window: 2:30\u20133:00 PM",            updatedAt: "1h"  },
  { id: "ai4", title: "Triage Updates vs Primary",         preview: "47 threads \u00B7 12 actionable \u00B7 35 archive",  updatedAt: "3h"  },
];