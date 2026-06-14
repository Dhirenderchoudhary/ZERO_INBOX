import { createTRPCRouter } from "./trpc";
import { gmailRouter } from "./routers/gmail";
import { calendarRouter } from "./routers/calendar";
import { aiRouter } from "./routers/ai";

export const appRouter = createTRPCRouter({
  gmail: gmailRouter,
  calendar: calendarRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
