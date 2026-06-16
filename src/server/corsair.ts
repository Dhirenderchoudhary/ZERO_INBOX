import "dotenv/config";
import { createCorsair, setupCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { conn } from "./db";

export const corsair = createCorsair({
  plugins: [gmail(), googlecalendar()],
  database: conn,
  kek: process.env.CORSAIR_KEK!,
  multiTenancy: true,
});

// Run setup to sync all new corsair_accounts for the added integrations
setupCorsair(corsair).catch(console.error);
