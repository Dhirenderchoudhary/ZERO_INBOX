import { createTRPCRouter } from "./trpc";
import { gmailRouter } from "./routers/gmail";
import { calendarRouter } from "./routers/calendar";
import { aiRouter } from "./routers/ai";
import { dashboardRouter } from "./routers/dashboard";

export const appRouter = createTRPCRouter({
  gmail: gmailRouter,
  calendar: calendarRouter,
  ai: aiRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
