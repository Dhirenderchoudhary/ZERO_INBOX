import "dotenv/config";
import { db } from "./src/server/db/index";
import { corsairAccounts } from "./src/server/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const devAccounts = await db
    .select()
    .from(corsairAccounts)
    .where(eq(corsairAccounts.tenantId, "dev"));

  if (devAccounts.length > 0) {
    console.log("Found dev accounts, migrating to user...");
    // Find the real user account id (assuming there is only one real user in local dev)
    const allAccounts = await db.select().from(corsairAccounts);
    const realUserAcc = allAccounts.find((a) => a.tenantId !== "dev");

    if (realUserAcc) {
      console.log(`Migrating dev accounts to tenant ${realUserAcc.tenantId}`);
      await db
        .update(corsairAccounts)
        .set({ tenantId: realUserAcc.tenantId })
        .where(eq(corsairAccounts.tenantId, "dev"));
      console.log("Migration complete!");
    } else {
      console.log("No real user found.");
    }
  } else {
    console.log("No dev accounts found.");
  }
}
run();
