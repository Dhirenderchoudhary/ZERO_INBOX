import "dotenv/config";
import { createCorsair, setupCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import postgres from "postgres";

const sql = postgres(
  process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/dummy",
);

export const corsair = createCorsair({
  plugins: [gmail(), googlecalendar()],
  database: sql,
  kek: process.env.CORSAIR_KEK || "dummy",
  multiTenancy: true,
});

// Run setup to sync all new corsair_accounts for the added integrations
setupCorsair(corsair).catch(console.error);
