import "dotenv/config";
import { corsair } from "./src/server/corsair";
import { parseRawGoogleMessage } from "./src/server/lib/emailUtils";

async function run() {
  const tenant = corsair.withTenant("CufotXoTFJ2msf4JF6TtmRyjjUY89Vvp"); // Test with this ID
  const response = await tenant.gmail.api.messages.list({ maxResults: 3 });
  for (const msg of response.messages ?? []) {
    if (msg.id) {
      const fullMsg = await tenant.gmail.api.messages.get({
        id: msg.id,
        format: "full",
      });
      const parsed = parseRawGoogleMessage(fullMsg);
      console.log(
        `Msg ${msg.id}: from=${parsed.from}, subject=${parsed.subject}`,
      );
      await tenant.gmail.db.messages.upsertByEntityId(msg.id, parsed);
    }
  }
}
run().catch(console.error);
