import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTenant } from "../../lib/tenant";
import { addDays } from "date-fns";
import {
  CalendarEventSchema,
  WeekEventsSchema,
  SearchEventsSchema,
} from "../../lib/schemas";
import {
  getCalendarEventsCache,
  setCalendarEventsCache,
  invalidateCalendarCache,
  invalidateDashboardCache,
} from "../../lib/cache";

export const calendarRouter = createTRPCRouter({
  getWeekEvents: protectedProcedure
    .input(WeekEventsSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // ── Check Redis cache (10 min TTL) ────────────────────────────────────
      const cached = await getCalendarEventsCache(userId, input.weekStart);
      if (cached) return cached;

      const tenant = getTenant(userId);
      const start = new Date(input.weekStart);
      const end = addDays(start, 7);

      const res = await tenant.googlecalendar.api.events.getMany({
        calendarId: "primary",
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });
      const items = res.items ?? [];
      void setCalendarEventsCache(userId, input.weekStart, items);
      return items;
    }),

  refresh: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const tenant = getTenant(userId);
    const now = new Date();
    // Invalidate all calendar caches on explicit refresh
    void invalidateCalendarCache(userId);
    return tenant.googlecalendar.api.events.getMany({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: addDays(now, 14).toISOString(),
      singleEvents: true,
    });
  }),

  createEvent: protectedProcedure
    .input(CalendarEventSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const tenant = getTenant(userId);
      const result = await tenant.googlecalendar.api.events.create({
        calendarId: "primary",
        sendUpdates: input.sendInvites ? "all" : "none",
        event: {
          summary: input.summary,
          description: input.description ?? "",
          location: input.location ?? "",
          start: { dateTime: input.startTime, timeZone: "Asia/Kolkata" },
          end: { dateTime: input.endTime, timeZone: "Asia/Kolkata" },
          attendees: input.attendees.map((email) => ({ email })),
        },
      });
      // Invalidate caches after new event (fire and forget)
      void invalidateCalendarCache(userId);
      void invalidateDashboardCache(userId);
      return result;
    }),

  searchEvents: protectedProcedure
    .input(SearchEventsSchema)
    .query(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      return tenant.googlecalendar.db.events.search({
        data: { summary: { contains: input.query } },
        limit: 20,
      });
    }),

  getTodayEvents: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const tenant = getTenant(userId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Use today's date as cache key
    const todayKey = startOfDay.toISOString();
    const cached = await getCalendarEventsCache(userId, todayKey);
    if (cached) return cached;

    const res = await tenant.googlecalendar.api.events.getMany({
      calendarId: "primary",
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });
    const items = res.items ?? [];
    void setCalendarEventsCache(userId, todayKey, items);
    return items;
  }),
});
