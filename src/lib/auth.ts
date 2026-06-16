import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import { env } from "@/env";
import * as schema from "@/server/db/schema";
import { setupCorsair } from "corsair";
import { corsair } from "@/server/corsair";
import { parseRawGoogleMessage } from "@/server/lib/emailUtils";
import { dash } from "@better-auth/infra";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "fallback_secret_for_dev_mode",
  baseURL: env.NEXT_PUBLIC_APP_URL,

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
          await setupCorsair(corsair, { tenantId: user.id });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await setupCorsair(corsair, { tenantId: session.userId });
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          if (account.providerId === "google") {
            const tenant = corsair.withTenant(account.userId);
            if (account.accessToken) {
              await tenant.gmail.keys.set_access_token(account.accessToken);
              await tenant.googlecalendar.keys.set_access_token(
                account.accessToken,
              );
            }
            if (account.refreshToken) {
              await tenant.gmail.keys.set_refresh_token(account.refreshToken);
              await tenant.googlecalendar.keys.set_refresh_token(
                account.refreshToken,
              );
            }
            if (account.accessTokenExpiresAt) {
              const expires = account.accessTokenExpiresAt.toISOString();
              await tenant.gmail.keys.set_expires_at(expires);
              await tenant.googlecalendar.keys.set_expires_at(expires);
            }

            // Fire and forget a background sync for the new user's inbox
            (async () => {
              try {
                const response = await tenant.gmail.api.messages.list({
                  maxResults: 50,
                });
                for (const msg of response.messages ?? []) {
                  if (msg.id) {
                    try {
                      const fullMsg = await tenant.gmail.api.messages.get({
                        id: msg.id,
                        format: "full",
                      });
                      const parsed = parseRawGoogleMessage(fullMsg);
                      await tenant.gmail.db.messages.upsertByEntityId(
                        msg.id,
                        parsed,
                      );
                    } catch (err) {
                      console.error(
                        `Failed to fetch/upsert message ${msg.id}`,
                        err,
                      );
                    }
                  }
                }
              } catch (e) {
                console.error("Auto-sync failed", e);
              }
            })();
          }
        },
      },
      update: {
        after: async (account) => {
          if (account.providerId === "google") {
            const tenant = corsair.withTenant(account.userId);
            if (account.accessToken) {
              await tenant.gmail.keys.set_access_token(account.accessToken);
              await tenant.googlecalendar.keys.set_access_token(
                account.accessToken,
              );
            }
            if (account.refreshToken) {
              await tenant.gmail.keys.set_refresh_token(account.refreshToken);
              await tenant.googlecalendar.keys.set_refresh_token(
                account.refreshToken,
              );
            }
            if (account.accessTokenExpiresAt) {
              const expires = account.accessTokenExpiresAt.toISOString();
              await tenant.gmail.keys.set_expires_at(expires);
              await tenant.googlecalendar.keys.set_expires_at(expires);
            }
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
