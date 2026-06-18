import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTenant } from "../../lib/tenant";
import { encodeRawEmail, parseRawGoogleMessage } from "../../lib/emailUtils";
import { dedupeAndSort } from "../../lib/dedup";
import { db } from "../../db";
import { emailTriage, scheduledEmails, cachedEmails } from "../../db/schema";
import { inArray, eq } from "drizzle-orm";
import {
  EntityIdSchema,
  ListWithTriageSchema,
  SearchEmailSchema,
  SendEmailSchema,
  SaveDraftSchema,
  ScheduledEmailSchema,
  SnoozeEmailSchema,
  ToggleStarSchema,
} from "../../lib/schemas";
import { scheduleEmailViaQStash } from "../../lib/qstash";
import {
  invalidateTriageCache,
  invalidateDashboardCache,
} from "../../lib/cache";
import { triggerBackgroundTriage } from "../../lib/qstash";

function enrichWithTriage(
  messages: Record<string, unknown>[],
  triageRows: {
    entityId: string;
    priority: string;
    isRead: boolean;
    isStarred: boolean;
    isArchived: boolean;
    snoozedUntil: Date | null;
  }[],
): (Record<string, unknown> & {
  priority: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  snoozedUntil: Date | null;
})[] {
  const map = new Map(triageRows.map((r) => [r.entityId, r]));
  return messages.map((m) => {
    const entityId = m.entity_id as string;
    return {
      ...m,
      priority: map.get(entityId)?.priority ?? "other",
      isRead: map.get(entityId)?.isRead ?? false,
      isStarred: map.get(entityId)?.isStarred ?? false,
      isArchived: map.get(entityId)?.isArchived ?? false,
      snoozedUntil: map.get(entityId)?.snoozedUntil ?? null,
    };
  });
}

export const gmailRouter = createTRPCRouter({
  listWithTriage: protectedProcedure
    .input(ListWithTriageSchema)
    .query(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      let raw = await tenant.gmail.db.messages.list({ limit: input.limit });

      // Fallback: If DB is empty, fetch a tiny metadata batch synchronously, and offload the rest
      if (raw.length === 0) {
        try {
          // Trigger the background worker to fetch everything else asynchronously safely via QStash helper
          void triggerBackgroundTriage(ctx.session.user.id);

          const response = await tenant.gmail.api.messages.list({
            maxResults: 15,
          });
          const liveMessages = response.messages ?? [];

          // Only fetch minimal metadata headers for extreme speed
          await Promise.allSettled(
            liveMessages.map(async (msg) => {
              if (!msg.id) return;
              const full = await tenant.gmail.api.messages.get({
                id: msg.id,
                format: "metadata",
                metadataHeaders: ["From", "Subject", "Date"],
              });
              await tenant.gmail.db.messages.upsertByEntityId(
                msg.id,
                full as any,
              );
            }),
          );
          // Re-query local DB so shape perfectly matches the rest of the application
          raw = await tenant.gmail.db.messages.list({ limit: 15 });
        } catch (error: any) {
          console.error("Fallback sync failed", error);
          throw new Error("GMAIL_NOT_CONNECTED");
        }
      }

      // Auto-repair: If any message is missing headers (usually happens for live webhooks synced with minimal payloads), fetch them!
      const missingHeaders = raw.filter((m: any) => {
        const hasHeaders = m?.data?.payload?.headers || m?.payload?.headers;
        const hasSubject = m?.data?.subject || m?.subject;
        return !hasHeaders && !hasSubject;
      });

      if (missingHeaders.length > 0) {
        await Promise.allSettled(
          missingHeaders.map(async (msg: any) => {
            if (!msg.entity_id) return;
            try {
              const full = await tenant.gmail.api.messages.get({
                id: msg.entity_id,
                format: "metadata",
                metadataHeaders: ["From", "Subject", "Date"],
              });
              await tenant.gmail.db.messages.upsertByEntityId(
                msg.entity_id,
                full as any,
              );
            } catch (e) {
              console.error("Failed to repair headers for", msg.entity_id);
            }
          }),
        );
        // Re-fetch local DB so shape perfectly matches
        raw = await tenant.gmail.db.messages.list({ limit: input.limit });
      }

      const messages = dedupeAndSort(raw) as Record<string, unknown>[];
      const entityIds = messages.map((m) => m.entity_id as string);

      const triageRows =
        entityIds.length > 0
          ? await db
              .select()
              .from(emailTriage)
              .where(inArray(emailTriage.entityId, entityIds))
          : [];

      let enriched = enrichWithTriage(messages, triageRows).filter((m) => {
        if (m.isArchived) return false;
        if (m.snoozedUntil && new Date(m.snoozedUntil) > new Date())
          return false;
        if (input.priority === "all") return true;
        if (input.priority === "unread") {
          const rawData = m.data as Record<string, unknown> | undefined;
          const labelIds = rawData?.labelIds ?? m.labelIds ?? [];
          return (
            !m.isRead ||
            (Array.isArray(labelIds) && labelIds.includes("UNREAD"))
          );
        }
        if (input.priority === "starred") {
          const rawData = m.data as Record<string, unknown> | undefined;
          const labelIds = rawData?.labelIds ?? m.labelIds ?? [];
          return (
            m.isStarred ||
            (Array.isArray(labelIds) && labelIds.includes("STARRED"))
          );
        }
        if (input.priority === "sent") {
          const rawData = m.data as Record<string, unknown> | undefined;
          const labelIds = rawData?.labelIds ?? m.labelIds ?? [];
          return Array.isArray(labelIds) && labelIds.includes("SENT");
        }
        return m.priority === input.priority;
      });

      // Targeted fallback if looking for starred/sent but none cached locally
      if (
        enriched.length === 0 &&
        (input.priority === "starred" || input.priority === "sent")
      ) {
        try {
          const query = input.priority === "starred" ? "is:starred" : "in:sent";
          const response = await tenant.gmail.api.messages.list({
            maxResults: 15,
            q: query,
          });
          const liveMessages = response.messages ?? [];
          const fetched = await Promise.allSettled(
            liveMessages.map(async (msg) => {
              if (!msg.id) return null;
              const full = await tenant.gmail.api.messages.get({
                id: msg.id,
                format: "metadata",
              });
              void tenant.gmail.db.messages.upsertByEntityId(
                msg.id,
                full as any,
              );
              return full;
            }),
          );
          const newRaw = fetched
            .filter(
              (result) =>
                result.status === "fulfilled" && result.value !== null,
            )
            .map((result: any) => ({
              ...result.value,
              entity_id: result.value.id,
              data: result.value,
            })) as any;

          const newMessages = dedupeAndSort(newRaw) as Record<
            string,
            unknown
          >[];
          enriched = enrichWithTriage(newMessages, []);
        } catch (error) {
          console.error("Targeted sync failed", error);
        }
      }

      const finalEnriched = enriched.slice(0, input.limit).map((msg: any) => {
        const stripped = { ...msg };
        if (stripped.data?.payload) {
          stripped.data = {
            ...stripped.data,
            payload: { ...stripped.data.payload },
          };
          delete stripped.data.payload.parts;
          delete stripped.data.payload.body;
        }
        if (stripped.payload) {
          stripped.payload = { ...stripped.payload };
          delete stripped.payload.parts;
          delete stripped.payload.body;
        }
        return stripped;
      });

      return finalEnriched;
    }),

  search: protectedProcedure
    .input(SearchEmailSchema)
    .query(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      const results = await tenant.gmail.db.messages.search({
        data: { snippet: { contains: input.query } },
        limit: input.limit,
      });
      const sorted = dedupeAndSort(results);
      return sorted.map((msg: any) => {
        const stripped = { ...msg };
        if (stripped.data?.payload) {
          stripped.data = {
            ...stripped.data,
            payload: { ...stripped.data.payload },
          };
          delete stripped.data.payload.parts;
          delete stripped.data.payload.body;
        }
        if (stripped.payload) {
          stripped.payload = { ...stripped.payload };
          delete stripped.payload.parts;
          delete stripped.payload.body;
        }
        return stripped;
      });
    }),

  getOne: protectedProcedure
    .input(EntityIdSchema.transform((v) => ({ entityId: v })))
    .query(async ({ input, ctx }) => {
      const entityId = input.entityId;

      // 1. Check custom Zero Inbox cache
      const customCache = await db.query.cachedEmails.findFirst({
        where: eq(cachedEmails.entityId, entityId),
      });
      if (customCache?.payload) {
        return { data: customCache.payload, payload: customCache.payload };
      }

      const tenant = getTenant(ctx.session.user.id);
      let cached: unknown = null;

      try {
        cached = await tenant.gmail.db.messages.findByEntityId(entityId);
        const c = cached as Record<string, unknown> | null;

        const payload = (c?.data as any)?.payload || c?.payload;
        const hasBodyContent = !!(payload?.parts || payload?.body?.data);

        if ((c?.data || c?.payload) && hasBodyContent) {
          await db
            .insert(cachedEmails)
            .values({
              userId: ctx.session.user.id,
              entityId,
              payload: (c.data ?? c.payload) as Record<string, unknown>,
            })
            .onConflictDoNothing();
          return c;
        }
      } catch (error) {
        console.warn(`Cache miss or db error for email ${entityId}:`, error);
      }

      try {
        const result = await tenant.gmail.api.messages.get({
          id: entityId,
          format: "full",
        });
        if (result) {
          await db
            .insert(cachedEmails)
            .values({
              userId: ctx.session.user.id,
              entityId,
              payload: result as Record<string, unknown>,
            })
            .onConflictDoNothing();
        }
        return { data: result, payload: result };
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    }),

  refresh: protectedProcedure.mutation(async ({ ctx }) => {
    const tenant = getTenant(ctx.session.user.id);
    const response = await tenant.gmail.api.messages.list({ maxResults: 50 });
    let synced = 0;
    for (const msg of response.messages ?? []) {
      if (msg.id) {
        try {
          const fullMsg = await tenant.gmail.api.messages.get({
            id: msg.id,
            format: "full",
          });
          const parsed = parseRawGoogleMessage(fullMsg);
          await tenant.gmail.db.messages.upsertByEntityId(msg.id, parsed);
          synced++;
        } catch {
          console.error("Failed to sync message during refresh", msg.id);
        }
      }
    }
    return { synced };
  }),

  send: protectedProcedure
    .input(SendEmailSchema)
    .mutation(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      const raw = encodeRawEmail(input);
      return tenant.gmail.api.messages.send({ raw });
    }),

  saveDraft: protectedProcedure
    .input(SaveDraftSchema)
    .mutation(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      const raw = encodeRawEmail({
        to: input.to ?? "",
        subject: input.subject ?? "",
        body: input.body ?? "",
      });
      return tenant.gmail.api.drafts.create({ draft: { message: { raw } } });
    }),

  scheduleSend: protectedProcedure
    .input(ScheduledEmailSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const sendAt = new Date(input.sendAt);

      // 1. Insert into DB (source of truth + cron fallback)
      const [row] = await db
        .insert(scheduledEmails)
        .values({
          userId,
          to: input.to,
          subject: input.subject,
          body: input.body,
          cc: input.cc ?? null,
          sendAt,
        })
        .returning();

      // 2. Publish to QStash for exact-time delivery with retries
      const qstashMessageId = await scheduleEmailViaQStash(
        {
          scheduledEmailId: row!.id,
          userId,
          to: input.to,
          subject: input.subject,
          body: input.body,
          cc: input.cc,
        },
        sendAt,
      );

      return {
        id: row!.id,
        sendAt: input.sendAt,
        qstashMessageId,
        deliveryMethod: qstashMessageId ? "qstash" : "cron_fallback",
      };
    }),

  markRead: protectedProcedure
    .input(EntityIdSchema.transform((v) => ({ entityId: v })))
    .mutation(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      let syncedToGmail = true;

      try {
        await tenant.gmail.api.messages.modify({
          id: input.entityId,
          removeLabelIds: ["UNREAD"],
        });
      } catch (error) {
        syncedToGmail = false;
        console.warn(
          "Failed to sync Gmail read state; keeping local read state",
          { entityId: input.entityId, error },
        );
      }

      await db
        .insert(emailTriage)
        .values({ entityId: input.entityId, isRead: true })
        .onConflictDoUpdate({
          target: emailTriage.entityId,
          set: { isRead: true, updatedAt: new Date() },
        });

      return { syncedToGmail };
    }),

  archive: protectedProcedure
    .input(EntityIdSchema.transform((v) => ({ entityId: v })))
    .mutation(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      await tenant.gmail.api.messages.modify({
        id: input.entityId,
        removeLabelIds: ["INBOX"],
      });
      await db
        .insert(emailTriage)
        .values({ entityId: input.entityId, isArchived: true })
        .onConflictDoUpdate({
          target: emailTriage.entityId,
          set: { isArchived: true, updatedAt: new Date() },
        });
    }),

  toggleStar: protectedProcedure
    .input(ToggleStarSchema)
    .mutation(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      await tenant.gmail.api.messages.modify({
        id: input.entityId,
        ...(input.starred
          ? { addLabelIds: ["STARRED"] }
          : { removeLabelIds: ["STARRED"] }),
      });
      await db
        .insert(emailTriage)
        .values({ entityId: input.entityId, isStarred: input.starred })
        .onConflictDoUpdate({
          target: emailTriage.entityId,
          set: { isStarred: input.starred, updatedAt: new Date() },
        });
    }),

  snooze: protectedProcedure
    .input(SnoozeEmailSchema)
    .mutation(async ({ input }) => {
      await db
        .insert(emailTriage)
        .values({
          entityId: input.entityId,
          snoozedUntil: new Date(input.snoozeUntil),
        })
        .onConflictDoUpdate({
          target: emailTriage.entityId,
          set: {
            snoozedUntil: new Date(input.snoozeUntil),
            updatedAt: new Date(),
          },
        });
      return { snoozedUntil: input.snoozeUntil };
    }),
});
