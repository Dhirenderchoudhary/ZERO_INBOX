import { corsair } from "./src/server/corsair";
import { parseRawGoogleMessage } from "./src/server/lib/emailUtils";

async function run() {
  const tenant = corsair.withTenant("CufotXoTFJ2msf4JF6TtmRyjjUY89Vvp"); // The tenant ID from the background task
  const response = await tenant.gmail.api.messages.list({ maxResults: 1 });
  const msgId = response.messages[0].id;
  const fullMsg = await tenant.gmail.api.messages.get({
    id: msgId,
    format: "full",
  });
  console.log("Headers:", fullMsg.payload?.headers?.slice(0, 3));
  const parsed = parseRawGoogleMessage(fullMsg);
  console.log("Parsed from:", parsed.from);
  console.log("Parsed subject:", parsed.subject);
}
run();
