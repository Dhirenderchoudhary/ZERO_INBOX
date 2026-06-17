/**
 * QStash webhook receiver for scheduled email delivery.
 *
 * QStash calls this endpoint at the scheduled time with the email payload.
 * We verify the request signature, send the email, and mark it as sent in DB.
 */
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { db } from "@/server/db";
import { scheduledEmails } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getTenant } from "@/server/lib/tenant";
import { encodeRawEmail } from "@/server/lib/emailUtils";
import { z } from "zod";

const ScheduledEmailPayloadSchema = z.object({
  scheduledEmailId: z.number().int().positive(),
  userId: z.string().min(1),
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  cc: z.string().email().optional(),
});

async function handler(req: Request) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ScheduledEmailPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { scheduledEmailId, userId, to, subject, body, cc } = parsed.data;

  // Check the email hasn't already been sent (idempotency guard)
  const existing = await db.query.scheduledEmails.findFirst({
    where: eq(scheduledEmails.id, scheduledEmailId),
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Scheduled email not found" },
      { status: 404 },
    );
  }

  if (existing.sent) {
    // Already sent — idempotent success
    return NextResponse.json({ ok: true, alreadySent: true });
  }

  try {
    const tenant = getTenant(userId);
    const raw = encodeRawEmail({ to, subject, body, cc });
    await tenant.gmail.api.messages.send({ raw });

    await db
      .update(scheduledEmails)
      .set({ sent: true, sentAt: new Date() })
      .where(eq(scheduledEmails.id, scheduledEmailId));

    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    console.error("[qstash/send-email] Failed to send:", error);
    // Return 500 so QStash retries
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}

export const POST = process.env.QSTASH_CURRENT_SIGNING_KEY
  ? verifySignatureAppRouter(handler)
  : handler;
