import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTenant } from "../../lib/tenant";
import { encodeRawEmail, parseRawGoogleMessage } from "../../lib/emailUtils";
import { dedupeAndSort } from "../../lib/dedup";
import { db } from "../../db";
import {
  emailTriage,
  scheduledEmails,
  cachedEmails,
  corsairAccounts,
  corsairIntegrations,
  corsairEntities,
} from "../../db/schema";
import { and, desc, inArray, eq, sql } from "drizzle-orm";
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
import { triggerBackgroundTriage } from "../../lib/qstash";
import { invalidateTriageCache } from "../../lib/cache";
import {
  ensureGmailRefreshToken,
  hasGmailRefreshToken,
  isCorsairAuthMissingError,
} from "../../lib/google-auth";

const GMAIL_CACHE_TTL_MS = 3 * 60 * 1000;
const GMAIL_FIRST_PAGE_SIZE = 30;

type CachedCorsairMessage = {
  entity_id: string;
  updated_at: Date;
  data: Record<string, unknown>;
};

function getHeaderValue(headers: unknown, name: string): string | undefined {
  if (!Array.isArray(headers)) return undefined;
  const header = headers.find(
    (h) =>
      typeof h === "object" &&
      h !== null &&
      "name" in h &&
      String(h.name).toLowerCase() === name.toLowerCase(),
  ) as { value?: unknown } | undefined;
  return typeof header?.value === "string" ? header.value : undefined;
}

async function getGmailAccountId(tenantId: string): Promise<string | null> {
  const [account] = await db
    .select({ id: corsairAccounts.id })
    .from(corsairAccounts)
    .innerJoin(
      corsairIntegrations,
      eq(corsairAccounts.integrationId, corsairIntegrations.id),
    )
    .where(
      and(
        eq(corsairAccounts.tenantId, tenantId),
        eq(corsairIntegrations.name, "gmail"),
      ),
    )
    .limit(1);

  return account?.id ?? null;
}

async function listCachedInboxMessages(
  tenantId: string,
  limit: number,
): Promise<CachedCorsairMessage[]> {
  const accountId = await getGmailAccountId(tenantId);
  if (!accountId) return [];

  const rows = await db
    .select()
    .from(corsairEntities)
    .where(
      and(
        eq(corsairEntities.accountId, accountId),
        sql`${corsairEntities.data}->'labelIds' @> '["INBOX"]'::jsonb`,
      ),
    )
    .orderBy(
      desc(
        sql`coalesce((${corsairEntities.data}->>'internalDate')::bigint, extract(epoch from ${corsairEntities.updatedAt})::bigint * 1000)`,
      ),
    )
    .limit(limit);

  const newest = rows.reduce(
    (max, row) => Math.max(max, new Date(row.updatedAt).getTime()),
    0,
  );
  if (newest > 0 && Date.now() - newest > GMAIL_CACHE_TTL_MS) {
    void triggerBackgroundTriage(tenantId);
  }

  return rows.map((row) => {
    const data = row.data;
    const payload = data.payload as { headers?: unknown } | undefined;
    const subject = data.subject ?? getHeaderValue(payload?.headers, "subject");
    const from = data.from ?? getHeaderValue(payload?.headers, "from");
    const date = data.date ?? getHeaderValue(payload?.headers, "date");

    return {
      entity_id: row.entityId,
      updated_at: row.updatedAt,
      data: {
        ...data,
        ...(subject ? { subject } : {}),
        ...(from ? { from } : {}),
        ...(date ? { date } : {}),
      },
    };
  });
}

async function fetchMetadataBatch(
  tenant: ReturnType<typeof getTenant>,
  limit: number,
  q?: string,
) {
  const response = await tenant.gmail.api.messages.list({
    maxResults: Math.min(limit, 50),
    ...(q ? { q } : { labelIds: ["INBOX"] }),
  });
  const liveMessages = response.messages ?? [];

  const fetched = await Promise.allSettled(
    liveMessages.map(async (msg) => {
      if (!msg.id) return null;
      const metadata = await tenant.gmail.api.messages.get({
        id: msg.id,
        format: "metadata",
      });
      const parsed = parseRawGoogleMessage(metadata);
      await tenant.gmail.db.messages.upsertByEntityId(msg.id, parsed);
      return {
        entity_id: msg.id,
        updated_at: new Date(),
        data: parsed as Record<string, unknown>,
      };
    }),
  );

  return fetched.flatMap((result) => {
    if (result.status !== "fulfilled" || !result.value) return [];
    return [result.value];
  });
}

async function repairMissingMetadata(
  tenant: ReturnType<typeof getTenant>,
  messages: CachedCorsairMessage[],
  maxToRepair = 15,
) {
  const repaired = new Map<string, CachedCorsairMessage>();

  await Promise.allSettled(
    messages.slice(0, maxToRepair).map(async (msg) => {
      const metadata = await tenant.gmail.api.messages.get({
        id: msg.entity_id,
        format: "metadata",
      });
      const parsed = parseRawGoogleMessage(metadata);
      await tenant.gmail.db.messages.upsertByEntityId(msg.entity_id, parsed);
      repaired.set(msg.entity_id, {
        entity_id: msg.entity_id,
        updated_at: new Date(),
        data: parsed as Record<string, unknown>,
      });
    }),
  );

  return messages.map((msg) => repaired.get(msg.entity_id) ?? msg);
}

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
  connectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const connected = await hasGmailRefreshToken(ctx.session.user.id);
    return { connected };
  }),

  listWithTriage: protectedProcedure
    .input(ListWithTriageSchema)
    .query(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      let raw =
        input.priority === "sent" || input.priority === "starred"
          ? await tenant.gmail.db.messages.list({ limit: input.limit })
          : await listCachedInboxMessages(ctx.session.user.id, input.limit);

      if (raw.length === 0) {
        raw = await tenant.gmail.db.messages.list({ limit: input.limit });
      }

      if (
        input.priority === "all" &&
        raw.length < Math.min(input.limit, GMAIL_FIRST_PAGE_SIZE)
      ) {
        void triggerBackgroundTriage(ctx.session.user.id);
      }

      // Keep list rendering cache-first. Missing metadata is repaired in the background.
      const missingHeaders = raw.filter((m: any) => {
        const hasHeaders = m?.data?.payload?.headers || m?.payload?.headers;
        const hasSubject = m?.data?.subject || m?.subject;
        return !hasHeaders && !hasSubject;
      });

      if (missingHeaders.length > 0) {
        void repairMissingMetadata(
          tenant,
          raw as CachedCorsairMessage[],
          15,
        ).catch((error) =>
          console.warn("Background metadata repair failed", error),
        );
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
          const canFetchLiveGmail = await hasGmailRefreshToken(
            ctx.session.user.id,
          );
          if (canFetchLiveGmail) {
            const query =
              input.priority === "starred" ? "is:starred" : "in:sent";
            const fetched = await fetchMetadataBatch(tenant, 30, query);
            const newMessages = dedupeAndSort(fetched) as Record<
              string,
              unknown
            >[];
            enriched = enrichWithTriage(newMessages, []);
          }
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
    const canFetchLiveGmail = await ensureGmailRefreshToken(
      ctx.session.user.id,
    );

    if (!canFetchLiveGmail) {
      return { synced: 0, needsReconnect: true };
    }

    try {
      const messages = await fetchMetadataBatch(tenant, 50);
      void triggerBackgroundTriage(ctx.session.user.id);
      return { synced: messages.length, needsReconnect: false };
    } catch (error) {
      if (isCorsairAuthMissingError(error)) {
        return { synced: 0, needsReconnect: true };
      }
      throw error;
    }
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
      void invalidateTriageCache(ctx.session.user.id);

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
      void invalidateTriageCache(ctx.session.user.id);
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
      void invalidateTriageCache(ctx.session.user.id);
    }),

  snooze: protectedProcedure
    .input(SnoozeEmailSchema)
    .mutation(async ({ input, ctx }) => {
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
      void invalidateTriageCache(ctx.session.user.id);
      return { snoozedUntil: input.snoozeUntil };
    }),
});
