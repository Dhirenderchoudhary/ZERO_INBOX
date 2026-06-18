# ZERO INBOX Backend Architecture

ZERO INBOX utilizes a robust, type-safe backend architecture powered by **tRPC** and **Zod**. This document outlines the core patterns and rules for backend development.

## 1. The tRPC Philosophy

We use tRPC to provide end-to-end typesafety without code generation. The frontend directly imports the inferred types from the backend router.

### `trpc.ts` Base Configuration

All routers and procedures originate from `src/server/api/trpc.ts`.

- `publicProcedure`: Open to the world.
- `protectedProcedure`: Requires an authenticated session via Better Auth. Throws `UNAUTHORIZED` if no session is present.
- `timingMiddleware`: Automatically logs request duration, path, and user ID.

## 2. Zod Validation (The Strict Pattern)

Every single endpoint must rigorously validate its input using `z.object({...})`.

**Rule: No raw inputs.** If a procedure takes an input, it must be validated by a schema defined in `src/lib/schemas.ts`.

Example:

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { DraftReplySchema } from "../../lib/schemas";

export const aiRouter = createTRPCRouter({
  draftReply: protectedProcedure
    .input(DraftReplySchema)
    .mutation(async ({ input, ctx }) => {
      // input.from and input.subject are fully typed and sanitized
    }),
});
```

## 3. Modular Routers

We do not use monolithic controllers. Each domain has its own router:

- `ai.ts`: AI-powered triage and summarization (GPT-4o-mini).
- `calendar.ts`: Google Calendar fetching and event creation.
- `gmail.ts`: Email synchronization, sending, and triaging.
- `github.ts`: GitHub repository fetching.

These are all merged into the `appRouter` inside `src/server/api/root.ts`.

## 4. Error Handling

- Never throw generic `Error` objects from TRPC routes.
- Always use `TRPCError` with appropriate HTTP status codes (e.g., `BAD_REQUEST`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`).
- Let the `errorFormatter` in `trpc.ts` handle sending flattened Zod errors to the client.

## 5. Caching Strategy

Most API calls that fetch heavy third-party data (like `gmail.listWithTriage` or `calendar.getWeekEvents`) should hit Redis (Upstash) first using helper functions from `src/lib/cache.ts`. Mutations must invalidate their respective caches.
