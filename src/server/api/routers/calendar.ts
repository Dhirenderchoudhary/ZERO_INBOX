import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { getTenant } from '../../lib/tenant';
import { addDays, startOfWeek, endOfWeek, format } from 'date-fns';

export const calendarRouter = createTRPCRouter({

  getWeekEvents: publicProcedure
    .input(z.object({ weekStart: z.string() }))
    .query(async ({ input }) => {
      const tenant = getTenant();
      const start = new Date(input.weekStart);
      const end = addDays(start, 7);
      const timeMin = start.toISOString();
      const timeMax = end.toISOString();

      const res = await tenant.googlecalendar.api.events.getMany({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return res.items ?? [];
    }),

  refresh: publicProcedure
    .mutation(async () => {
      const tenant = getTenant();
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = addDays(now, 14).toISOString();
      return tenant.googlecalendar.api.events.getMany({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
      });
    }),

  createEvent: publicProcedure
    .input(z.object({
      summary: z.string(),
      description: z.string().optional(),
      startTime: z.string(),
      endTime: z.string(),
      attendees: z.array(z.string()).default([]),
      location: z.string().optional(),
      sendInvites: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      return tenant.googlecalendar.api.events.create({
        calendarId: 'primary',
        sendUpdates: input.sendInvites ? 'all' : 'none',
        event: {
          summary: input.summary,
          description: input.description ?? '',
          location: input.location ?? '',
          start: { dateTime: input.startTime, timeZone: 'Asia/Kolkata' },
          end: { dateTime: input.endTime, timeZone: 'Asia/Kolkata' },
          attendees: input.attendees.map(email => ({ email })),
        }
      });
    }),

  searchEvents: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      const tenant = getTenant();
      return tenant.googlecalendar.db.events.search({
        data: { summary: { contains: input.query } },
        limit: 20,
      });
    }),

  getTodayEvents: publicProcedure.query(async () => {
    const tenant = getTenant();
    const now = new Date();
    const start = new Date(now.setHours(0,0,0,0)).toISOString();
    const end = new Date(now.setHours(23,59,59,999)).toISOString();
    const res = await tenant.googlecalendar.api.events.getMany({
      calendarId: 'primary',
      timeMin: start,
      timeMax: end,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return res.items ?? [];
  }),
});
