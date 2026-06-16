import { db } from "./src/server/db/index";
import { corsairEntities } from "./src/server/db/schema";
import { count, eq } from "drizzle-orm";

async function run() {
  const counts = await db
    .select({
      accountId: corsairEntities.accountId,
      count: count(),
    })
    .from(corsairEntities)
    .groupBy(corsairEntities.accountId);
  console.log("Entities per account:", counts);
}
run();
