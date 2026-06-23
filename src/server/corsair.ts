import "dotenv/config";
import { createCorsair, setupCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { github } from "@corsair-dev/github";
import { googledrive } from "@corsair-dev/googledrive";
import postgres from "postgres";

const sql = postgres(
  process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/dummy",
);

export const corsair = createCorsair({
  plugins: [gmail(), googlecalendar(), github(), googledrive()],
  database: sql,
  kek: process.env.CORSAIR_KEK || "dummy",
  multiTenancy: true,
});

const corsairSetupPromise = setupCorsair(corsair, {
  credentials: {
    gmail: {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      topic_id: process.env.GMAIL_TOPIC_ID || "projects/dummy/topics/dummy",
    },
    googlecalendar: {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      client_id: process.env.GITHUB_CLIENT_ID || "dummy",
      client_secret: process.env.GITHUB_CLIENT_SECRET || "dummy",
    },
    googledrive: {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
}).catch((error) => {
  console.error("[corsair:setup] failed", error);
  throw error;
});

const tenantSetupPromises = new Map<string, Promise<void>>();

export async function initCorsair(tenantId?: string) {
  await corsairSetupPromise;
  if (!tenantId) return;

  let tenantSetupPromise = tenantSetupPromises.get(tenantId);
  if (!tenantSetupPromise) {
    tenantSetupPromise = setupCorsair(corsair, { tenantId })
      .then(() => undefined)
      .catch((error) => {
        tenantSetupPromises.delete(tenantId);
        throw error;
      });
    tenantSetupPromises.set(tenantId, tenantSetupPromise);
  }

  await tenantSetupPromise;
}
