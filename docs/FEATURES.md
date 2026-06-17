# Core Features

Zero Inbox brings a suite of powerful, AI-driven tools directly into your email and calendar workflow. Here is a breakdown of the core functionalities included out of the box.

## 1. FlowMail AI Agent (`/agent`)

The AI Agent is a conversational interface that can read, write, and execute actions on your behalf using native OpenAI Tool Calling.

- **Contextual Awareness**: The Agent knows the current date, time, and your timezone (IST). It handles relative date requests like "Schedule a meeting with John next Tuesday" flawlessly.
- **Native Tool Calling**: The agent can autonomously execute the following tools:
  - `fetch_recent_emails`: Reads your latest inbox messages.
  - `send_email`: Drafts and sends an email via the Gmail API.
  - `create_event`: Creates calendar invites and optionally emails attendees.

## 2. Background Smart Triage (`/api/qstash/triage`)

Zero Inbox categorizes your emails in the background so you only see what matters.

- Powered by an **Upstash QStash** background job.
- Evaluates incoming emails against a strict system prompt using `gpt-4o-mini`.
- Categories include: `urgent`, `needs_reply`, `fyi`, `newsletter`, and `other`.
- Only unread/untriaged emails are processed to save OpenAI tokens.

## 3. Realtime Caching & Synchronization

- **Corsair Webhooks**: Native push notifications from Google Cloud ensure that whenever an email arrives, Zero Inbox knows instantly.
- **Upstash Redis**: The `getAiSummaryCache` and `getAiDraftCache` functions aggressively cache OpenAI responses. If you ask for a summary of the same email twice, the second request is instantly served from Redis, saving money and improving UI latency.

## 4. Razorpay Subscriptions (`/dashboard/billing`)

Zero Inbox includes a fully functional payment and subscription flow to monetize the AI Agent.

- **Usage Limits**: Free users are capped at 20 agent messages.
- **Pro Tier**: Upgrading via Razorpay unlocks 500 messages per month.
- **Webhooks**: The `/api/webhooks/razorpay` endpoint listens for `payment.captured` events and securely upgrades the user's `subscriptions` row in Postgres.

## 5. Speech-to-Text (`/api/speech-to-text`)

An accessibility and productivity feature that allows you to dictate your emails or chat prompts.

- Uses **OpenAI Whisper** (`whisper-1`).
- Custom prompting ensures it accurately captures English text while preventing unwanted script translations (e.g., forcing Devanagari/Hindi when speaking Hindustani).

## 6. Open API Reference (`/reference`)

The backend is completely documented via an interactive Swagger-like interface.

- Driven by `@scalar/nextjs-api-reference` and `trpc-to-openapi`.
- Converts your fully-typed tRPC routers directly into an OpenAPI 3.1 schema.
