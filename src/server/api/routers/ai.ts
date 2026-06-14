/* eslint-disable */
// @ts-nocheck
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Mistral } from "@mistralai/mistralai";
import { db } from "../../db";
import { emailTriage, agentMessages } from "../../db/schema";
import { getTenant } from "../../lib/tenant";
import { encodeRawEmail } from "../../lib/emailUtils";
import { dedupeAndSort } from "../../lib/dedup";
import { eq } from "drizzle-orm";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

export const aiRouter = createTRPCRouter({
  triageOne: protectedProcedure
    .input(
      z.object({
        entityId: z.string(),
        subject: z.string(),
        snippet: z.string(),
        from: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const msg = await mistral.chat.complete({
        model: "mistral-small-latest",
        maxTokens: 15,
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
        const msg = await mistral.chat.complete({
          model: "mistral-small-latest",
          maxTokens: 15,
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
      } catch {}
    }
    return { triaged: count };
  }),

  summarize: protectedProcedure
    .input(
      z.object({ subject: z.string(), body: z.string(), from: z.string() }),
    )
    .mutation(async ({ input, ctx }) => {
      const msg = await mistral.chat.complete({
        model: "mistral-small-latest",
        maxTokens: 120,
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
      z.object({ subject: z.string(), body: z.string(), from: z.string() }),
    )
    .mutation(async ({ input, ctx }) => {
      const msg = await mistral.chat.complete({
        model: "mistral-small-latest",
        maxTokens: 300,
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
        message: z.string(),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tenant = getTenant(ctx.session.user.id);
      const now = new Date();
      const IST = "Asia/Kolkata";

      const systemPrompt = `You are FlowMail Agent — an AI that controls the user's Gmail and Google Calendar.

When asked to perform actions, respond ONLY with this exact JSON format:
{
  "thoughts": "brief reasoning",
  "actions": [
    {
      "type": "send_email",
      "to": "recipient@example.com",
      "subject": "Subject line",
      "body": "Email body text"
    },
    {
      "type": "create_event",
      "summary": "Event title",
      "description": "Optional description",
      "startTime": "2026-06-14T09:00:00+05:30",
      "endTime": "2026-06-14T10:00:00+05:30",
      "attendees": ["attendee@example.com"],
      "sendInvites": true
    }
  ],
  "reply": "Natural language reply confirming what you did or asking for clarification"
}

Rules:
- Current date/time: ${now.toISOString()} (${now.toLocaleDateString("en-IN", { weekday: "long", timeZone: IST })})
- Timezone: Asia/Kolkata (IST, UTC+5:30). Use +05:30 offset in all ISO times
- "next Thursday" = calculate from today's date above
- "tomorrow" = ${new Date(Date.now() + 86400000).toLocaleDateString("en-IN", { timeZone: IST })}
- Always default event duration to 1 hour unless specified
- If no actions needed (answering a question), set actions to []
- Write email bodies in a warm, professional tone
- Always confirm actions clearly in "reply"`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...input.history.map((h) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user" as const, content: input.message },
      ];

      const response = await mistral.chat.complete({
        model: "mistral-large-latest",
        maxTokens: 1000,
        messages,
      });

      const content = response.choices?.[0]?.message?.content;
      const rawText = typeof content === "string" ? content : "";
      let parsed: any = { thoughts: "", actions: [], reply: rawText };

      try {
        const clean = rawText.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch {}

      const actionsExecuted: string[] = [];

      for (const action of parsed.actions ?? []) {
        try {
          if (action.type === "send_email") {
            const raw = encodeRawEmail({
              to: action.to,
              subject: action.subject,
              body: action.body,
            });
            await tenant.gmail.api.messages.send({ raw });
            actionsExecuted.push(
              `Sent email to ${action.to} — "${action.subject}"`,
            );
          }

          if (action.type === "create_event") {
            await tenant.googlecalendar.api.events.create({
              calendarId: "primary",
              sendUpdates: action.sendInvites ? "all" : "none",
              event: {
                summary: action.summary,
                description: action.description ?? "",
                start: { dateTime: action.startTime, timeZone: IST },
                end: { dateTime: action.endTime, timeZone: IST },
                attendees: (action.attendees ?? []).map((e: string) => ({
                  email: e,
                })),
              },
            });
            actionsExecuted.push(
              `Created "${action.summary}" with ${action.attendees?.length ?? 0} attendee(s)`,
            );
          }
        } catch (e) {
          actionsExecuted.push(
            `⚠ Failed: ${action.type} — ${(e as Error).message}`,
          );
        }
      }

      await db.insert(agentMessages).values([
        { role: "user", content: input.message },
        {
          role: "assistant",
          content: parsed.reply,
          actionsJson: JSON.stringify(actionsExecuted),
          tokensUsed: response.usage?.totalTokens ?? 0,
        },
      ]);

      return {
        reply: parsed.reply,
        actionsExecuted,
        thoughts: parsed.thoughts,
      };
    }),
});
