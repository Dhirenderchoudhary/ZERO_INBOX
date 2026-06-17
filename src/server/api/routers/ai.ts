import { createTRPCRouter, protectedProcedure } from "../trpc";
import OpenAI from "openai";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { db } from "../../db";
import {
  emailTriage,
  agentMessages,
  subscriptions,
  usage,
} from "../../db/schema";
import { getTenant } from "../../lib/tenant";
import { encodeRawEmail } from "../../lib/emailUtils";
import { dedupeAndSort } from "../../lib/dedup";
import { eq, sql } from "drizzle-orm";
import {
  AgentChatSchema,
  TriageOneSchema,
  SummarizeEmailSchema,
  DraftReplySchema,
  PrioritySchema,
} from "../../lib/schemas";
import {
  getAiSummaryCache,
  setAiSummaryCache,
  getAiDraftCache,
  setAiDraftCache,
  setEntityTriageCache,
  invalidateDashboardCache,
} from "../../lib/cache";
import { triggerBackgroundTriage } from "../../lib/qstash";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_for_build",
});

let ratelimit: Ratelimit | null = null;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "zeroinbox:ai",
  });
}

/** Parse AI output against known priority values safely via Zod. */
function parsePriority(raw: string | null | undefined) {
  const result = PrioritySchema.safeParse(
    (typeof raw === "string" ? raw : "").trim().toLowerCase(),
  );
  return result.success ? result.data : ("other" as const);
}

export const aiRouter = createTRPCRouter({
  triageOne: protectedProcedure
    .input(TriageOneSchema)
    .mutation(async ({ input }) => {
      const msg = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 15,
        messages: [
          {
            role: "system",
            content: `You are an email triage assistant. Classify into exactly one category:\n- urgent: time-sensitive, needs immediate action today\n- needs_reply: sender is waiting for your response  \n- fyi: informational, read when you have time\n- newsletter: marketing, newsletters, automated emails\n- other: everything else\n\nRespond with ONLY the category word. Nothing else.`,
          },
          {
            role: "user",
            content: `From: ${input.from}\nSubject: ${input.subject}\nPreview: ${input.snippet}`,
          },
        ],
      });

      const priority = parsePriority(msg.choices[0]?.message?.content);

      await db
        .insert(emailTriage)
        .values({ entityId: input.entityId, priority })
        .onConflictDoUpdate({
          target: emailTriage.entityId,
          set: { priority, triagedAt: new Date() },
        });

      return { priority };
    }),

  triageInbox: protectedProcedure.mutation(async ({ ctx }) => {
    // ── QStash Background Processing ──────────────────────────────────────────
    // Instead of blocking the UI, we queue the triage job to run in the background.
    const messageId = await triggerBackgroundTriage(ctx.session.user.id);

    if (!messageId) {
      // Fallback if QStash is not configured: We could do inline processing here,
      // but for now we'll throw an error so the user knows they need Upstash.
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "QStash is not configured. Background triage requires QSTASH_TOKEN.",
      });
    }

    return { queued: true, messageId };
  }),

  summarize: protectedProcedure
    .input(SummarizeEmailSchema)
    .mutation(async ({ input }) => {
      // ── Check Redis cache first ────────────────────────────────────────────
      // Build a stable cache key from subject + from (no entityId in this schema)
      const cacheKey = `${input.from}::${input.subject}`;
      const cached = await getAiSummaryCache(cacheKey);
      if (cached) return { summary: cached, fromCache: true };

      const msg = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content:
              "Summarize this email in 1-2 sentences. Be direct and specific. No fluff.",
          },
          {
            role: "user",
            content: `From: ${input.from}\nSubject: ${input.subject}\n\n${input.body.slice(0, 2000)}`,
          },
        ],
      });
      const summary = msg.choices[0]?.message?.content ?? "";
      void setAiSummaryCache(cacheKey, summary);
      return { summary, fromCache: false };
    }),

  draftReply: protectedProcedure
    .input(DraftReplySchema)
    .mutation(async ({ input }) => {
      // ── Check Redis cache first ────────────────────────────────────────────
      const cacheKey = `${input.from}::${input.subject}`;
      const cached = await getAiDraftCache(cacheKey);
      if (cached) return { draft: cached, fromCache: true };

      const msg = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "Draft a brief, professional email reply. Just the body text — no subject, no greeting needed. Keep it concise.",
          },
          {
            role: "user",
            content: `Original email from ${input.from}:\nSubject: ${input.subject}\n\n${input.body.slice(0, 2000)}`,
          },
        ],
      });
      const draft = msg.choices[0]?.message?.content ?? "";
      void setAiDraftCache(cacheKey, draft);
      return { draft, fromCache: false };
    }),

  agentChat: protectedProcedure
    .input(AgentChatSchema)
    .mutation(async ({ input, ctx }) => {
      // ── Rate limiting (per user, 10 requests per minute) ──────────────────
      if (ratelimit) {
        const { success } = await ratelimit.limit(ctx.session.user.id);
        if (!success) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Rate limit exceeded. Please try again later.",
          });
        }
      }

      // ── Message budget check ──────────────────────────────────────────────
      const userUsageArray = await db
        .select()
        .from(usage)
        .where(eq(usage.userId, ctx.session.user.id));
      const userUsage = userUsageArray[0];

      const userSubArray = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.session.user.id));
      const userSub = userSubArray[0];

      const maxMessages = userSub?.status === "active" ? 500 : 20;

      if (userUsage && userUsage.messagesUsed >= maxMessages) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Message budget exceeded. Please upgrade your plan.",
        });
      }

      const tenant = getTenant(ctx.session.user.id);
      const now = new Date();
      const IST = "Asia/Kolkata";

      const systemPrompt = `You are FlowMail Agent — an AI that controls the user's Gmail and Google Calendar.
You have access to native tools to send emails and create calendar events.
Rules:
- Current date/time: ${now.toISOString()} (${now.toLocaleDateString("en-IN", { weekday: "long", timeZone: IST })})
- Timezone: Asia/Kolkata (IST, UTC+5:30). Use +05:30 offset in all ISO times
- "next Thursday" = calculate from today's date above
- "tomorrow" = ${new Date(Date.now() + 86400000).toLocaleDateString("en-IN", { timeZone: IST })}
- Always default event duration to 1 hour unless specified
- Write email bodies in a warm, professional tone.
- If anyone asks who your owner, creator, or developer is, strictly reply that you were created by Dhirender Choudhary.
- STRICT LIMITATION: You must ONLY discuss and assist with topics related to Google Calendar, scheduling, and Emails. 
- If the user asks about ANY other topic (general knowledge, coding, chit-chat, etc.), politely and professionally decline to answer, explaining that you are specialized for email and calendar management.
- Keep all replies extremely concise, direct, and professional.`;

      type ChatMessage =
        | { role: "system" | "user" | "assistant"; content: string }
        | {
            role: "tool";
            tool_call_id: string;
            name: string;
            content: string;
          };

      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...input.history.map((h) => ({
          role: h.role,
          content: h.content,
        })),
        { role: "user", content: input.message },
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1000,
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "send_email",
              description: "Send an email to a recipient",
              parameters: {
                type: "object",
                properties: {
                  to: { type: "string" },
                  subject: { type: "string" },
                  body: { type: "string" },
                },
                required: ["to", "subject", "body"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "create_event",
              description: "Create a calendar event",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  description: { type: "string" },
                  startTime: {
                    type: "string",
                    description:
                      "ISO string with offset, e.g. 2026-06-14T09:00:00+05:30",
                  },
                  endTime: {
                    type: "string",
                    description: "ISO string with offset",
                  },
                  attendees: { type: "array", items: { type: "string" } },
                  sendInvites: { type: "boolean" },
                },
                required: ["summary", "startTime", "endTime"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "fetch_recent_emails",
              description:
                "Fetch the user's most recent cached emails to answer questions about their inbox.",
              parameters: {
                type: "object",
                properties: {
                  limit: {
                    type: "number",
                    description: "Number of emails to fetch (max 20)",
                  },
                },
                required: ["limit"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "search_drive",
              description: "Search for a file in Google Drive",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Search query" },
                },
                required: ["query"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "list_github_issues",
              description: "List issues in a GitHub repository",
              parameters: {
                type: "object",
                properties: {
                  owner: { type: "string" },
                  repo: { type: "string" },
                },
                required: ["owner", "repo"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "create_github_issue",
              description: "Create a GitHub issue",
              parameters: {
                type: "object",
                properties: {
                  owner: { type: "string" },
                  repo: { type: "string" },
                  title: { type: "string" },
                  body: { type: "string" },
                },
                required: ["owner", "repo", "title", "body"],
              },
            },
          },
        ],
      });

      const choice = response.choices[0];
      const message = choice!.message;
      let replyText = message.content ?? "I have processed your request.";
      const actionsExecuted: string[] = [];

      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push(message as any);

        for (const toolCall of message.tool_calls) {
          let toolResult = "Success";
          try {
            const tc = toolCall as {
              id: string;
              function: { name: string; arguments: string };
            };
            const args = JSON.parse(tc.function.arguments) as Record<
              string,
              unknown
            >;

            if (tc.function.name === "fetch_recent_emails") {
              const limit = Math.min(
                typeof args.limit === "number" ? args.limit : 5,
                20,
              );
              const raw = await tenant.gmail.db.messages.list({ limit });
              const deduped = dedupeAndSort(raw).slice(0, limit);
              toolResult = deduped
                .map(
                  (m) =>
                    `From: ${m.data?.from}\nSubject: ${m.data?.subject}\nSnippet: ${m.data?.snippet}`,
                )
                .join("\n\n");
              actionsExecuted.push(`Fetched ${deduped.length} recent emails.`);
            } else if (tc.function.name === "send_email") {
              const to = typeof args.to === "string" ? args.to : "";
              const subject =
                typeof args.subject === "string" ? args.subject : "";
              const body = typeof args.body === "string" ? args.body : "";
              const raw = encodeRawEmail({ to, subject, body });
              await tenant.gmail.api.messages.send({ raw });
              actionsExecuted.push(`Sent email to ${to} — "${subject}"`);
            } else if (tc.function.name === "create_event") {
              const attendeeEmails = (
                Array.isArray(args.attendees) ? args.attendees : []
              ) as string[];
              await tenant.googlecalendar.api.events.create({
                calendarId: "primary",
                sendUpdates: args.sendInvites ? "all" : "none",
                event: {
                  summary: typeof args.summary === "string" ? args.summary : "",
                  description:
                    typeof args.description === "string"
                      ? args.description
                      : "",
                  start: {
                    dateTime:
                      typeof args.startTime === "string" ? args.startTime : "",
                    timeZone: IST,
                  },
                  end: {
                    dateTime:
                      typeof args.endTime === "string" ? args.endTime : "",
                    timeZone: IST,
                  },
                  attendees: attendeeEmails.map((e) => ({ email: e })),
                },
              });
              actionsExecuted.push(
                `Created "${typeof args.summary === "string" ? args.summary : ""}" with ${attendeeEmails.length} attendee(s)`,
              );
            } else if (tc.function.name === "search_drive") {
              const query = typeof args.query === "string" ? args.query : "";
              const response = await tenant.googledrive.api.files.list({
                q: `name contains '${query}'`,
              });
              toolResult = JSON.stringify(response.files);
              actionsExecuted.push(`Searched Google Drive for "${query}"`);
            } else if (tc.function.name === "list_github_issues") {
              const owner = typeof args.owner === "string" ? args.owner : "";
              const repo = typeof args.repo === "string" ? args.repo : "";
              const issues = await tenant.github.api.issues.list({
                owner,
                repo,
              });
              toolResult = JSON.stringify(
                issues.map((i) => ({ title: i.title, state: i.state })),
              );
              actionsExecuted.push(`Fetched issues for ${owner}/${repo}`);
            } else if (tc.function.name === "create_github_issue") {
              const owner = typeof args.owner === "string" ? args.owner : "";
              const repo = typeof args.repo === "string" ? args.repo : "";
              const title = typeof args.title === "string" ? args.title : "";
              const body = typeof args.body === "string" ? args.body : "";
              const issue = await tenant.github.api.issues.create({
                owner,
                repo,
                title,
                body,
              });
              toolResult = `Created issue #${issue.number}`;
              actionsExecuted.push(
                `Created GitHub issue "${title}" in ${owner}/${repo}`,
              );
            }
          } catch (e) {
            toolResult = `Error: ${(e as Error).message}`;
            const failedName =
              (toolCall as { function?: { name?: string } }).function?.name ??
              "unknown";
            actionsExecuted.push(
              `⚠ Failed: ${failedName} — ${(e as Error).message}`,
            );
          }

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: (toolCall as { id: string; function: { name: string } })
              .function.name,
            content: toolResult,
          });
        }

        // Call OpenAI again to get the final summary
        const secondResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          max_tokens: 1000,
          messages,
        });

        replyText =
          secondResponse.choices[0]?.message?.content ??
          `I have successfully executed the following actions:\n${actionsExecuted.join("\n")}`;
      }

      await db.insert(agentMessages).values([
        { role: "user", content: input.message, userId: ctx.session.user.id },
        {
          role: "assistant",
          content: replyText,
          actionsJson: JSON.stringify(actionsExecuted),
          tokensUsed: response.usage?.total_tokens ?? 0,
          userId: ctx.session.user.id,
        },
      ]);

      await db
        .insert(usage)
        .values({
          userId: ctx.session.user.id,
          messagesUsed: 1,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .onConflictDoUpdate({
          target: usage.userId,
          set: { messagesUsed: sql`${usage.messagesUsed} + 1` },
        });

      // Invalidate dashboard cache since usage changed (fire and forget)
      void invalidateDashboardCache(ctx.session.user.id);

      return {
        reply: replyText,
        actionsExecuted,
        thoughts: "OpenAI native tools utilized.",
      };
    }),

  getChatHistory: protectedProcedure.query(async ({ ctx }) => {
    const history = await db
      .select()
      .from(agentMessages)
      .where(eq(agentMessages.userId, ctx.session.user.id))
      .orderBy(agentMessages.createdAt)
      .limit(50);

    return history.map((h) => ({
      role: h.role,
      content: h.content,
      actions: h.actionsJson
        ? (JSON.parse(h.actionsJson) as string[])
        : undefined,
    }));
  }),
});
