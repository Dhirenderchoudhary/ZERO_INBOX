<div align="center">
  <img src="public/corsair-logo.png" width="80" alt="Corsair Logo" />
  <img src="public/chaicode-logo.png" width="80" alt="ChaiCode Logo" />
  
  <h1 style="margin-top: 20px;">ZERO INBOX</h1>
  <p><b>Command every workflow from one inbox.</b></p>
  
  <p>
    Built for the <b>Corsair x ChaiCode Hackathon</b> 🚀
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#how-it-works">How it Works</a>
  </p>
</div>

---

## 🌟 The Vision

**ZERO INBOX** is a dynamic, AI-powered command center that replaces your chaotic inbox with a highly organized, actionable workspace.

Instead of drowning in newsletters and low-priority updates, Zero Inbox uses **OpenAI** and the **Corsair SDK** to actively triage your emails, draft replies, schedule calendar events, and manage your time—completely on autopilot.

## ✨ Features

- 🧠 **Live AI Triage**: Automatically categorizes incoming emails into _Urgent, Needs Reply, FYI, Newsletter,_ or _Standard_.
- 🤖 **FlowMail Agent**: A conversational AI agent with native tool-calling capabilities. Ask it to "Schedule a meeting with Garry for Thursday" or "Email the team", and it executes the actions directly via the Corsair API.
- ⚡ **Dynamic Dashboard**: Real-time KPI tracking for priority threads, automated meetings, and AI time saved.
- 🎨 **Premium UI/UX**: Sleek, glassmorphic design built with Tailwind CSS, Framer Motion, and Next-Themes (Dark/Light mode support).
- 🛡️ **Secure by Design**: OAuth-based least privilege scopes. You never hand over your raw passwords.

## 🛠️ Tech Stack

This project was bootstrapped with the `create-t3-app` and heavily leverages the Corsair unified API.

- **Framework**: [Next.js 14](https://nextjs.org) (App Router)
- **API/Types**: [tRPC](https://trpc.io/) & [Zod](https://zod.dev/)
- **Database**: [Turso](https://turso.tech/) (SQLite) & [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better-Auth](https://better-auth.com/) & [Corsair SDK](https://corsair.dev)
- **Integrations**: [Corsair SDK](https://corsair.dev/) (Gmail & Google Calendar)
- **AI/LLMs**: [OpenAI](https://openai.com/) (GPT-4o & GPT-4o-mini)
- **Rate Limiting**: [Upstash Redis](https://upstash.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) & [shadcn/ui](https://ui.shadcn.com/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🔗 Important Links

- 🚀 **Live Demo**: [https://zero-inbox-dhirender.vercel.app](https://zero-inbox-dhirender.vercel.app) _(Replace with actual Vercel URL)_
- 💻 **GitHub Repository**: [https://github.com/Dhirenderchoudhary/ZERO_INBOX](https://github.com/Dhirenderchoudhary/ZERO_INBOX)
- ⚙️ **Corsair API**: [https://corsair.dev](https://corsair.dev)
- ☕ **ChaiCode**: [https://chaicode.com](https://chaicode.com)

## 🚀 Getting Started

To run this project locally, follow these steps:

### 1. Clone the repository

```bash
git clone https://github.com/Dhirenderchoudhary/ZERO_INBOX.git
cd ZERO_INBOX
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory and add the following keys:

```env
# Database
DATABASE_URL="libsql://your-turso-db-url"
DATABASE_AUTH_TOKEN="your-turso-auth-token"

# Better Auth
BETTER_AUTH_SECRET="super-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Corsair SDK
CORSAIR_KEK="your-corsair-key-encryption-key"
TENANT_ID="your-corsair-tenant-id"

# AI & Rate Limiting
OPENAI_API_KEY="sk-..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 4. Push Database Schema

```bash
pnpm db:push
```

### 5. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧠 How it Works

1. **Authentication**: Users log in and connect their Google Account via the Corsair Connect UI.
2. **Syncing**: Corsair seamlessly syncs Gmail and Google Calendar data into a local SQLite database cache.
3. **Triaging**: Our tRPC API triggers an OpenAI `gpt-4o-mini` prompt to evaluate and tag all unsorted emails.
4. **Execution**: The user interacts with the FlowMail Agent, which utilizes OpenAI Function Calling to trigger `send_email` and `create_event` functions. These functions natively execute Corsair API methods to dispatch real emails and calendar invites.

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/Dhirenderchoudhary">Dhirender Choudhary</a></p>
  <p><b>Builder Mode On</b> | MacBook Giveaway Hackathon</p>
</div>
