# Contributing to Zero Inbox

First off, thank you for considering contributing to Zero Inbox! It's people like you that make Zero Inbox such a great tool.

## 1. Local Development Setup

To get the application running locally, follow these steps:

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (v9+)
- Docker (optional, if you want to run a local Postgres instance instead of Neon)

### Installation

1. Fork the repository and clone it to your local machine.
2. Run `pnpm install` to install all dependencies.

### Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. You will need to provision development keys for the following services:
   - **Better Auth:** A random 32-character string for `BETTER_AUTH_SECRET` and Google OAuth credentials.
   - **Neon / PostgreSQL:** A connection string for your database.
   - **Upstash:** Redis URL and Token for rate limiting; QStash tokens for background jobs.
   - **Razorpay:** Test mode keys for billing.
   - **OpenAI:** API key for the agent.

### Database Setup

1. Once your `.env` is populated, push the Drizzle schema to your database:
   ```bash
   pnpm db:push
   ```

### Running the App

1. Start the Next.js development server:
   ```bash
   pnpm dev
   ```
2. Open `http://localhost:3000` in your browser.

## 2. Development Workflow

- **Branching:** Please create a new branch from `main` for your work (e.g., `feat/new-ui-component` or `fix/auth-bug`).
- **Formatting:** We use Prettier to enforce a consistent code style. Run `pnpm format:write` before committing.
- **Linting & Typechecking:** Run `pnpm check` to ensure there are no TypeScript or ESLint errors.
- **Commits:** We follow Conventional Commits (e.g., `feat: add new email parser`, `fix: resolve hydration error`).

## 3. Pull Requests

When you are ready to submit your code:

1. Ensure your code passes all CI checks locally (`pnpm test` and `pnpm check`).
2. Open a Pull Request against the `main` branch.
3. Provide a clear description of the problem you solved or the feature you added. Including screenshots or videos for UI changes is highly encouraged.

We will review your PR as quickly as possible!
