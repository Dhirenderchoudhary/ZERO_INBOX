import "dotenv/config";
import { db } from "./src/server/db/index";
import { account } from "./src/server/db/schema";
import { corsair } from "./src/server/corsair";
import { setupCorsair } from "corsair";

async function run() {
  const accounts = await db.select().from(account);
  for (const acc of accounts) {
    if (acc.providerId === "google") {
      console.log("Setting up corsair for tenant", acc.userId);
      await setupCorsair(corsair, { tenantId: acc.userId });

      const tenant = corsair.withTenant(acc.userId);
      if (acc.accessToken) {
        await tenant.gmail.keys.set_access_token(acc.accessToken);
        await tenant.googlecalendar.keys.set_access_token(acc.accessToken);
      }
      if (acc.refreshToken) {
        await tenant.gmail.keys.set_refresh_token(acc.refreshToken);
        await tenant.googlecalendar.keys.set_refresh_token(acc.refreshToken);
      }
      if (acc.accessTokenExpiresAt) {
        const expires = acc.accessTokenExpiresAt.toISOString();
        await tenant.gmail.keys.set_expires_at(expires);
        await tenant.googlecalendar.keys.set_expires_at(expires);
      }
      console.log("Synced account", acc.userId);
    }
  }
}
run();
