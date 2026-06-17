# Local Development & Setup

This guide covers everything you need to know to get Zero Inbox running on your local machine, including setting up all necessary environment variables and third-party webhooks.

## 1. Prerequisites

Before starting, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (v9+)
- A running PostgreSQL instance (e.g., local Docker, Supabase, Neon)
- [ngrok](https://ngrok.com/) or localtunnel (for webhook testing)

## 2. Environment Variables

Create a `.env` file in the root of the project by copying the example:

```bash
cp .env.example .env
```

You will need to fill in the following variables:

### Database

- `DATABASE_URL`: Connection string to your Postgres DB (e.g., `postgresql://postgres:password@localhost:5432/zero_inbox`).

### Better Auth & Corsair (OAuth)

- `BETTER_AUTH_SECRET`: A random 32-character secure string. (Run `openssl rand -base64 32` to generate).
- `BETTER_AUTH_URL`: `http://localhost:3000`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Obtain these from the [Google Cloud Console](https://console.cloud.google.com/). Ensure you add the Gmail and Google Calendar scopes.
- `CORSAIR_KEK`: A random 32-character string used to encrypt OAuth refresh tokens in the database at rest.

### Upstash (Redis & QStash)

Create a free account at [Upstash](https://upstash.com).

- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Found in the Redis console.
- `QSTASH_TOKEN`: Found in the QStash console. Used for background jobs and workflows.
- `QSTASH_CURRENT_SIGNING_KEY` & `QSTASH_NEXT_SIGNING_KEY`: Used to verify webhook signatures securely.

### AI (OpenAI)

- `OPENAI_API_KEY`: Your OpenAI API key with access to GPT-4o and Whisper models.

### Payments (Razorpay)

- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Found in the Razorpay dashboard under API Keys.
- `RAZORPAY_WEBHOOK_SECRET`: The secret you define when setting up webhooks.

## 3. Database Initialization

Once your `.env` is configured, push the Drizzle schema to your database:

```bash
pnpm db:push
```

_(Optional)_ You can view your local database UI at any time using:

```bash
pnpm db:studio
```

## 4. Running the Development Server

Start the Next.js application:

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 5. Testing Webhooks Locally

For QStash scheduled emails, Razorpay payment notifications, and Corsair realtime updates to work locally, your `localhost:3000` must be exposed to the internet.

1. Start ngrok in a new terminal window:
   ```bash
   ngrok http 3000
   ```
2. Note the forwarding URL (e.g., `https://1a2b-3c4d.ngrok.io`).
3. Update your `.env` file to set `NEXT_PUBLIC_APP_URL` to your ngrok URL.
4. Add your ngrok URL to the Upstash QStash dashboard, Razorpay Webhook settings, and Corsair developer console.

You are now fully set up for local development!
