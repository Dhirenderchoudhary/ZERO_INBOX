import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  try {
    if (event.event === "subscription.charged") {
      const payload = event.payload.subscription.entity;
      await db
        .update(subscriptions)
        .set({
          status: payload.status,
          currentPeriodEnd: new Date(payload.current_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.razorpaySubscriptionId, payload.id));
    } else if (
      event.event === "subscription.halted" ||
      event.event === "subscription.cancelled"
    ) {
      const payload = event.payload.subscription.entity;
      await db
        .update(subscriptions)
        .set({
          status: payload.status,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.razorpaySubscriptionId, payload.id));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
