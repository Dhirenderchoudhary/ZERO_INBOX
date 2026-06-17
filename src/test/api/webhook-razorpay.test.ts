/**
 * Tests for the /api/webhooks/razorpay route.
 * Validates HMAC verification, Zod event parsing, and DB update logic.
 *
 * NOTE: vi.mock factories are hoisted to the top of the file.
 * Do NOT reference top-level variables inside vi.mock factories.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ── Mock modules ──────────────────────────────────────────────────────────────

vi.mock("@/env", () => ({
  env: {
    RAZORPAY_WEBHOOK_SECRET: "test_webhook_secret",
    RAZORPAY_KEY_ID: "rzp_test_key",
    RAZORPAY_KEY_SECRET: "rzp_test_secret",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

// Use vi.hoisted() to create mocks that can be referenced inside vi.mock factories
const { mockWhere, mockSet, mockUpdate } = vi.hoisted(() => {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
  return { mockWhere, mockSet, mockUpdate };
});

vi.mock("@/server/db", () => ({
  db: {
    update: mockUpdate,
  },
}));

vi.mock("@/server/db/schema", () => ({
  subscriptions: { razorpaySubscriptionId: "razorpay_subscription_id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

import { POST } from "@/app/api/webhooks/razorpay/route";

// Must match the literal used in vi.mock for @/env
const WEBHOOK_SECRET = "test_webhook_secret";

/** Generate a valid Razorpay webhook HMAC signature. */
function sign(body: string): string {
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
}

function makeWebhookRequest(body: string, signature: string | null): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (signature !== null) {
    headers["x-razorpay-signature"] = signature;
  }
  return new Request("http://localhost:3000/api/webhooks/razorpay", {
    method: "POST",
    headers,
    body,
  });
}

const validSubscriptionEvent = JSON.stringify({
  event: "subscription.charged",
  payload: {
    subscription: {
      entity: {
        id: "sub_123",
        status: "active",
        current_end: 1_800_000_000,
      },
    },
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  // Re-wire mock chain after clearAllMocks
  mockWhere.mockResolvedValue(undefined);
  mockSet.mockReturnValue({ where: mockWhere });
  mockUpdate.mockReturnValue({ set: mockSet });
});

describe("POST /api/webhooks/razorpay", () => {
  it("returns 400 when signature header is missing", async () => {
    const req = makeWebhookRequest(validSubscriptionEvent, null);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/missing|signature/i);
  });

  it("returns 400 when signature header is empty", async () => {
    const req = makeWebhookRequest(validSubscriptionEvent, "");
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature is invalid (tampered body)", async () => {
    const body = validSubscriptionEvent;
    const sig = sign(body + "tamper");
    const req = makeWebhookRequest(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid.*signature/i);
  });

  it("returns 400 for invalid JSON body (even with valid sig)", async () => {
    const body = "not-json{{{";
    const sig = sign(body);
    const req = makeWebhookRequest(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 and acknowledges unknown event types gracefully", async () => {
    const body = JSON.stringify({ event: "some.unknown.event" });
    const sig = sign(body);
    const req = makeWebhookRequest(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.handled).toBe(false);
  });

  it("returns 200 and processes subscription.charged event", async () => {
    const sig = sign(validSubscriptionEvent);
    const req = makeWebhookRequest(validSubscriptionEvent, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.handled).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("returns 200 and processes subscription.halted event", async () => {
    const haltedEvent = JSON.stringify({
      event: "subscription.halted",
      payload: {
        subscription: { entity: { id: "sub_456", status: "halted" } },
      },
    });
    const sig = sign(haltedEvent);
    const req = makeWebhookRequest(haltedEvent, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("returns 200 and processes subscription.cancelled event", async () => {
    const cancelEvent = JSON.stringify({
      event: "subscription.cancelled",
      payload: {
        subscription: { entity: { id: "sub_789", status: "cancelled" } },
      },
    });
    const sig = sign(cancelEvent);
    const req = makeWebhookRequest(cancelEvent, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });
});
