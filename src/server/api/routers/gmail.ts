import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTenant } from "../../lib/tenant";
import { encodeRawEmail } from "../../lib/emailUtils";
import { dedupeAndSort } from "../../lib/dedup";
import { db } from "../../db";
import { emailTriage, scheduledEmails } from "../../db/schema";
import { inArray } from "drizzle-orm";

function enrichWithTriage(messages: any[], triageRows: any[]) {
  const map = new Map(triageRows.map((r) => [r.entityId, r]));
  return messages.map((m) => ({
    ...m,
    priority: map.get(m.entity_id)?.priority ?? "other",
    isRead: map.get(m.entity_id)?.isRead ?? false,
    isStarred: map.get(m.entity_id)?.isStarred ?? false,
    isArchived: map.get(m.entity_id)?.isArchived ?? false,
    snoozedUntil: map.get(m.entity_id)?.snoozedUntil ?? null,
  }));
}

export const gmailRouter = createTRPCRouter({
  listWithTriage: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        priority: z
          .enum([
            "all",
            "urgent",
            "needs_reply",
            "fyi",
            "newsletter",
            "other",
            "unread",
            "starred",
            "sent",
          ])
          .default("all"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      // Fetch more than requested since we might filter many out
      const raw = await tenant.gmail.db.messages.list({ limit: 200 });
      const messages = dedupeAndSort(raw);
      const entityIds = messages.map((m) => m.entity_id);

      const triageRows =
        entityIds.length > 0
          ? await db
              .select()
              .from(emailTriage)
              .where(inArray(emailTriage.entityId, entityIds))
          : [];

      const enriched = enrichWithTriage(messages, triageRows).filter((m) => {
        if (m.isArchived) return false;
        if (m.snoozedUntil && new Date(m.snoozedUntil) > new Date())
          return false;
        if (input.priority === "all") return true;
        if (input.priority === "unread") return !m.isRead;
        if (input.priority === "starred") return m.isStarred;
        if (input.priority === "sent") {
          const labelIds = m.data?.labelIds ?? m.labelIds ?? [];
          return Array.isArray(labelIds) && labelIds.includes("SENT");
        }
        return m.priority === input.priority;
      });

      return enriched.slice(0, input.limit);
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(30),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      const results = await tenant.gmail.db.messages.search({
        data: { snippet: { contains: input.query } },
        limit: input.limit,
      });
      return dedupeAndSort(results);
    }),

  getOne: protectedProcedure
    .input(z.object({ entityId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      let cached: any = null;

      try {
        cached = await tenant.gmail.db.messages.findByEntityId(input.entityId);
        if (cached?.data?.body || cached?.data?.payload || cached?.payload) {
          return cached;
        }
      } catch {}

      try {
        return await tenant.gmail.api.messages.get({
          id: input.entityId,
          format: "full",
        });
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    }),

  refresh: protectedProcedure.mutation(async ({ ctx }) => {
    const tenant = getTenant(ctx.session.user.id);
    const result = await tenant.gmail.api.threads.list({ maxResults: 500 });
    return { synced: result.threads?.length ?? 0 };
  }),

  send: protectedProcedure
    .input(
      z.object({
        to: z.string().email("Invalid email address"),
        subject: z.string().min(1, "Subject is required"),
        body: z.string().min(1, "Body is required"),
        cc: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      const raw = encodeRawEmail(input);
      return tenant.gmail.api.messages.send({ raw });
    }),

  saveDraft: protectedProcedure
    .input(
      z.object({
        to: z.string(),
        subject: z.string(),
        body: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      const raw = encodeRawEmail(input);
      return tenant.gmail.api.drafts.create({ draft: { message: { raw } } });
    }),

  scheduleSend: protectedProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string().min(1),
        body: z.string().min(1),
        cc: z.string().optional(),
        sendAt: z.string().datetime(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [row] = await db
        .insert(scheduledEmails)
        .values({
          userId: ctx.session.user.id,
          to: input.to,
          subject: input.subject,
          body: input.body,
          cc: input.cc,
          sendAt: new Date(input.sendAt),
        })
        .returning();
      return { id: row!.id, sendAt: input.sendAt };
    }),

  markRead: protectedProcedure
    .input(z.object({ entityId: z.string() }))
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
          {
            entityId: input.entityId,
            error,
          },
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
    .input(z.object({ entityId: z.string() }))
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
    .input(z.object({ entityId: z.string(), starred: z.boolean() }))
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
    .input(
      z.object({
        entityId: z.string(),
        snoozeUntil: z.string().datetime(),
      }),
    )
    .mutation(async ({ input, ctx: _ctx }) => {
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
