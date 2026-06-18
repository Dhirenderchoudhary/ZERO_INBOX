# Zero Inbox

Zero Inbox is a production-grade AI productivity platform that connects to your Gmail, Google Calendar, Google Drive, and GitHub, letting you manage them through natural language. It ships two distinct interaction modes: an agentic chat interface powered by custom AI agents, and a traditional manual interface for direct inbox and calendar management. Both modes are served from a single Next.js 16 application deployed on Vercel. An internal admin panel gives operators full visibility into users, AI usage, costs, security events, sessions, and revenue.

---

## 🚀 Quick Links

- **[Live Demo](https://www.zeroinbox.fun/)** - Try the fully working app.
- **[API Reference](https://www.zeroinbox.fun/reference)** - Stunning interactive Scalar API documentation.
- **[Pricing & Billing](https://www.zeroinbox.fun/pricing)** - See our subscription tiers and Razorpay integration.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [Agent Pipeline](#agent-pipeline)
7. [Authentication](#authentication)
8. [Database Schema](#database-schema)
9. [API Routes](#api-routes)
10. [tRPC Routers](#trpc-routers)
11. [Admin Panel](#admin-panel)
12. [Plans and Billing](#plans-and-billing)
13. [Rate Limiting and Quotas](#rate-limiting-and-quotas)
14. [Background Jobs](#background-jobs)
15. [Payment Integration](#payment-integration)
16. [Theming](#theming)
17. [Middleware](#middleware)
18. [Testing](#testing)
19. [CI/CD](#cicd)
20. [Environment Variables](#environment-variables)
21. [Local Development](#local-development)
22. [Database Management](#database-management)
23. [Deployment](#deployment)

---

## Overview

Zero Inbox integrates deeply with third-party tools using **Corsair**, an integration layer that handles OAuth flows, credential storage, API proxying, and entity caching. Users sign in with Google, grant the required OAuth scopes, and immediately get access to:

- An AI chat interface (Agentic mode) where an AI agent can read emails, draft and send messages, create calendar events, search GitHub, and query Drive documents.
- A manual interface where the user browses, searches, reads, composes, and manages emails and events directly without AI involvement.
- A preferences system where users configure AI writing style, email focus areas, signatures, and digest settings.
- An admin panel at `/admin` with full operational telemetry: user management, live sessions, revenue, security logs, and AI insights.
- Fully interactive API documentation powered by Scalar at `/reference`.

The platform enforces per-plan monthly usage quotas, per-minute rate limits, and processes payments securely through Razorpay.

---

## Architecture

For a deep dive into the system design, see [ARCHITECTURE.md](ARCHITECTURE.md).

```
Browser
  |
  +-- Next.js 16 App Router (Vercel)
        |
        +-- Landing page            /
        +-- Dashboard               /dashboard/*
        +-- Admin panel             /admin/*
        +-- API Reference           /reference
        +-- Auth callbacks          /api/auth/*
        +-- Background Jobs         /api/qstash/*
        +-- Payments                /api/create-order, /api/verify-payment
        +-- tRPC                    /api/trpc/*
        +-- Corsair management      /api/corsair/*
        |
        +-- better-auth             Session management, Google OAuth
        +-- Corsair                 Integration layer (Gmail, Calendar, Drive, GitHub)
        +-- Drizzle ORM             Type-safe queries against PostgreSQL
        +-- Neon PostgreSQL         Serverless database
        +-- Upstash Redis           Sliding-window rate limiter
        +-- Upstash QStash          Background job queues and delayed workflows
        +-- Razorpay                Payment order creation and verification
```

Every request to `/dashboard/*` and `/admin/*` is gated by middleware (`src/middleware.ts`) that checks for a valid better-auth session cookie. Admin routes additionally require role verification.

---

## Tech Stack

| Category        | Technology                         | Notes                                    |
| --------------- | ---------------------------------- | ---------------------------------------- |
| Framework       | Next.js 16.2.9                     | App Router, React Server Components      |
| Language        | TypeScript 5                       | Strict mode throughout                   |
| UI              | React 19, Tailwind CSS 4           | Custom components using shadcn/ui        |
| State           | TanStack Query v5                  | Server state, cache, invalidation        |
| Data layer      | tRPC v11                           | End-to-end type safety                   |
| ORM             | Drizzle ORM                        | Schema-first, migration via drizzle-kit  |
| Database        | Neon PostgreSQL                    | Serverless connection pooling            |
| Auth            | better-auth                        | Google OAuth, session cookies            |
| Integrations    | Corsair                            | API proxy, entity caching, seamless auth |
| AI models       | OpenAI GPT-4o-mini                 | Core agent intelligence                  |
| Rate limiting   | Upstash Redis (@upstash/ratelimit) | Sliding window, serverless-safe          |
| Background Jobs | Upstash QStash                     | Webhook queueing and async email sending |
| Payments        | Razorpay                           | INR, order creation, HMAC verification   |
| API Docs        | Scalar                             | Interactive OpenAPI 3.1.0 reference      |
| Deployment      | Vercel                             | Node.js runtime for all API routes       |

---

## Project Structure

<details>
<summary>Click to expand full file tree</summary>

```
src/
  app/
    page.tsx                        Landing page
    layout.tsx                      Root layout, fonts, TRPCReactProvider
    globals.css                     Tailwind imports, light/dark theme
    dashboard/
      page.tsx                      Main dashboard overview
      layout.tsx                    Dashboard layout
      billing/
        page.tsx                    Plan card, usage meters, Razorpay checkout
    admin/
      layout.tsx                    Server component auth guard
      page.tsx                      Admin overview KPIs
      analytics/page.tsx            Analytics charts
      users/page.tsx                User management table
      settings/page.tsx             Global security settings
    api/
      auth/[...all]/route.ts        better-auth catch-all handler
      corsair/callback/route.ts     OAuth callback
      create-order/route.ts         POST — creates Razorpay order
      verify-payment/route.ts       POST — verifies HMAC
      qstash/send-email/route.ts    POST — QStash async email worker
      qstash/triage/route.ts        POST — QStash async triage worker
      webhooks/razorpay/route.ts    POST — Razorpay server webhook
      trpc/[trpc]/route.ts          tRPC HTTP handler
    reference/
      route.ts                      Scalar API interactive documentation

  components/
    ui/                             shadcn/ui primitive components
    email/                          Manual mode email components
    agent/                          Agentic chat interfaces
    dashboard/                      Dashboard widgets

  lib/
    auth.ts                         better-auth config
    schemas.ts                      Zod validation schemas

  server/
    db/
      index.ts                      Drizzle db client
      schema.ts                     All PostgreSQL tables
    api/
      routers/                      tRPC routers (gmail, calendar, etc.)

  middleware.ts                     Next.js middleware (CSP, rate-limiting)
```

</details>

---

## Core Features

- **Agentic Chat:** Execute complex workflows across integrations using natural language.
- **Manual Mode:** A beautifully designed traditional email and calendar client.
- **Secure Billing:** End-to-end Razorpay integration with Webhook syncing.
- **Background Async Triage:** Heavy AI operations are offloaded to Upstash QStash.
- **Interactive Docs:** Live Scalar API docs at `/reference`.
- **Global Rate Limiting:** Powered by Upstash Redis to prevent abuse.

---

## Database Schema

We use **Drizzle ORM** with **Neon Postgres**. Key tables include:

- `user`, `session`, `account` (better-auth)
- `corsairIntegrations`, `corsairAccounts`, `corsairEntities` (Corsair SDK)
- `emailTriage`, `scheduledEmails`, `agentMessages` (Core Application)
- `subscriptions`, `usage`, `invoices` (Billing & Usage)
- `securityEvents`, `liveSessions` (Admin Telemetry)

---

## Testing & CI/CD

- **Tests:** Vitest is used for fast, concurrent unit testing (`pnpm test`).
- **CI/CD:** GitHub Actions automatically runs `pnpm build`, `pnpm test`, and `pnpm format:check` on every push to `main`.
- **Formatting:** Prettier ensures code consistency across the repository.

---

## Local Development

1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```
2. Copy `.env.example` to `.env` and fill in your secrets (Neon URL, Upstash Redis, Upstash QStash, Razorpay, OpenAI, Corsair, Better Auth).
3. Start the development server:
   ```bash
   pnpm dev
   ```

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).
For security reporting, see [SECURITY.md](SECURITY.md).
