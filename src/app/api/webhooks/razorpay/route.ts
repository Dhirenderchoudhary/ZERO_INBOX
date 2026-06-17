import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { env } from "@/env";
import { RazorpayWebhookEventSchema } from "@/server/lib/schemas";

export async function POST(req: Request) {
  // ── 1. Read raw body (must be text for HMAC verification) ─────────────────
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  // ── 2. Validate signature header presence and non-empty ───────────────────
  if (!signature || signature.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty signature header" },
      { status: 400 },
    );
  }

  // ── 3. Ensure webhook secret is configured ────────────────────────────────
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  // ── 4. Timing-safe HMAC verification ──────────────────────────────────────
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "hex");
  const receivedBuf = Buffer.from(signature, "hex");

  const isValid =
    expectedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, receivedBuf);

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  // ── 5. Parse and validate event body with Zod ─────────────────────────────
  let rawEvent: unknown;
  try {
    rawEvent = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RazorpayWebhookEventSchema.safeParse(rawEvent);
  if (!parsed.success) {
    // Unknown/unexpected event shape — acknowledge receipt but do nothing
    console.warn(
      "Razorpay webhook: unrecognized event shape",
      parsed.error.flatten(),
    );
    return NextResponse.json({ received: true, handled: false });
  }

  const event = parsed.data;

  // ── 6. Handle known event types ────────────────────────────────────────────
  try {
    if (event.event === "subscription.charged") {
      const payload = event.payload.subscription.entity;
      await db
        .update(subscriptions)
        .set({
          status: "active",
          currentPeriodEnd: payload.current_end
            ? new Date(payload.current_end * 1000)
            : null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.razorpaySubscriptionId, payload.id));
    } else if (
      event.event === "subscription.halted" ||
      event.event === "subscription.cancelled"
    ) {
      const payload = event.payload.subscription.entity;
      const status =
        event.event === "subscription.halted" ? "halted" : "cancelled";
      await db
        .update(subscriptions)
        .set({ status, updatedAt: new Date() })
        .where(eq(subscriptions.razorpaySubscriptionId, payload.id));
    }
    // Other events: acknowledge but don't process
    return NextResponse.json({ received: true, handled: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
