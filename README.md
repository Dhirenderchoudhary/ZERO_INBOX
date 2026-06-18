<div align="center">
  <img src="public/zero-inbox-logo-120.png" width="120" height="120" alt="Zero Inbox Logo" />
  <h1>Zero Inbox</h1>
  <p><strong>The Enterprise Grade, AI First Autonomous Communication Command Center.</strong></p>
  
  <p>
    <a href="https://www.zeroinbox.fun/"><strong>🌐 Live Demo (Primary)</strong></a> | 
    <a href="https://zero-inbox-eight.vercel.app/"><strong>⚡ Vercel Deployment</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img-shields.io/badge/tRPC-10.45-blue?style=for-the-badge&logo=trpc" alt="tRPC" />
    <img src="https://img-shields.io/badge/Drizzle-ORM-green?style=for-the-badge&logo=drizzle" alt="Drizzle" />
    <img src="https://img-shields.io/badge/Zod-Guardrails-indigo?style=for-the-badge" alt="Zod" />
    <img src="https://img-shields.io/badge/Upstash-QStash-red?style=for-the-badge&logo=redis" alt="Upstash" />
    <img src="https://img-shields.io/badge/Corsair-SDK-orange?style=for-the-badge" alt="Corsair" />
  </p>
</div>

<br />

## 🚀 The Vision

Traditional email clients are broken. They act as dumb, chronological lists of stress. **Zero Inbox** acts as your personal **Chief of Staff**.

Instead of forcing you to manually read and organize every thread, Zero Inbox uses an AI-first architecture to autonomously triage, categorize, and summarize your inbox, calendar, and workflows in the background.

## ✨ Enterprise-Grade Features

### 🧠 Autonomous AI Triage & Background Workers

Using **Upstash QStash** webhooks and **OpenAI GPT-4o-mini**, every incoming email is autonomously evaluated in the background without blocking the UI. The inbox categorizes emails intelligently:

- 🔴 **Urgent**: Fires that need your immediate attention today.
- 🔵 **Needs Reply**: The sender is waiting for your response.
- 🟣 **FYI**: Read when you have free time.

### 🛡️ Indestructible Zod Guardrails & Security

Zero Inbox features a **production-ready robust backend**. Every single TRPC mutation, webhook payload, database schema, and AI Agent tool call is protected by strict **Zod** validation schemas.
If the AI hallucinates a malformed JSON payload or a bad email address, the system gracefully catches it before hitting the database or external APIs. Includes **Content Security Policies (CSP)** and robust Rate Limiting.

### 🔗 Deep Native Integrations (Corsair SDK)

We deeply integrated natively across multiple platforms using the **Corsair SDK** to create a true Command Center:

- **Google Drive**: Instantly search and access your cloud files via the unified Workspace tab.
- **GitHub**: Deep repository tracking. (🎉 **5 Major PRs merged into the codebase during this hackathon sprint!**)
- **Google Calendar**: AI automatically detects meeting requests and manages your schedule.
- **Slack**: Cross-platform messaging integration.

### ⚡ Blazing Fast Data Fetching & Caching

Zero Inbox employs an aggressive caching strategy using **Redis**. We optimized the initial Gmail payload fetching to only retrieve critical metadata (reducing payload size by 90%), achieving ultra-fast UI rendering while offloading the heavy processing to QStash background queues.

### 👑 Premium Admin Dashboard & RBAC

A robust administrative panel built on **Drizzle ORM** and **Neon Postgres**. Securely hidden behind Role-Based Access Control (RBAC), allowing Admins to:

- Monitor global active users and platform analytics.
- Track OpenAI token usage and system health.
- Manage Global Security Policies and Database variables.

---

## 🛠️ Architecture

Zero Inbox is engineered for extreme scale, security, and speed:

- **Framework**: Next.js 16 (App Router)
- **Database**: Serverless Postgres via Neon
- **ORM**: Drizzle ORM
- **API Layer**: tRPC + Zod Validation Layer
- **Auth**: NextAuth.js (Role-based access)
- **Styling**: Tailwind CSS + shadcn/ui + Framer Motion
- **Background Jobs / Queues**: Upstash QStash & Redis
- **AI Infrastructure**: OpenAI GPT-4o-mini + Custom System Prompts
- **SDK Integrations**: `@corsair-dev/gmail`, `@corsair-dev/googlecalendar`, Google Drive API, GitHub API.

---

## 🚦 Getting Started

1. **Clone & Install**

   ```bash
   git clone https://github.com/yourusername/zero-inbox.git
   cd zero-inbox
   pnpm install
   ```

2. **Environment Variables**
   Duplicate `.env.example` to `.env` and fill in your keys (Neon DB, OpenAI, Auth Secret, Upstash, Google Client IDs).

3. **Database Setup**

   ```bash
   pnpm run db:push
   ```

4. **Run Development Server**
   ```bash
   pnpm dev
   ```

Visit `http://localhost:3000` and experience the future of autonomous communication.

---

<div align="center">
  <strong>Built with extreme focus on speed, enterprise security, and AI guardrails.</strong><br>
  <em>Hackathon Submission</em>
</div>
