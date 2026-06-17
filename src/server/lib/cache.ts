/**
 * Upstash Redis cache layer for Zero Inbox.
 *
 * Provides typed helpers for caching hot-path data:
 * - Email triage rows (per-user, 2 min TTL)
 * - AI summaries (per entity, 1 hr TTL)
 * - Dashboard stats (per-user, 3 min TTL)
 * - Calendar events (per-user, 10 min TTL)
 *
 * All functions gracefully degrade (return null) if Redis is not configured.
 */

import { Redis } from "@upstash/redis";
import type { EmailPriority } from "./schemas";

// ─── Redis client (singleton) ─────────────────────────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    _redis = Redis.fromEnv();
  }
  return _redis;
}

// ─── TTL constants (seconds) ──────────────────────────────────────────────────

const TTL = {
  TRIAGE: 120, // 2 minutes — refreshes often
  AI_SUMMARY: 3600, // 1 hour — summaries don't change
  DASHBOARD: 180, // 3 minutes — stats can be slightly stale
  CALENDAR: 600, // 10 minutes
  EMAIL_BODY: 3600, // 1 hour — raw body content
} as const;

// ─── Key builders ─────────────────────────────────────────────────────────────

const keys = {
  triage: (userId: string) => `zi:triage:${userId}`,
  triageEntity: (entityId: string) => `zi:triage_entity:${entityId}`,
  aiSummary: (entityId: string) => `zi:summary:${entityId}`,
  aiDraft: (entityId: string) => `zi:draft:${entityId}`,
  dashboard: (userId: string) => `zi:dashboard:${userId}`,
  calendarEvents: (userId: string, weekStart: string) =>
    `zi:calendar:${userId}:${weekStart}`,
  emailBody: (entityId: string) => `zi:email_body:${entityId}`,
};

// ─── Triage cache ──────────────────────────────────────────────────────────────

export interface TriageCacheEntry {
  entityId: string;
  priority: EmailPriority;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  snoozedUntil: string | null;
}

/** Cache the full triage list for a user. */
export async function setTriageCache(
  userId: string,
  rows: TriageCacheEntry[],
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(keys.triage(userId), JSON.stringify(rows), {
      ex: TTL.TRIAGE,
    });
  } catch (err) {
    console.warn("[cache] setTriageCache failed:", err);
  }
}

/** Get cached triage rows for a user. Returns null on miss or error. */
export async function getTriageCache(
  userId: string,
): Promise<TriageCacheEntry[] | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(keys.triage(userId));
    if (!raw) return null;
    return JSON.parse(
      typeof raw === "string" ? raw : JSON.stringify(raw),
    ) as TriageCacheEntry[];
  } catch (err) {
    console.warn("[cache] getTriageCache failed:", err);
    return null;
  }
}

/** Invalidate the triage cache for a user (call after mutations). */
export async function invalidateTriageCache(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(keys.triage(userId));
  } catch (err) {
    console.warn("[cache] invalidateTriageCache failed:", err);
  }
}

/** Cache a single triage entity result (used after triageOne). */
export async function setEntityTriageCache(
  entityId: string,
  priority: EmailPriority,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(keys.triageEntity(entityId), priority, {
      ex: TTL.TRIAGE,
    });
  } catch (err) {
    console.warn("[cache] setEntityTriageCache failed:", err);
  }
}

// ─── AI Summary cache ──────────────────────────────────────────────────────────

/** Cache an AI-generated summary for an email entity. */
export async function setAiSummaryCache(
  entityId: string,
  summary: string,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(keys.aiSummary(entityId), summary, { ex: TTL.AI_SUMMARY });
  } catch (err) {
    console.warn("[cache] setAiSummaryCache failed:", err);
  }
}

/** Get a cached AI summary. Returns null on miss. */
export async function getAiSummaryCache(
  entityId: string,
): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get<string>(keys.aiSummary(entityId));
  } catch (err) {
    console.warn("[cache] getAiSummaryCache failed:", err);
    return null;
  }
}

/** Cache an AI draft reply for an email entity. */
export async function setAiDraftCache(
  entityId: string,
  draft: string,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(keys.aiDraft(entityId), draft, { ex: TTL.AI_SUMMARY });
  } catch (err) {
    console.warn("[cache] setAiDraftCache failed:", err);
  }
}

/** Get a cached AI draft reply. */
export async function getAiDraftCache(
  entityId: string,
): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get<string>(keys.aiDraft(entityId));
  } catch (err) {
    console.warn("[cache] getAiDraftCache failed:", err);
    return null;
  }
}

// ─── Dashboard stats cache ─────────────────────────────────────────────────────

export interface DashboardStatsCache {
  priorityThreads: number;
  replyObligations: number;
  aiActions: number;
  meetingsAutomated: number;
  inboxIntelligence: {
    urgent: number;
    needs_reply: number;
    fyi: number;
    noise: number;
  };
}

/** Cache dashboard stats for a user. */
export async function setDashboardCache(
  userId: string,
  stats: DashboardStatsCache,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(keys.dashboard(userId), JSON.stringify(stats), {
      ex: TTL.DASHBOARD,
    });
  } catch (err) {
    console.warn("[cache] setDashboardCache failed:", err);
  }
}

/** Get cached dashboard stats. Returns null on miss. */
export async function getDashboardCache(
  userId: string,
): Promise<DashboardStatsCache | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(keys.dashboard(userId));
    if (!raw) return null;
    return JSON.parse(
      typeof raw === "string" ? raw : JSON.stringify(raw),
    ) as DashboardStatsCache;
  } catch (err) {
    console.warn("[cache] getDashboardCache failed:", err);
    return null;
  }
}

/** Invalidate dashboard cache (call after any action that changes counts). */
export async function invalidateDashboardCache(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(keys.dashboard(userId));
  } catch (err) {
    console.warn("[cache] invalidateDashboardCache failed:", err);
  }
}

// ─── Calendar events cache ─────────────────────────────────────────────────────

/** Cache calendar events for a user+week. */
export async function setCalendarEventsCache(
  userId: string,
  weekStart: string,
  events: unknown[],
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(
      keys.calendarEvents(userId, weekStart),
      JSON.stringify(events),
      { ex: TTL.CALENDAR },
    );
  } catch (err) {
    console.warn("[cache] setCalendarEventsCache failed:", err);
  }
}

/** Get cached calendar events. Returns null on miss. */
export async function getCalendarEventsCache(
  userId: string,
  weekStart: string,
): Promise<unknown[] | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(keys.calendarEvents(userId, weekStart));
    if (!raw) return null;
    return JSON.parse(
      typeof raw === "string" ? raw : JSON.stringify(raw),
    ) as unknown[];
  } catch (err) {
    console.warn("[cache] getCalendarEventsCache failed:", err);
    return null;
  }
}

/** Invalidate all calendar caches for a user (call after createEvent). */
export async function invalidateCalendarCache(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    // Scan for keys matching this user's calendar pattern and delete them
    const pattern = `zi:calendar:${userId}:*`;
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = Number(result[0]);
      const matchedKeys = result[1];
      if (matchedKeys.length > 0) {
        await redis.del(...matchedKeys);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.warn("[cache] invalidateCalendarCache failed:", err);
  }
}
