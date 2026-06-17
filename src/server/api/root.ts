import { createTRPCRouter } from "./trpc";
import { gmailRouter } from "./routers/gmail";
import { calendarRouter } from "./routers/calendar";
import { aiRouter } from "./routers/ai";
import { dashboardRouter } from "./routers/dashboard";
import { githubRouter } from "./routers/github";
import { driveRouter } from "./routers/drive";

export const appRouter = createTRPCRouter({
  gmail: gmailRouter,
  calendar: calendarRouter,
  ai: aiRouter,
  dashboard: dashboardRouter,
  github: githubRouter,
  drive: driveRouter,
});

export type AppRouter = typeof appRouter;
