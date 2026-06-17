/* eslint-disable */
// @ts-nocheck
import { z } from "zod";
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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

let ratelimit: Ratelimit | null = null;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 m"),
  });
}

export const aiRouter = createTRPCRouter({
  triageOne: protectedProcedure
    .input(
      z.object({
        entityId: z.string().trim().min(1).max(255),
        subject: z.string().trim().max(1000),
        snippet: z.string().trim().max(5000),
        from: z.string().trim().max(255),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const msg = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 15,
        messages: [
          {
            role: "system",
            content: `You are an email triage assistant. Classify into exactly one category:
- urgent: time-sensitive, needs immediate action today
- needs_reply: sender is waiting for your response  
- fyi: informational, read when you have time
- newsletter: marketing, newsletters, automated emails
- other: everything else

Respond with ONLY the category word. Nothing else.`,
          },
          {
            role: "user",
            content: `From: ${input.from}\nSubject: ${input.subject}\nPreview: ${input.snippet}`,
          },
        ],
      });

      const content = msg.choices?.[0]?.message?.content;
      const raw = (typeof content === "string" ? content : "")
        .trim()
        .toLowerCase();
      const valid = [
        "urgent",
        "needs_reply",
        "fyi",
        "newsletter",
        "other",
      ] as const;
      const priority = valid.includes(raw as any)
        ? (raw as (typeof valid)[number])
        : "other";

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
    const tenant = getTenant(ctx.session.user.id);
    const raw = await tenant.gmail.db.messages.list({ limit: 30 });
    const messages = dedupeAndSort(raw).slice(0, 20);

    const existing = await db
      .select()
      .from(emailTriage)
      .where(eq(emailTriage.priority, "other"));
    const triaged = new Set(existing.map((r) => r.entityId));

    let count = 0;
    for (const m of messages) {
      if (triaged.has(m.entity_id)) continue;
      try {
        const msg = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 15,
          messages: [
            {
              role: "system",
              content:
                "Classify email: urgent, needs_reply, fyi, newsletter, or other. Reply with ONLY the word.",
            },
            {
              role: "user",
              content: `From: ${m.data?.from ?? ""}\nSubject: ${m.data?.subject ?? ""}\nPreview: ${m.data?.snippet ?? ""}`,
            },
          ],
        });
        const content = msg.choices?.[0]?.message?.content;
        const rawText = (typeof content === "string" ? content : "")
          .trim()
          .toLowerCase();
        const valid = ["urgent", "needs_reply", "fyi", "newsletter", "other"];
        const priority = valid.includes(rawText) ? rawText : "other";
        await db
          .insert(emailTriage)
          .values({ entityId: m.entity_id, priority: priority as any })
          .onConflictDoUpdate({
            target: emailTriage.entityId,
            set: { priority: priority as any, triagedAt: new Date() },
          });
        count++;
        await new Promise((r) => setTimeout(r, 120));
      } catch (error) {
        console.error(`Failed to triage email ${m.entity_id}:`, error);
      }
    }
    return { triaged: count };
  }),

  summarize: protectedProcedure
    .input(
      z.object({
        subject: z.string().trim().max(1000),
        body: z.string().trim().max(10000),
        from: z.string().trim().max(255),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
      const content = msg.choices?.[0]?.message?.content;
      return { summary: typeof content === "string" ? content : "" };
    }),

  draftReply: protectedProcedure
    .input(
      z.object({
        subject: z.string().trim().max(1000),
        body: z.string().trim().max(10000),
        from: z.string().trim().max(255),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
      const content = msg.choices?.[0]?.message?.content;
      return { draft: typeof content === "string" ? content : "" };
    }),

  agentChat: protectedProcedure
    .input(
      z.object({
        message: z.string().trim().min(1).max(2000),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().trim().max(2000),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      /*
      if (ratelimit) {
        const { success } = await ratelimit.limit(ctx.session.user.id);
        if (!success) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Rate limit exceeded. Please try again later.",
          });
        }
      }
      */

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

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...input.history.map((h) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user" as const, content: input.message },
      ];

      let response = await openai.chat.completions.create({
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
        ],
      });

      let choice = response.choices[0];
      let message = choice.message;
      let replyText = message.content ?? "I have processed your request.";
      const actionsExecuted: string[] = [];

      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push(message as any);

        for (const toolCall of message.tool_calls) {
          let toolResult = "Success";
          try {
            const args = JSON.parse(toolCall.function.arguments);

            if (toolCall.function.name === "fetch_recent_emails") {
              const raw = await tenant.gmail.db.messages.list({
                limit: Math.min(args.limit || 5, 20),
              });
              const deduped = dedupeAndSort(raw).slice(0, args.limit || 5);
              toolResult = deduped
                .map(
                  (m) =>
                    `From: ${m.data?.from}\nSubject: ${m.data?.subject}\nSnippet: ${m.data?.snippet}`,
                )
                .join("\n\n");
              actionsExecuted.push(`Fetched ${deduped.length} recent emails.`);
            } else if (toolCall.function.name === "send_email") {
              const raw = encodeRawEmail({
                to: args.to,
                subject: args.subject,
                body: args.body,
              });
              await tenant.gmail.api.messages.send({ raw });
              actionsExecuted.push(
                `Sent email to ${args.to} — "${args.subject}"`,
              );
            } else if (toolCall.function.name === "create_event") {
              await tenant.googlecalendar.api.events.create({
                calendarId: "primary",
                sendUpdates: args.sendInvites ? "all" : "none",
                requestBody: {
                  summary: args.summary,
                  description: args.description ?? "",
                  start: { dateTime: args.startTime, timeZone: IST },
                  end: { dateTime: args.endTime, timeZone: IST },
                  attendees: (args.attendees ?? []).map((e: string) => ({
                    email: e,
                  })),
                },
              });
              actionsExecuted.push(
                `Created "${args.summary}" with ${args.attendees?.length ?? 0} attendee(s)`,
              );
            }
          } catch (e) {
            toolResult = `Error: ${(e as Error).message}`;
            actionsExecuted.push(
              `⚠ Failed: ${toolCall.function.name} — ${(e as Error).message}`,
            );
          }

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: toolResult,
          } as any);
        }

        // Call OpenAI again to get the final summary
        const secondResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          max_tokens: 1000,
          messages,
        });

        replyText =
          secondResponse.choices[0].message.content ??
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
      .limit(50); // Fetch the last 50 messages to maintain reasonable context

    return history.map((h) => ({
      role: h.role,
      content: h.content,
      actions: h.actionsJson ? JSON.parse(h.actionsJson) : undefined,
    }));
  }),
});
