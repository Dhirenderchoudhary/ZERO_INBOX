import { NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/env";
import { auth } from "@/lib/auth";
import { VerifyPaymentSchema } from "@/server/lib/schemas";

export async function POST(req: Request) {
  // ── 1. Content-Type enforcement ────────────────────────────────────────────
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 415 },
    );
  }

  // ── 2. Authentication check ────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 3. Validate request body with Zod ─────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = VerifyPaymentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    parsed.data;

  // ── 4. Gateway key availability ────────────────────────────────────────────
  if (!env.RAZORPAY_KEY_SECRET) {
    console.error("Razorpay secret is not configured.");
    return NextResponse.json(
      { error: "Payment gateway is not configured" },
      { status: 503 },
    );
  }

  // ── 5. Timing-safe HMAC verification ──────────────────────────────────────
  const generatedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // Use timingSafeEqual to prevent timing-based signature forgery attacks
  const sigBuf = Buffer.from(razorpay_signature, "hex");
  const genBuf = Buffer.from(generatedSignature, "hex");

  const isValid =
    sigBuf.length === genBuf.length && crypto.timingSafeEqual(sigBuf, genBuf);

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid payment signature" },
      { status: 400 },
    );
  }

  // Payment is verified
  return NextResponse.json({
    success: true,
    message: "Payment verified successfully",
  });
}
