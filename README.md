# Zero Inbox ⚡️

> An AI-powered email and calendar management platform designed to help you hit Inbox Zero efficiently and effortlessly. Built with Next.js, tRPC, Upstash, and the Corsair integration framework.

## Overview

**Zero Inbox** goes beyond a traditional email client. It utilizes the power of OpenAI to read, summarize, and prioritize your emails via background cron jobs. Additionally, it gives you a dedicated AI Agent that can instantly chat with you to write drafts, read emails, and even schedule events on your Google Calendar natively.

## Key Features

- 🤖 **AI Agentic Chat**: Control your inbox and calendar via an interactive AI assistant.
- 📬 **Smart Background Triage**: New emails are analyzed by AI in the background to separate urgent messages from newsletters.
- ⚡ **Realtime Sync**: Corsair Webhooks push instant updates to the frontend for seamless syncing.
- 💵 **Pro Upgrades**: Razorpay integration to seamlessly upgrade from the Free tier to a premium messaging limit.
- 🎙️ **Speech to Text**: Dictate emails easily with OpenAI Whisper integrations.

## Tech Stack

- **Framework**: [Next.js 15 App Router](https://nextjs.org/)
- **API & Type Safety**: [tRPC](https://trpc.io/)
- **Database & ORM**: [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL
- **Authentication**: [Better Auth](https://better-auth.com/) (Google SSO)
- **Background Jobs & Redis**: [Upstash](https://upstash.com/) (Redis, QStash, Workflow, Ratelimit)
- **Integrations**: [Corsair Framework](https://corsair.dev) (Gmail, Google Calendar)
- **AI**: [OpenAI](https://openai.com/) (GPT-4o, Whisper)
- **Payments**: [Razorpay](https://razorpay.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Shadcn UI

## Documentation

For deep dives into the platform, check out the documentation:

1. [**Architecture**](./docs/ARCHITECTURE.md): Learn how the background jobs, webhooks, and AI agent integrate.
2. [**Local Setup**](./docs/SETUP.md): Get the project running locally step-by-step.
3. [**Core Features**](./docs/FEATURES.md): Detailed explanations of the AI Triage, Agent tool calling, and Payments.
4. **API Reference**: Automatically generated Scalar OpenAPI docs available locally at `/reference`.

## Quick Start

1. Clone the repository and install dependencies using `pnpm install`.
2. Copy `.env.example` to `.env` and fill in your keys (Database, OpenAI, Upstash, Better Auth, Corsair, Razorpay).
3. Push the database schema: `pnpm db:push`.
4. Start the development server: `pnpm dev`.

---

## Hackathon Submission Details

**Builder Mode On | MacBook Giveaway Hackathon**

### Corsair Features Used:

- **Gmail Integration**: Deep integration to fetch, read, parse, and send emails via the `@corsair-dev/gmail` SDK.
- **Google Calendar Integration**: Native integration to fetch and create calendar events via the `@corsair-dev/googlecalendar` SDK.
- **Realtime Webhooks**: Implemented `/api/webhooks/corsair` to listen for `message.created` push notifications from Google Cloud natively, bypassing the need for manual polling.
- **Token Management**: Utilized Corsair's seamless background token refreshing so users never experience expired OAuth sessions.

### Bonus Tasks Attempted & Completed:

1. ✅ **Agent Chat**: Built a dedicated conversational UI where users can chat with an AI that autonomously calls Corsair tools to send emails and create calendar invites.
2. ✅ **Realtime Webhooks**: Fully wired up Corsair Push Notifications to sync the inbox instantly.
3. ✅ **Automatic Email Filtering**: Created a robust background job using Upstash QStash and `gpt-4o-mini` to automatically triage and categorize incoming emails into priority buckets (urgent, fyi, newsletter).
4. ✅ **Keyboard Shortcuts**: Integrated `react-hotkeys-hook` to allow power users to navigate the app and trigger common actions entirely via their keyboard.

---

_Created by Dhirender Choudhary for the Corsair Hackathon._
