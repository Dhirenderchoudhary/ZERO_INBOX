import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import { env } from "@/env";
import * as schema from "@/server/db/schema";
import { setupCorsair } from "corsair";
import { corsair } from "@/server/corsair";
import { dash } from "@better-auth/infra";
import { triggerInboxSyncWorkflow } from "@/server/lib/qstash";

async function syncGoogleTokens(account: any) {
  if (account.providerId !== "google") return;

  const tenant = corsair.withTenant(account.userId);
  const tasks = [];

  if (account.accessToken) {
    tasks.push(tenant.gmail.keys.set_access_token(account.accessToken));
    tasks.push(
      tenant.googlecalendar.keys.set_access_token(account.accessToken),
    );
  }

  if (account.refreshToken) {
    tasks.push(tenant.gmail.keys.set_refresh_token(account.refreshToken));
    tasks.push(
      tenant.googlecalendar.keys.set_refresh_token(account.refreshToken),
    );
  }

  if (account.accessTokenExpiresAt) {
    const expires = account.accessTokenExpiresAt.toISOString();
    tasks.push(tenant.gmail.keys.set_expires_at(expires));
    tasks.push(tenant.googlecalendar.keys.set_expires_at(expires));
  }

  // Run all 6 DB updates in parallel to prevent blocking the OAuth login screen
  await Promise.all(tasks);
}

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
          void setupCorsair(corsair, { tenantId: user.id });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Fire and forget so we don't block login
          void setupCorsair(corsair, { tenantId: session.userId });
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          if (account.providerId === "google") {
            void syncGoogleTokens(account);

            // Fire and forget a background sync for the new user's inbox
            // Uses Upstash Workflow for durable execution
            void triggerInboxSyncWorkflow(account.userId);
          }
        },
      },
      update: {
        after: async (account) => {
          if (account.providerId === "google") {
            void syncGoogleTokens(account);
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
      scope: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.labels",
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/calendar",
      ],
    },
  },
  plugins: [dash()],
});
