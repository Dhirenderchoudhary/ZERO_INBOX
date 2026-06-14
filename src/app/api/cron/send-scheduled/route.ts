import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { scheduledEmails } from "@/server/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { getTenant } from "@/server/lib/tenant";
import { encodeRawEmail } from "@/server/lib/emailUtils";

export async function GET(req: NextRequest) {
  // Secure with secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET ?? "dev-cron"}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const tenant = getTenant();
  const due = await db
    .select()
    .from(scheduledEmails)
    .where(
      and(
        eq(scheduledEmails.sent, false),
        lte(scheduledEmails.sendAt, new Date()),
      ),
    );

  let sent = 0;
  for (const email of due) {
    try {
      const raw = encodeRawEmail({
        to: email.to,
        subject: email.subject,
        body: email.body,
        cc: email.cc ?? undefined,
      });
      await tenant.gmail.api.messages.send({ raw });
      await db
        .update(scheduledEmails)
        .set({ sent: true, sentAt: new Date() })
        .where(eq(scheduledEmails.id, email.id));
      sent++;
    } catch {}
  }

  return NextResponse.json({ processed: due.length, sent });
}
