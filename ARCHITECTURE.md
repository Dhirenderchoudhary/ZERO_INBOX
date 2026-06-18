# System Architecture

Zero Inbox is designed as an event-driven, serverless application. The architecture minimizes long-running requests on the main Vercel edge/serverless functions by aggressively offloading heavy tasks (AI operations, email parsing) to background workers using Upstash QStash.

## 1. Authentication & Integration Layer

### Better Auth

We use [better-auth](https://better-auth.com/) for session management. It provides:

- Secure, HTTP-only session cookies.
- Role-based Access Control (RBAC) via the `admin()` plugin.
- Seamless OAuth 2.0 integration with Google.

### Corsair Integration

[Corsair](https://corsair.dev) sits between Zero Inbox and external APIs (Gmail, Google Calendar, Drive, GitHub).
When a user logs in via better-auth, a database webhook automatically provisions a Corsair tenant for that user and syncs their OAuth tokens. This means Zero Inbox never has to manage token refreshing or rate limiting for external APIs—Corsair proxies all requests and provides a unified interface.

## 2. Event-Driven Workflows

Heavy operations in Zero Inbox are completely asynchronous.

### QStash Background Workers

When a user takes a heavy action (e.g., initiating an AI triage of 50 emails):

1. The Next.js API route instantly responds to the client with `202 Accepted`.
2. A message is published to Upstash QStash.
3. QStash invokes our background API routes (e.g., `/api/qstash/triage`) with a strict timeout and retry policy.
4. The background worker processes the emails using OpenAI and updates the Neon PostgreSQL database.
5. The UI automatically reflects the changes via optimistic UI updates and TanStack Query polling/refetching.

### Realtime Webhooks

We consume external webhooks to keep the application state perfectly synced:

- **Corsair Webhooks:** Notifies the app immediately when a new email arrives or a calendar event is updated.
- **Razorpay Webhooks:** Automatically upgrades a user's subscription tier the millisecond a payment clears.

## 3. Data & Storage Layer

- **Neon PostgreSQL:** A serverless database with connection pooling built for high concurrency.
- **Drizzle ORM:** Ensures 100% type safety from the database schema up to the React components.
- **Upstash Redis:** Used purely for global sliding-window rate limiting to prevent abuse.

## 4. Security & Middleware

Every incoming request to the application passes through Next.js Middleware (`src/middleware.ts`):

1. **IP Extraction:** Determines the true client IP (handling Vercel proxy headers).
2. **Rate Limiting:** Checks Upstash Redis. If the user exceeds 100 requests per 10 seconds, they receive a `429 Too Many Requests`.
3. **CSP Injection:** Injects strict Content Security Policy (CSP) headers, explicitly allowing only trusted domains like `cdn.jsdelivr.net` for documentation and `checkout.razorpay.com` for billing.
