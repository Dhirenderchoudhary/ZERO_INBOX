import { serve } from "@upstash/workflow/nextjs";
import { getTenant } from "@/server/lib/tenant";
import { parseRawGoogleMessage } from "@/server/lib/emailUtils";

const handler = process.env.QSTASH_TOKEN
  ? serve<{ userId: string }>(async (context) => {
      const { userId } = context.requestPayload;

      // 1. Fetch email list
      const messages = await context.run("fetch-message-list", async () => {
        const tenant = getTenant(userId);
        const response = await tenant.gmail.api.messages.list({
          maxResults: 50,
        });
        return response.messages ?? [];
      });

      if (messages.length === 0) {
        return;
      }

      // 2. We can batch or process them individually in a step.
      // For durable execution, we'll sync them in a single step with a try-catch for resilience,
      // or iterate through them. Doing it in one step is usually fine for 50 items.
      await context.run("sync-messages-to-db", async () => {
        const tenant = getTenant(userId);
        let synced = 0;
        for (const msg of messages) {
          if (!msg.id) continue;
          try {
            const fullMsg = await tenant.gmail.api.messages.get({
              id: msg.id,
              format: "full",
            });
            const parsed = parseRawGoogleMessage(fullMsg);
            await tenant.gmail.db.messages.upsertByEntityId(msg.id, parsed);
            synced++;
          } catch (err) {
            console.error(
              `[workflow/sync] Failed to sync message ${msg.id}`,
              err,
            );
            // We continue syncing the rest even if one fails
          }
        }
        return synced;
      });
    })
  : { POST: async () => new Response("QStash Token Missing") };

export const { POST } = handler;
