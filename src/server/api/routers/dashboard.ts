import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "../../db";
import { emailTriage, agentMessages, usage } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getDashboardCache, setDashboardCache } from "../../lib/cache";
import { getTenant } from "../../lib/tenant";

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // ── Check Redis cache first (3 min TTL) ──────────────────────────────────
    const cached = await getDashboardCache(userId);
    if (cached) {
      return { ...cached, recentActions: [] }; // recentActions fetched separately below
    }

    // 1. Priority threads (urgent & unread)
    const priorityThreadsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailTriage)
      .where(
        and(eq(emailTriage.priority, "urgent"), eq(emailTriage.isRead, false)),
      );
    const priorityThreads = Number(priorityThreadsResult[0]?.count || 0);

    // 2. Reply obligations (needs_reply & unread)
    const replyObligationsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailTriage)
      .where(
        and(
          eq(emailTriage.priority, "needs_reply"),
          eq(emailTriage.isRead, false),
        ),
      );
    const replyObligations = Number(replyObligationsResult[0]?.count || 0);

    // 3. AI Usage (messages used)
    const userUsage = await db.query.usage.findFirst({
      where: eq(usage.userId, userId),
    });
    const aiActions = userUsage?.messagesUsed || 0;

    // 4. Meetings automated
    const eventsCreatedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(agentMessages)
      .where(
        and(
          sql`${agentMessages.actionsJson} LIKE '%create_event%'`,
          eq(agentMessages.userId, userId),
        ),
      );
    const meetingsAutomated = Number(eventsCreatedResult[0]?.count || 0);

    // 5. Triage Percentages
    const triageStats = await db
      .select({
        priority: emailTriage.priority,
        count: sql<number>`count(*)`,
      })
      .from(emailTriage)
      .groupBy(emailTriage.priority);

    let urgent = 0;
    let needs_reply = 0;
    let fyi = 0;
    let noise = 0;
    let totalTriage = 0;

    for (const stat of triageStats) {
      const c = Number(stat.count);
      totalTriage += c;
      if (stat.priority === "urgent") urgent = c;
      else if (stat.priority === "needs_reply") needs_reply = c;
      else if (stat.priority === "fyi") fyi = c;
      else noise += c;
    }

    const inboxIntelligence = {
      urgent: totalTriage ? Math.round((urgent / totalTriage) * 100) : 0,
      needs_reply: totalTriage
        ? Math.round((needs_reply / totalTriage) * 100)
        : 0,
      fyi: totalTriage ? Math.round((fyi / totalTriage) * 100) : 0,
      noise: totalTriage ? Math.round((noise / totalTriage) * 100) : 0,
    };

    // 6. Recent Actions (not cached — always fresh)
    const recentActions = await db
      .select({
        id: agentMessages.id,
        content: agentMessages.content,
        createdAt: agentMessages.createdAt,
      })
      .from(agentMessages)
      .where(
        and(
          eq(agentMessages.role, "assistant"),
          eq(agentMessages.userId, userId),
        ),
      )
      .orderBy(sql`${agentMessages.createdAt} DESC`)
      .limit(5);

    if (recentActions.length === 0) {
      // Fallback to recent real emails
      const tenant = getTenant(userId);
      const recentEmails = await tenant.gmail.db.messages.list({ limit: 5 });
      if (recentEmails && recentEmails.length > 0) {
        recentActions.push(
          ...recentEmails.map((e: any) => ({
            id: e.id || e.entity_id,
            content: `Received: ${e.data?.subject || e.subject || "(No subject)"}`,
            createdAt: new Date(e.data?.date || e.date || new Date()),
          })),
        );
      }
    }

    const statsToCache = {
      priorityThreads,
      replyObligations,
      aiActions,
      meetingsAutomated,
      inboxIntelligence,
    };

    // Cache stats (fire and forget — don't block response)
    void setDashboardCache(userId, statsToCache);

    return {
      ...statsToCache,
      recentActions,
    };
  }),
});
