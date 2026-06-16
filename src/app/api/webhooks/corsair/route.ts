import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { emailTriage, cachedEmails } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getCorsairClient } from "@/server/corsair";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Check if this is a new email event from Corsair
    if (
      payload.eventType === "message.created" ||
      payload.eventType === "thread.updated"
    ) {
      const { accountId, entityId } = payload;

      const corsair = getCorsairClient();
      // Fetch the actual message data
      const message = await corsair.getIntegrationEntity(accountId, entityId);

      if (!message?.data) {
        return NextResponse.json({ success: false, reason: "No message data" });
      }

      // Upsert into our cachedEmails to power lightning-fast local search
      await db
        .insert(cachedEmails)
        .values({
          userId: accountId, // Or map to our internal userId
          entityId: entityId,
          subject: message.data.subject || "No Subject",
          snippet: message.data.snippet || "",
          from: message.data.from || "",
          date: new Date(message.data.date || Date.now()),
          payload: message.data,
        })
        .onConflictDoUpdate({
          target: cachedEmails.entityId,
          set: {
            payload: message.data,
            updatedAt: new Date(),
          },
        });

      // Pass through LLM for priority triage
      // (Mock logic for the hackathon endpoint, actual logic requires invoking the LLM function)
      const priority = (message.data.subject || "")
        .toLowerCase()
        .includes("urgent")
        ? "urgent"
        : "needs_reply";

      await db
        .insert(emailTriage)
        .values({
          entityId: entityId,
          priority: priority,
          isRead: false,
        })
        .onConflictDoNothing();

      return NextResponse.json({ success: true, processed: true });
    }

    return NextResponse.json({ success: true, ignored: true });
  } catch (e) {
    console.error("Webhook processing error:", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
