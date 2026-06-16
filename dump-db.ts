import "dotenv/config";
import { db } from "./src/server/db";
import { sql } from "drizzle-orm";

async function run() {
  const result = await db.run(
    sql`SELECT * FROM corsair_entities ORDER BY updated_at DESC LIMIT 5`,
  );
  console.log(result);

  // also try raw sqlite
  const { conn } = await import("./src/server/db");
  const rows = await db.all(
    sql`SELECT * FROM corsair_entities ORDER BY updated_at DESC LIMIT 5`,
  );
  for (const row of rows) {
    const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    console.log(
      `Msg ${row.entity_id}: from=${data.from}, subject=${data.subject}`,
    );
  }
}
run().catch(console.error);
