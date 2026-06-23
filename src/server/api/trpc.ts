import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { OpenApiMeta } from "trpc-to-openapi";

import { db } from "@/server/db";
import { auth } from "@/lib/auth";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers });
  return {
    db,
    session,
    ...opts,
  };
};

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

export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path, type, ctx }) => {
  const start = Date.now();

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

export const publicProcedure = t.procedure.use(timingMiddleware);

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
