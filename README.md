<div align="center">
  <div style="background-color: var(--bg-0); padding: 1rem; border-radius: 8px; display: inline-block;">
    <h1 align="center">ZERO_INBOX</h1>
    <p align="center">Command your inbox with AI</p>
  </div>
  
  <p align="center">
    <a href="https://github.com/Dhirenderchoudhary/ZERO_INBOX/actions"><img src="https://github.com/Dhirenderchoudhary/ZERO_INBOX/workflows/CI%20Pipeline/badge.svg" alt="CI Status"></a>
    <img src="https://img.shields.io/badge/Next.js-15.x-black?logo=next.js" alt="Next.js">
    <img src="https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css" alt="Tailwind">
    <img src="https://img.shields.io/badge/BetterAuth-Secure-green" alt="Better Auth">
  </p>
</div>

---

**ZERO_INBOX** is an enterprise-grade, multi-tenant communication platform. It seamlessly integrates with Gmail and Google Calendar to securely automate your communications, scheduling, and triage—saving you hours every week.

## 🚀 Features

- **Intelligent Triage**: AI-driven categorization automatically surfaces critical emails while archiving the noise.
- **Automated Scheduling**: Coordinate meetings, optimize your availability, and generate calendar invites seamlessly via natural language.
- **Accelerated Actions**: Draft responses, delegate tasks, and manage threads instantly with powerful keyboard shortcuts.
- **True Multi-Tenancy**: Built on top of the Corsair Universal API, isolating integrations entirely per user using `better-auth`.
- **Enterprise Testing & CI/CD**: Fully tested with Vitest, React Testing Library, and protected by Husky git hooks and GitHub Actions.

---

## 🏗️ Architecture & Stack

Built on the robust **T3 Stack** philosophy:

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org) + React 19
- **Authentication:** [Better Auth](https://better-auth.com/) (Google SSO)
- **Database:** PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
- **Integrations:** [Corsair API](https://corsair.dev) for OAuth & webhooks
- **API Layer:** [tRPC](https://trpc.io/) (Protected procedures)
- **Styling:** Tailwind CSS v4 + Framer Motion
- **Testing:** [Vitest](https://vitest.dev/) + React Testing Library

## 📁 Best-Practice Folder Structure

This project follows canonical App Router and T3 conventions for maximum scalability:

```text
/src
├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── (app)/            # Authenticated Routes (Inbox, Calendar, Agent)
│   ├── api/              # Route Handlers (Auth, Corsair webhooks, tRPC, Cron)
│   └── page.tsx          # Public Landing Page
├── components/           # Reusable UI Architecture
│   ├── ui/               # Base UI components (shadcn-like primitives)
│   ├── layout/           # High-level layouts (AppShell, Sidebar, Command Palette)
│   ├── email/            # Domain: Inbox components
│   ├── calendar/         # Domain: Calendar components
│   └── agent/            # Domain: AI Agent components
├── server/               # Secure Backend Logic
│   ├── api/routers/      # tRPC Endpoints (gmail.ts, calendar.ts, ai.ts)
│   ├── db/               # Database Connection & Drizzle Schemas
│   └── lib/              # Backend Utilities (Deduplication, Tenant fetching)
├── hooks/                # Custom React Hooks
├── lib/                  # Shared/Frontend Utilities & Configs
├── styles/               # Global CSS
└── test/                 # Testing global setup (Vitest/JSDOM)
```

---

## 🛠️ Quick Start Setup

### 1. Prerequisites

- Node.js (v20+)
- [pnpm](https://pnpm.io/)
- A PostgreSQL Database (Local or Neon/Supabase)

### 2. Environment Variables

Create a `.env` file from the example (if available) and fill in the following:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/zero_inbox"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication
BETTER_AUTH_SECRET="generate_with_openssl_rand_base64_32"
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"
```

### 3. Database Initialization

Generate and push the Drizzle schema to your database:

```bash
pnpm db:push
```

### 4. Run Development Server

```bash
pnpm dev
```

Navigate to `http://localhost:3000`.

---

## 🔌 Corsair Integration Setup

ZERO_INBOX uses Corsair to power multi-tenant Google API connections. To configure it for your Google Cloud Project:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/projectcreate) and enable **Gmail API** and **Google Calendar API**.
2. Run the Corsair setup using your OAuth credentials:
   ```bash
   pnpm corsair setup --gmail client_id=YOUR_ID client_secret=YOUR_SECRET
   pnpm corsair setup --googlecalendar client_id=YOUR_ID client_secret=YOUR_SECRET
   ```
3. (Optional) For real-time sync, enable Webhooks via Ngrok:
   ```bash
   pnpm corsair auth --plugin=gmail --webhooks
   pnpm corsair auth --plugin=googlecalendar --webhooks
   ```

---

## 🛡️ CI/CD & Contribution Guidelines

This repository enforces enterprise-grade code quality checks.

- **Husky & Lint-Staged:** Every `git commit` triggers an automatic format check (`Prettier`) and linter check (`ESLint`) via Husky.
- **Commitlint:** We enforce conventional commits. Your commit message MUST follow the format `type: description` (e.g., `feat: add robust sidebar`, `fix: header padding`).
- **GitHub Actions Pipeline:** Any push or PR to `main` executes the full CI pipeline (`.github/workflows/ci.yml`), which validates formatting, typing (`tsc --noEmit`), and passes all unit tests (`vitest`).

### Running Tests Locally

```bash
pnpm test          # Run tests once
pnpm test:watch    # Run in watch mode
pnpm typecheck     # Verify TypeScript strictly
```
