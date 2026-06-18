<div align="center">
  <img src="public/zero-inbox-logo-120.png" width="120" height="120" alt="Zero Inbox Logo" />
  <h1>Zero Inbox</h1>
  <p><strong>Your entire workday. One autonomous command center.</strong></p>
  <p>An AI-first communication platform that connects Gmail, Google Calendar, Google Drive, and GitHub into a single intelligent workspace — so you stop switching tabs and start getting things done.</p>
  <br/>
  <img src="https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/tRPC-11-2596be?style=flat-square&logo=trpc" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/AI-OpenAI%20GPT--4o--mini-412991?style=flat-square&logo=openai" />
  <img src="https://img.shields.io/badge/Corsair-SDK-ff6b35?style=flat-square" />
  <img src="https://img.shields.io/badge/Upstash-QStash%20%2B%20Redis-dc382d?style=flat-square&logo=redis" />
  <br/><br/>
  <a href="https://www.zeroinbox.fun/"><strong>🌐 Live Demo</strong></a> · 
  <a href="https://zero-inbox-eight.vercel.app/"><strong>⚡ Vercel Mirror</strong></a> · 
  <a href="https://github.com/Dhirenderchoudhary/ZERO_INBOX"><strong>⭐ Star on GitHub</strong></a>
</div>

---

## The Problem

Modern knowledge workers live across 5–7 different tools simultaneously. You get an email asking to schedule a meeting — so you open Calendar. Someone asks about a PR — so you flip to GitHub. A colleague shares a Drive doc in an email — you open that in another tab.

**Every context switch costs 20+ minutes of deep focus.** By end of day, you've spent more time *navigating* your tools than actually *using* them.

The deeper problem: these tools are **intrinsically linked** but artificially separated:
- An email often *becomes* a calendar event  
- A calendar event often has *attachments in Drive*  
- A PR review often *needs an email follow-up*  
- A task in your inbox is *blocking a meeting on your calendar*

Email clients show you email. Calendar apps show you events. GitHub shows you code. **None of them understand the connections between them.**

---

## The Solution

Zero Inbox is a **unified AI command center** that treats your email, calendar, code, and files as one connected stream — not four separate silos.

Instead of switching between apps, you have **one intelligent workspace** where AI autonomously:

- 🔴 **Triages** every incoming email (Urgent / Needs Reply / FYI / Newsletter)
- 📝 **Summarizes** threads in 2–3 sentences so you never read spam
- ✍️ **Drafts** context-aware replies in your professional tone
- 📅 **Detects** meeting requests and manages your calendar
- 📁 **Searches** your Google Drive files instantly
- 🔀 **Tracks** GitHub repositories and issues
- 💬 **Executes** multi-step workflows via natural language

**The core insight:** your workday is a single stream of context. Zero Inbox makes your tools reflect that reality.

---

## Features

### 🧠 Autonomous AI Triage Engine

Every incoming email is autonomously evaluated in the background using **Upstash QStash** durable webhooks and **OpenAI GPT-4o-mini**. No manual sorting required.

| Priority | Color | Meaning |
|----------|-------|---------|
| **Urgent** | 🔴 | Fires that need your immediate attention today |
| **Needs Reply** | 🔵 | The sender is waiting for your response |
| **FYI** | 🟣 | Read when you have free time |
| **Newsletter** | ⚪ | Auto-archived promotional content |

The triage runs entirely in the background via QStash workers — the UI is never blocked.

---

### 🤖 AI Agent — Natural Language Operations

A conversational AI assistant embedded directly in the workspace. Talk to it in plain English and it takes real actions across your connected services.

| Category | Actions |
|----------|---------|
| **Gmail** | Read inbox, summarize threads, draft replies, send emails, compose new |
| **Calendar** | List today's events, create meetings, check availability |
| **Google Drive** | Search files, find recent documents, retrieve shareable links |
| **GitHub** | List repositories, browse issues, track PRs |
| **Multi-step** | "Summarize my inbox, draft a reply to the urgent one, and schedule a follow-up" — all in one command |

---

### 📬 Premium Inbox Experience

A Gmail-tier email interface with everything you need:

- **Real-time sync** — inbox polls every 5 seconds for instant updates
- **Thread view** with full email body rendering (HTML + plaintext)
- **AI Summarize** — one-click GPT summary of any email
- **AI Draft Reply** — context-aware professional reply generation
- **Quick actions** — archive, star, snooze, mark read/unread
- **Priority filtering** — Urgent, Needs Reply, FYI, Starred, Sent, Unread tabs
- **Full compose** with To, CC, Subject, rich body editor
- **Scheduled send** via QStash delayed delivery
- **Keyboard shortcuts** — `j/k` navigation, `r` reply, `a` archive, `s` star

---

### 📅 Calendar Integration

Full Google Calendar integration with:
- Weekly agenda view with event details
- One-click event creation from the sidebar
- AI-detected meeting requests from email threads

---

### 📁 Google Drive Hub

- Search and browse your cloud files directly
- File type icons (Docs, Sheets, Images)
- One-click open in Google Drive
- OAuth-secured connection

---

### 🔀 GitHub Integration

- Repository listing and issue tracking
- PR status monitoring
- Connected via Corsair SDK

---

### 👑 Admin Dashboard & RBAC

A robust administrative panel secured behind Role-Based Access Control:

- **User management** — view all registered users, roles, and activity
- **Platform analytics** — active users, total emails processed, AI actions
- **Security monitoring** — session tracking, authentication events
- **Role management** — promote/demote users between User and Admin roles

---

### 🛡️ Enterprise-Grade Security & Validation

Zero Inbox features a **production-hardened backend**:

- **Zod validation** on every tRPC mutation, query input, webhook payload, and AI tool call
- **Rate limiting** via Upstash Redis (10 AI requests/min per user)
- **Content Security Policy (CSP)** headers
- **RBAC middleware** protecting admin routes
- **Input sanitization** — if the AI hallucinates malformed JSON, the system catches it before hitting the database

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ZERO INBOX                                │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   Next.js    │   tRPC API   │  Drizzle ORM │   Upstash QStash   │
│  App Router  │  + Zod Layer │  + Neon PG   │  Background Jobs   │
├──────────────┴──────────────┴──────────────┴────────────────────┤
│                      Corsair SDK Layer                           │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  Gmail    │  │  Calendar    │  │   Drive    │  │  GitHub   │ │
│  │  OAuth    │  │  OAuth       │  │   OAuth    │  │  API Key  │ │
│  └──────────┘  └──────────────┘  └────────────┘  └───────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  OpenAI GPT-4o-mini  │  Upstash Redis  │  Better Auth (OAuth)  │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | Server components, API routes, middleware |
| **Language** | TypeScript 5 (strict) | End-to-end type safety |
| **API** | tRPC 11 + Zod | Type-safe RPC with runtime validation |
| **Database** | PostgreSQL (Neon Serverless) | Persistent storage |
| **ORM** | Drizzle ORM | Type-safe SQL queries with migrations |
| **Auth** | Better Auth + Google OAuth | Social login with session management |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS with accessible components |
| **Animations** | Framer Motion | Smooth micro-interactions and transitions |
| **AI** | OpenAI GPT-4o-mini | Summarization, triage, drafting, agent chat |
| **Caching** | Upstash Redis | AI response caching, rate limiting |
| **Background Jobs** | Upstash QStash | Durable webhook-based job queue |
| **Integrations** | Corsair SDK | Gmail, Calendar, Drive, GitHub unified API |
| **Deployment** | Vercel | Edge-optimized hosting |
| **CI/CD** | GitHub Actions | Lint, typecheck, test, build verification |

---

## 📂 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated app routes
│   │   ├── dashboard/            # Executive dashboard + billing
│   │   ├── inbox/                # Email triage interface
│   │   ├── calendar/             # Calendar management
│   │   ├── drive/                # Google Drive file browser
│   │   ├── agent/                # Full-page AI agent
│   │   ├── github/               # GitHub integration
│   │   ├── settings/             # User preferences
│   │   └── security/             # Security & session management
│   ├── (admin)/                  # Admin-only routes (RBAC protected)
│   │   └── admin/                # User management, analytics, settings
│   ├── api/                      # API routes
│   │   ├── trpc/                 # tRPC endpoint handler
│   │   ├── corsair/              # OAuth connect/callback
│   │   ├── qstash/               # Background job webhooks
│   │   ├── webhooks/             # Corsair + Razorpay webhooks
│   │   └── auth/                 # Better Auth handler
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── email/                    # Email list, detail, compose, row
│   ├── calendar/                 # Calendar views and event creation
│   ├── agent/                    # AI chat and floating assistant
│   ├── admin/                    # Admin dashboard components
│   ├── layout/                   # App shell, sidebar, command palette
│   └── ui/                       # shadcn/ui primitives
├── server/                       # Backend logic
│   ├── api/routers/              # tRPC routers (gmail, ai, calendar, drive, github, billing, dashboard)
│   ├── lib/                      # Utilities (schemas, cache, qstash, tenant, emailUtils, dedup)
│   ├── db/                       # Drizzle schema + database connection
│   └── corsair.ts                # Corsair SDK initialization
├── hooks/                        # Custom React hooks
├── lib/                          # Client-side utilities
└── test/                         # Vitest unit tests
```

---

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database (recommend [Neon](https://neon.tech))
- Google Cloud project with OAuth credentials
- OpenAI API key

### 1. Clone & Install

```bash
git clone https://github.com/Dhirenderchoudhary/ZERO_INBOX.git
cd ZERO_INBOX
pnpm install
```

### 2. Environment Variables

Copy the example and fill in your keys:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `CORSAIR_KEK` | Corsair Key Encryption Key |
| `TENANT_ID` | Corsair tenant identifier |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o-mini |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g., `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `BETTER_AUTH_SECRET` | Auth session encryption secret |

### 3. Database Setup

```bash
pnpm run db:push
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` and experience the future of autonomous communication.

---

## 🧪 Testing & CI/CD

Zero Inbox includes a comprehensive CI/CD pipeline via GitHub Actions:

```bash
# Run unit tests
pnpm test

# Type checking
pnpm typecheck

# Lint & format
pnpm lint
pnpm format:check

# Production build
pnpm build
```

The CI pipeline runs on every push to `main`:
1. **Setup & Cache** — Install dependencies with pnpm cache
2. **Lint & Format** — ESLint + Prettier verification
3. **Typecheck** — Full TypeScript strict mode check
4. **Unit Tests** — Vitest test suite
5. **Build Verification** — Full Next.js production build

---

## 👥 Team

<table>
  <tr>
    <td align="center">
      <strong>Dev</strong><br/>
      <em>CEO & Founder</em><br/>
      Full-stack architecture, AI integration, and product vision
    </td>
  </tr>
</table>

---

## 📄 License

This project is built for the [ChaiCode](https://chaicode.com) × [Corsair](https://corsair.dev) Hackathon 2025.

---

<div align="center">
  <strong>Built with extreme focus on speed, enterprise security, and AI guardrails.</strong><br/>
  <em>Zero Inbox — Command every workflow from one inbox.</em>
</div>
