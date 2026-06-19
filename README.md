## social links 
[yc style intro](https://x.com/shay_ik/status/2067562208020815936?s=20) <br>
regular updates on social media - <br>
[day0](https://x.com/shay_ik/status/2063676013113209190?s=20) <br>
[day1](https://x.com/shay_ik/status/2064761198739145102?s=20) <br>
[frontend video](https://x.com/shay_ik/status/2065049553456554391?s=20) <br>
[Sneak Peak](https://x.com/shay_ik/status/2066927321165246967?s=20) <br>
[Demo video of product](https://x.com/shay_ik/status/2067918979277201740?s=20)

# [Voyage](https://voyage.atishayjain.engineer)

**Your AI-powered workspace that talks to your inbox and calendar.**

Voyage is a multi-tenant workspace that connects to Gmail and Google Calendar, syncs and embeds your emails for semantic search, and lets you interact with everything through an AI chat — all in one dark, neon-lit interface.

---

## What it does

- **Email sync & search** — Pulls your Gmail threads, generates vector embeddings for semantic search, and groups conversations by thread
- **Calendar integration** — Reads Google Calendar events, displays them on a dynamic timeline with a real-time now-line
- **AI chat** — Stream responses from an AI agent that can search your emails, read calendar events, look up contacts, and compose replies — all via natural language
- **Smart compose** — Reply, reply-all, and forward with pre-filled context; compose new emails from a modal
- **Semantic search** — Hybrid vector + keyword search across your entire email corpus with ranked results
- **Contacts** — Manage contacts with colored avatars; the AI uses them for context-aware responses
- **Daily summaries** — Scheduled email digest delivered at your chosen time

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Auth | Clerk |
| Database | PostgreSQL + Drizzle ORM |
| Email/Calendar | Gmail API + Google Calendar API via Corsair |
| AI | OpenAI Agents SDK, Google Gemini Embeddings |
| Background jobs | Inngest |
| Vector search | pgvector (cosine similarity) |

## Getting started

```bash
# 1. Clone and install
git clone <repo-url> && cd corsair
pnpm install

# 2. Set up environment
cp .env.example .env
# Fill in: DATABASE_URL, CLERK_SECRET_KEY, CORSAIR_KEK,
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.

# 3. Push database schema
pnpm db:push

# 4. Run dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
├── api/                    # Route handlers
│   ├── chat/               # Streaming AI chat (SSE)
│   ├── emails/             # Fetch, send, reply, forward
│   ├── calendar/           # Event CRUD
│   ├── contacts/           # Contact management
│   ├── search/             # Hybrid semantic search
│   └── webhooks/           # Gmail Pub/Sub + Clerk webhooks
├── workspace/
│   └── _components/        # UI components
│       ├── WorkspaceShell   # Main layout orchestrator
│       ├── NavRail          # Side navigation
│       ├── MainPanel        # Thread detail view
│       ├── ChatPanel        # AI chat with streaming
│       ├── CalendarSidebar  # Dynamic calendar timeline
│       └── TrayView         # Mail, contacts, settings, keys
├── api/inngest/            # Background job handlers
├── db/                     # Schema + migrations
├── lib/                    # Hooks, search, preferences
└── server/                 # Corsair client, AI agent
```

## Key features

| Feature | Shortcut |
|---------|----------|
| Toggle mail tray | `[` |
| Toggle calendar | `]` |
| Next section | `Ctrl + →` |
| Previous section | `Ctrl + ←` |


## Environment variables

```env
# Database
DATABASE_URL=postgresql://...

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/loading
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/loading
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/loading
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/loading

# Corsair
CORSAIR_KEK=your-kek-base64

# AI
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/


# Inngest
INNGEST_DEV=1

# App
APP_URL=http://localhost:3000
```



