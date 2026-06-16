import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { OpenApiMeta } from "trpc-to-openapi";

import { db } from "@/server/db";
import { auth } from "@/lib/auth";

/**
 * 1. CONTEXT
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers });
  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 */
const t = initTRPC
  .context<typeof createTRPCContext>()
  .meta<OpenApiMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 */
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path, type, ctx }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  const duration = end - start;
  const userId = ctx.session?.user?.id ?? "unauthenticated";

  if (result.ok) {
    console.log(
      JSON.stringify({
        level: "info",
        type,
        path,
        duration,
        userId,
        status: "success",
      }),
    );
  } else {
    console.error(
      JSON.stringify({
        level: "error",
        type,
        path,
        duration,
        userId,
        status: "error",
        error: result.error.message,
      }),
    );
  }

  return result;
});

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });
