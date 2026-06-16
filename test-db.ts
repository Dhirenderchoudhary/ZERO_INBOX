import { db } from "./src/server/db/index";
import { user } from "./src/server/db/schema";
async function run() {
  const users = await db.select().from(user);
  console.log(
    "Users:",
    users.map((u) => u.id),
  );
}
run();
