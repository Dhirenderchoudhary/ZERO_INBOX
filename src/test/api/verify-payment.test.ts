/**
 * Tests for the /api/verify-payment route.
 * Validates auth, Zod body parsing, and timing-safe HMAC verification.
 *
 * NOTE: vi.mock factories are hoisted to the top of the file, so we cannot
 * reference top-level `const` variables inside them. Use string literals instead.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ── Mock modules ──────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Use a literal string for the secret inside the factory (hoisting constraint)
vi.mock("@/env", () => ({
  env: {
    RAZORPAY_KEY_SECRET: "test_razorpay_secret_key",
    RAZORPAY_KEY_ID: "rzp_test_key",
    RAZORPAY_WEBHOOK_SECRET: "webhook_secret",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

import { auth } from "@/lib/auth";
import { POST } from "@/app/api/verify-payment/route";

const mockGetSession = vi.mocked(auth.api.getSession);

// Must match the literal used in the vi.mock factory above
const TEST_SECRET = "test_razorpay_secret_key";

/** Generates a valid HMAC signature for testing. */
function generateSignature(orderId: string, paymentId: string): string {
  return crypto
    .createHmac("sha256", TEST_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

function makeRequest(body: unknown, contentType = "application/json") {
  return new Request("http://localhost:3000/api/verify-payment", {
    method: "POST",
    headers: { "content-type": contentType },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  mockGetSession.mockResolvedValue({
    user: { id: "user_123", email: "test@example.com", name: "Test" },
    session: { id: "sess_123" },
  } as any);
});

describe("POST /api/verify-payment", () => {
  it("returns 415 when Content-Type is not application/json", async () => {
    const req = makeRequest({}, "text/plain");
    const res = await POST(req);
    expect(res.status).toBe(415);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const req = makeRequest({
      razorpay_order_id: "order_abc123",
      razorpay_payment_id: "pay_abc123",
      razorpay_signature: "a".repeat(64),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost:3000/api/verify-payment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when required fields are missing", async () => {
    const req = makeRequest({ razorpay_order_id: "order_abc123" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details).toBeDefined();
  });

  it("returns 400 when order_id format is invalid", async () => {
    const req = makeRequest({
      razorpay_order_id: "invalid_id",
      razorpay_payment_id: "pay_abc123",
      razorpay_signature: "a".repeat(64),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when payment_id format is invalid", async () => {
    const req = makeRequest({
      razorpay_order_id: "order_abc123",
      razorpay_payment_id: "invalid_id",
      razorpay_signature: "a".repeat(64),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature is wrong length", async () => {
    const req = makeRequest({
      razorpay_order_id: "order_abc123",
      razorpay_payment_id: "pay_abc123",
      razorpay_signature: "abc123",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature is tampered (HMAC mismatch)", async () => {
    const req = makeRequest({
      razorpay_order_id: "order_abc123",
      razorpay_payment_id: "pay_abc123",
      razorpay_signature: "b".repeat(64),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid.*signature/i);
  });

  it("returns 200 with success:true for a correct HMAC signature", async () => {
    const orderId = "order_abc123XYZ";
    const paymentId = "pay_abc123XYZ";
    const signature = generateSignature(orderId, paymentId);

    const req = makeRequest({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
