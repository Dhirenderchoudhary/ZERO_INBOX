# Zero Inbox Architecture

Zero Inbox is designed as a modern, decoupled monolithic application. It heavily leverages serverless patterns and robust background queueing to handle compute-intensive AI operations and network-heavy email fetching without degrading the user experience.

## High-Level Flow

1. **Frontend**: Next.js App Router (React Server Components + Client Components).
2. **API Layer**: tRPC acts as the strict, end-to-end typed connective tissue between the React frontend and the Node backend.
3. **Database**: Drizzle ORM queries a PostgreSQL database.
4. **Third-Party Integrations**: The `corsair` framework provides standardized data fetching, native OAuth tokens, and real-time webhooks for Gmail and Google Calendar.

---

## 1. Authentication & OAuth (Better Auth + Corsair)

Handling OAuth for Google APIs can be notoriously difficult due to token refreshes and scopes. Zero Inbox solves this using a two-pronged approach:

- **Better Auth**: Manages the core application session, JWTs, and database `users`/`sessions` records. It acts as the primary login provider using Google SSO.
- **Corsair Framework**: Instead of manually passing tokens, we use `@corsair-dev/gmail` and `@corsair-dev/googlecalendar`. Corsair handles encrypting the user's refresh tokens inside the database (using `CORSAIR_KEK`) and automatically refreshes them whenever a Google API request is made.

---

## 2. Background Processing (Upstash QStash & Workflows)

Zero Inbox relies heavily on **Upstash** for asynchronous tasks to prevent Vercel Serverless Function timeouts (which typically occur after 10-15 seconds on free tiers).

### Email Scheduling

When a user schedules an email to be sent later:

1. We save a `scheduledEmails` row in the database.
2. We publish a JSON payload to **Upstash QStash** with a `delay` parameter.
3. QStash holds the message. At the exact delayed time, it fires a POST request to `/api/qstash/send-email`.
4. The webhook verifies the QStash signature, grabs the user's Corsair token, and dispatches the email via Gmail APIs.

### Background Triage

When a user wants to triage their entire inbox, doing so synchronously via OpenAI would take minutes.

1. The tRPC mutation triggers an **Upstash Workflow**.
2. The Workflow processes the inbox in batches using durable execution.
3. If OpenAI rate limits or fails, Upstash automatically retries the specific failed step without restarting the entire inbox sync.

---

## 3. The AI Agent (`/api/trpc/ai.agentChat`)

The heart of Zero Inbox is the Agentic Chat. It uses **OpenAI native function calling** to give the LLM control over the user's data.

**The Feedback Loop:**

1. User sends a message ("Read my latest emails and summarize them").
2. The Node backend injects a heavy system prompt enforcing Indian Standard Time (IST) and strict conversational rules.
3. OpenAI responds with a `tool_call` requesting to execute the `fetch_recent_emails` tool.
4. The backend executes the Corsair query, grabs the emails, and pushes the result back into the OpenAI messages array as a `tool` role.
5. OpenAI analyzes the raw email data and responds with a beautiful markdown summary for the user.
6. The entire conversation, including invisible tool outputs, is saved to `agentMessages` in Postgres to preserve context.

---

## 4. Real-time Webhooks

To keep the UI snappy, we utilize `Corsair` webhooks.
Whenever an email is received natively in the user's actual Gmail inbox:

1. Google sends a push notification to Corsair.
2. Corsair forwards a standardized `message.created` payload to `/api/webhooks/corsair`.
3. The webhook caches the new data and invalidates any related Redis caches (`@upstash/redis`), meaning the user's dashboard is instantly updated without them needing to refresh the page.
