/* eslint-disable */
// @ts-nocheck
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { getTenant } from '../../lib/tenant';
import { encodeRawEmail } from '../../lib/emailUtils';
import { dedupeAndSort } from '../../lib/dedup';
import { db } from '../../db';
import { emailTriage } from '../../db/schema';
import { eq, inArray } from 'drizzle-orm';

export const gmailRouter = createTRPCRouter({

  listWithTriage: publicProcedure
    .input(z.object({
      limit: z.number().default(50),
      priority: z.enum(['all','urgent','needs_reply','fyi','newsletter','other','unread']).default('all'),
    }))
    .query(async ({ input }) => {
      const tenant = getTenant();
      const raw = await tenant.gmail.db.messages.list({ limit: input.limit });
      const messages = dedupeAndSort(raw);

      const entityIds = messages.map(m => m.entity_id);
      const triageRows = entityIds.length > 0
        ? await db.select().from(emailTriage).where(inArray(emailTriage.entityId, entityIds))
        : [];
      const triageMap = new Map(triageRows.map(r => [r.entityId, r]));

      const enriched = messages.map(m => ({
        ...m,
        triage: triageMap.get(m.entity_id) ?? null,
        priority: triageMap.get(m.entity_id)?.priority ?? 'other',
        isRead: triageMap.get(m.entity_id)?.isRead ?? false,
        isStarred: triageMap.get(m.entity_id)?.isStarred ?? false,
        isArchived: triageMap.get(m.entity_id)?.isArchived ?? false,
      }));

      if (input.priority === 'unread') return enriched.filter(m => !m.isRead);
      if (input.priority !== 'all') return enriched.filter(m => m.priority === input.priority);
      return enriched.filter(m => !m.isArchived);
    }),

  search: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().default(30) }))
    .query(async ({ input }) => {
      const tenant = getTenant();
      if (!input.query.trim()) return [];
      const results = await tenant.gmail.db.messages.search({
        data: { snippet: { contains: input.query } },
        limit: input.limit,
      });
      return dedupeAndSort(results);
    }),

  getOne: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      const tenant = getTenant();
      try {
        const cached = await tenant.gmail.db.messages.findByEntityId(input.entityId);
        if (cached?.data?.body) return cached;
      } catch {}
      return tenant.gmail.api.messages.get({ id: input.entityId, format: 'full' });
    }),

  refresh: publicProcedure
    .mutation(async () => {
      const tenant = getTenant();
      const result = await tenant.gmail.api.threads.list({ maxResults: 100 });
      return { synced: result.threads?.length ?? 0 };
    }),

  send: publicProcedure
    .input(z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
      cc: z.string().optional(),
      replyToId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      const raw = encodeRawEmail({
        to: input.to,
        subject: input.subject,
        body: input.body,
      } as any);
      return tenant.gmail.api.messages.send({ raw });
    }),

  saveDraft: publicProcedure
    .input(z.object({ to: z.string(), subject: z.string(), body: z.string() }))
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      const raw = encodeRawEmail(input);
      return tenant.gmail.api.drafts.create({ draft: { message: { raw } } });
    }),

  markRead: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      await tenant.gmail.api.messages.modify({
        id: input.entityId,
        removeLabelIds: ['UNREAD'],
      });
      await db.insert(emailTriage)
        .values({ entityId: input.entityId, isRead: true })
        .onConflictDoUpdate({
          target: emailTriage.entityId,
          set: { isRead: true, updatedAt: new Date() },
        });
    }),

  archive: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      await tenant.gmail.api.messages.modify({
        id: input.entityId,
        removeLabelIds: ['INBOX'],
      });
      await db.insert(emailTriage)
        .values({ entityId: input.entityId, isArchived: true })
        .onConflictDoUpdate({
          target: emailTriage.entityId,
          set: { isArchived: true, updatedAt: new Date() },
        });
    }),

  toggleStar: publicProcedure
    .input(z.object({ entityId: z.string(), starred: z.boolean() }))
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      await tenant.gmail.api.messages.modify({
        id: input.entityId,
        ...(input.starred
          ? { addLabelIds: ['STARRED'] }
          : { removeLabelIds: ['STARRED'] }),
      });
      await db.insert(emailTriage)
        .values({ entityId: input.entityId, isStarred: input.starred })
        .onConflictDoUpdate({
          target: emailTriage.entityId,
          set: { isStarred: input.starred, updatedAt: new Date() },
        });
    }),
});
