/**
 * QStash webhook receiver for background AI triage.
 *
 * Processes unclassified emails in the background using OpenAI.
 */
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { db } from "@/server/db";
import { emailTriage } from "@/server/db/schema";
import { getTenant } from "@/server/lib/tenant";
import { dedupeAndSort } from "@/server/lib/dedup";
import { PrioritySchema } from "@/server/lib/schemas";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_for_build",
});

const TriagePayloadSchema = z.object({
  userId: z.string().min(1),
});

/** Parse AI output against known priority values safely via Zod. */
function parsePriority(raw: string | null | undefined) {
  const result = PrioritySchema.safeParse(
    (typeof raw === "string" ? raw : "").trim().toLowerCase(),
  );
  return result.success ? result.data : ("other" as const);
}

async function handler(req: Request) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TriagePayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId } = parsed.data;

  try {
    const tenant = getTenant(userId);
    const raw = await tenant.gmail.db.messages.list({ limit: 30 });
    const messages = dedupeAndSort(raw).slice(0, 20);

    // Actually, to skip triaged ones we just get all existing triage rows for these entities
    const entityIds = messages.map((m) => String(m.entity_id));
    let triaged = new Set<string>();

    if (entityIds.length > 0) {
      const existingAll = await db.query.emailTriage.findMany({
        where: (t, { inArray }) => inArray(t.entityId, entityIds),
      });
      triaged = new Set(existingAll.map((r) => r.entityId));
    }

    let count = 0;
    for (const m of messages) {
      const entityId = String(m.entity_id);
      if (triaged.has(entityId)) continue;

      const data = m.data as Record<string, unknown> | undefined;
      const from = typeof data?.from === "string" ? data.from : "";
      const subject = typeof data?.subject === "string" ? data.subject : "";
      const snippet = typeof data?.snippet === "string" ? data.snippet : "";

      try {
        const msg = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 15,
          messages: [
            {
              role: "system",
              content: `You are Zero Inbox's elite background AI agent. You analyze emails asynchronously to extract the core intent. Classify into exactly one category: urgent, needs_reply, fyi, newsletter, or other. Reply with ONLY the category word. No other characters.`,
            },
            {
              role: "user",
              content: `From: ${from}\nSubject: ${subject}\nPreview: ${snippet}`,
            },
          ],
        });
        const priority = parsePriority(msg.choices[0]?.message?.content);
        await db
          .insert(emailTriage)
          .values({ entityId, priority })
          .onConflictDoUpdate({
            target: emailTriage.entityId,
            set: { priority, triagedAt: new Date() },
          });
        count++;
        // Small delay to prevent hitting OpenAI rate limits on large bursts
        await new Promise((r) => setTimeout(r, 120));
      } catch (error) {
        console.error(
          `[qstash/triage] Failed to triage email ${entityId}:`,
          error,
        );
      }
    }

    return NextResponse.json({ ok: true, triaged: count });
  } catch (error) {
    console.error("[qstash/triage] Triage job failed:", error);
    // Return 500 to tell QStash to retry this job
    return NextResponse.json({ error: "Triage failed" }, { status: 500 });
  }
}

export const POST =
  process.env.NODE_ENV === "development"
    ? handler
    : verifySignatureAppRouter(handler);
