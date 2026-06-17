/**
 * Tests for the /api/create-order route.
 * Mocks auth, Razorpay, and env to test validation + security logic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock modules before imports ───────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Razorpay must be mocked as a class (it's called with `new`)
vi.mock("razorpay", () => {
  const mockCreate = vi.fn().mockResolvedValue({
    id: "order_test123",
    amount: 49900,
    currency: "INR",
  });
  return {
    default: class MockRazorpay {
      orders = { create: mockCreate };
    },
  };
});

vi.mock("@/env", () => ({
  env: {
    RAZORPAY_KEY_ID: "rzp_test_key",
    RAZORPAY_KEY_SECRET: "rzp_test_secret",
    RAZORPAY_WEBHOOK_SECRET: "webhook_secret",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

import { auth } from "@/lib/auth";
import { POST } from "@/app/api/create-order/route";

const mockGetSession = vi.mocked(auth.api.getSession);

function makeRequest(body: unknown, contentType = "application/json") {
  return new Request("http://localhost:3000/api/create-order", {
    method: "POST",
    headers: { "content-type": contentType },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: authenticated user

  mockGetSession.mockResolvedValue({
    user: { id: "user_123", email: "test@example.com", name: "Test" },
    session: { id: "sess_123" },
  } as any);
});

describe("POST /api/create-order", () => {
  it("returns 415 when Content-Type is not application/json", async () => {
    const req = makeRequest({ amount: 100 }, "text/plain");
    const res = await POST(req);
    expect(res.status).toBe(415);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const req = makeRequest({ amount: 49900 });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost:3000/api/create-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when amount is missing", async () => {
    const req = makeRequest({ currency: "INR" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details).toBeDefined();
  });

  it("returns 400 when amount is below minimum (< 100)", async () => {
    const req = makeRequest({ amount: 50 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-integer amount", async () => {
    const req = makeRequest({ amount: 49.5 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for an unsupported currency", async () => {
    const req = makeRequest({ amount: 100, currency: "XYZ" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 with order details for a valid request", async () => {
    const req = makeRequest({ amount: 49900, currency: "INR" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.order_id).toBe("order_test123");
    expect(body.amount).toBe(49900);
    expect(body.currency).toBe("INR");
  });

  it("defaults currency to INR when not specified", async () => {
    const req = makeRequest({ amount: 100 });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("accepts optional receipt parameter", async () => {
    const req = makeRequest({ amount: 100, receipt: "rcpt_001" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
