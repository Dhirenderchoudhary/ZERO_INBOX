import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import { env } from "@/env";
import * as schema from "@/server/db/schema";
import { initCorsair } from "@/server/corsair";
import { dash } from "@better-auth/infra";
import { triggerInboxSyncWorkflow } from "@/server/lib/qstash";
import { syncGoogleTokensForAccount } from "@/server/lib/google-auth";
import { GOOGLE_OAUTH_SCOPES } from "@/lib/google-scopes";

export const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "fallback_secret_for_dev_mode_which_is_now_32_chars_long!!",
  baseURL: env.NEXT_PUBLIC_APP_URL,
  trustHost: true,
  trustedOrigins: [
    "https://zeroinbox.fun",
    "https://www.zeroinbox.fun",
    "https://corsair.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3000",
  ],
  rateLimit: {
    window: 60,
    max: 1000,
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          void initCorsair(user.id);
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Fire and forget so we don't block login
          void initCorsair(session.userId);
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          if (account.providerId === "google") {
            await syncGoogleTokensForAccount(account as any);

            // Fire and forget a background sync for the new user's inbox
            // Uses Upstash Workflow for durable execution
            void triggerInboxSyncWorkflow(account.userId);
          }
        },
      },
      update: {
        after: async (account) => {
          if (account.providerId === "google") {
            await syncGoogleTokensForAccount(account as any);
          }
        },
      },
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      accessType: "offline",
      prompt: "select_account consent",
      scope: [...GOOGLE_OAUTH_SCOPES],
    },
  },
  plugins: [dash()],
});
