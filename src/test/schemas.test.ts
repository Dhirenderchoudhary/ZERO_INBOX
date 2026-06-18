/**
 * Test suite for the centralized Zod schema library.
 * Validates all schemas accept valid inputs and reject invalid/malicious ones.
 */
import { describe, it, expect } from "vitest";
import {
  EntityIdSchema,
  EmailAddressSchema,
  OptionalEmailSchema,
  DateTimeSchema,
  FutureDateTimeSchema,
  PrioritySchema,
  AgentChatSchema,
  SendEmailSchema,
  ScheduledEmailSchema,
  CalendarEventSchema,
  CreateOrderSchema,
  VerifyPaymentSchema,
  RazorpayWebhookEventSchema,
  SnoozeEmailSchema,
  ToggleStarSchema,
  SearchEmailSchema,
  ListWithTriageSchema,
} from "@/server/lib/schemas";

// ─── EntityIdSchema ─────────────────────────────────────────────────────────

describe("EntityIdSchema", () => {
  it("accepts valid alphanumeric IDs", () => {
    expect(EntityIdSchema.parse("abc123")).toBe("abc123");
    expect(EntityIdSchema.parse("email-id_01")).toBe("email-id_01");
    expect(EntityIdSchema.parse("1a2B3c")).toBe("1a2B3c");
  });

  it("trims whitespace", () => {
    expect(EntityIdSchema.parse("  abc123  ")).toBe("abc123");
  });

  it("rejects empty string", () => {
    expect(() => EntityIdSchema.parse("")).toThrow();
  });

  it("rejects IDs exceeding 255 characters", () => {
    expect(() => EntityIdSchema.parse("a".repeat(256))).toThrow();
  });

  it("rejects IDs with special characters (XSS attempt)", () => {
    expect(() => EntityIdSchema.parse("<script>alert(1)</script>")).toThrow();
    expect(() => EntityIdSchema.parse("id'; DROP TABLE users; --")).toThrow();
    expect(() => EntityIdSchema.parse("../../../etc/passwd")).toThrow();
  });
});

// ─── EmailAddressSchema ──────────────────────────────────────────────────────

describe("EmailAddressSchema", () => {
  it("accepts valid email addresses", () => {
    expect(EmailAddressSchema.parse("user@example.com")).toBe(
      "user@example.com",
    );
    expect(EmailAddressSchema.parse("USER@EXAMPLE.COM")).toBe(
      "user@example.com",
    ); // lowercased
  });

  it("trims whitespace and lowercases", () => {
    expect(EmailAddressSchema.parse("  Test@Example.COM  ")).toBe(
      "test@example.com",
    );
  });

  it("rejects invalid email formats", () => {
    expect(() => EmailAddressSchema.parse("notanemail")).toThrow();
    expect(() => EmailAddressSchema.parse("@domain.com")).toThrow();
    expect(() => EmailAddressSchema.parse("user@")).toThrow();
    expect(() => EmailAddressSchema.parse("")).toThrow();
  });

  it("rejects emails over 254 chars", () => {
    const long = `${"a".repeat(250)}@x.com`;
    expect(() => EmailAddressSchema.parse(long)).toThrow();
  });
});

// ─── OptionalEmailSchema ─────────────────────────────────────────────────────

describe("OptionalEmailSchema", () => {
  it("accepts valid email", () => {
    expect(OptionalEmailSchema.parse("cc@example.com")).toBe("cc@example.com");
  });

  it("accepts undefined", () => {
    expect(OptionalEmailSchema.parse(undefined)).toBeUndefined();
  });

  it("transforms empty string to undefined", () => {
    expect(OptionalEmailSchema.parse("")).toBeUndefined();
  });

  it("rejects invalid email", () => {
    expect(() => OptionalEmailSchema.parse("notvalid")).toThrow();
  });
});

// ─── DateTimeSchema ───────────────────────────────────────────────────────────

describe("DateTimeSchema", () => {
  it("accepts valid ISO 8601 datetime", () => {
    expect(() =>
      DateTimeSchema.parse("2026-06-17T09:00:00.000Z"),
    ).not.toThrow();
  });

  it("rejects plain date strings", () => {
    expect(() => DateTimeSchema.parse("2026-06-17")).toThrow();
  });

  it("rejects arbitrary strings", () => {
    expect(() => DateTimeSchema.parse("not-a-date")).toThrow();
    expect(() => DateTimeSchema.parse("")).toThrow();
  });
});

// ─── FutureDateTimeSchema ─────────────────────────────────────────────────────

describe("FutureDateTimeSchema", () => {
  it("accepts a datetime in the future", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(() => FutureDateTimeSchema.parse(future)).not.toThrow();
  });

  it("rejects a datetime in the past", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(() => FutureDateTimeSchema.parse(past)).toThrow();
  });
});

// ─── PrioritySchema ───────────────────────────────────────────────────────────

describe("PrioritySchema", () => {
  const valid = [
    "urgent",
    "needs_reply",
    "fyi",
    "newsletter",
    "other",
  ] as const;

  it.each(valid)("accepts '%s'", (p) => {
    expect(PrioritySchema.parse(p)).toBe(p);
  });

  it("rejects unknown priority", () => {
    expect(() => PrioritySchema.parse("spam")).toThrow();
    expect(() => PrioritySchema.parse("URGENT")).toThrow(); // case-sensitive
    expect(() => PrioritySchema.parse("")).toThrow();
  });
});

// ─── AgentChatSchema ──────────────────────────────────────────────────────────

describe("AgentChatSchema", () => {
  it("accepts a valid message with no history", () => {
    const result = AgentChatSchema.parse({ message: "Send email to Alice" });
    expect(result.message).toBe("Send email to Alice");
    expect(result.history).toEqual([]);
  });

  it("strips HTML/script tags from message (prompt injection guard)", () => {
    const result = AgentChatSchema.parse({
      message: "<script>alert(1)</script>Hello",
    });
    expect(result.message).not.toContain("<script>");
    expect(result.message).toContain("Hello");
  });

  it("strips angle brackets from message", () => {
    const result = AgentChatSchema.parse({ message: "Say <hello> world" });
    expect(result.message).not.toContain("<");
    expect(result.message).not.toContain(">");
  });

  it("rejects empty message", () => {
    expect(() => AgentChatSchema.parse({ message: "" })).toThrow();
  });

  it("rejects message over 2000 chars", () => {
    expect(() =>
      AgentChatSchema.parse({ message: "a".repeat(2001) }),
    ).toThrow();
  });

  it("accepts valid history", () => {
    const result = AgentChatSchema.parse({
      message: "Hello",
      history: [
        { role: "user", content: "Previous message" },
        { role: "assistant", content: "Previous reply" },
      ],
    });
    expect(result.history).toHaveLength(2);
  });

  it("rejects history with invalid role", () => {
    expect(() =>
      AgentChatSchema.parse({
        message: "Hi",
        history: [{ role: "system", content: "Injected system prompt" }],
      }),
    ).toThrow();
  });

  it("rejects history exceeding 50 items", () => {
    const history = Array.from({ length: 51 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: "msg",
    }));
    expect(() => AgentChatSchema.parse({ message: "Hi", history })).toThrow();
  });
});

// ─── SendEmailSchema ───────────────────────────────────────────────────────────

describe("SendEmailSchema", () => {
  it("accepts a valid send request", () => {
    const result = SendEmailSchema.parse({
      to: "alice@example.com",
      subject: "Hello",
      body: "World",
    });
    expect(result.to).toBe("alice@example.com");
  });

  it("rejects invalid recipient email", () => {
    expect(() =>
      SendEmailSchema.parse({ to: "notanemail", subject: "Hi", body: "Body" }),
    ).toThrow();
  });

  it("rejects empty subject", () => {
    expect(() =>
      SendEmailSchema.parse({
        to: "alice@example.com",
        subject: "",
        body: "Body",
      }),
    ).toThrow();
  });

  it("rejects body over 10000 chars", () => {
    expect(() =>
      SendEmailSchema.parse({
        to: "alice@example.com",
        subject: "Hi",
        body: "a".repeat(10_001),
      }),
    ).toThrow();
  });

  it("accepts optional CC email", () => {
    const result = SendEmailSchema.parse({
      to: "alice@example.com",
      subject: "Hi",
      body: "Body",
      cc: "bob@example.com",
    });
    expect(result.cc).toBe("bob@example.com");
  });
});

// ─── ScheduledEmailSchema ─────────────────────────────────────────────────────

describe("ScheduledEmailSchema", () => {
  const futureDate = new Date(Date.now() + 3_600_000).toISOString();
  const pastDate = new Date(Date.now() - 3_600_000).toISOString();

  it("accepts valid scheduled email", () => {
    expect(() =>
      ScheduledEmailSchema.parse({
        to: "alice@example.com",
        subject: "Reminder",
        body: "Don't forget",
        sendAt: futureDate,
      }),
    ).not.toThrow();
  });

  it("rejects sendAt in the past", () => {
    expect(() =>
      ScheduledEmailSchema.parse({
        to: "alice@example.com",
        subject: "Reminder",
        body: "Don't forget",
        sendAt: pastDate,
      }),
    ).toThrow();
  });
});

// ─── CalendarEventSchema ─────────────────────────────────────────────────────

describe("CalendarEventSchema", () => {
  it("accepts a valid event", () => {
    expect(() =>
      CalendarEventSchema.parse({
        summary: "Team Standup",
        startTime: "2026-07-01T09:00:00.000Z",
        endTime: "2026-07-01T10:00:00.000Z",
      }),
    ).not.toThrow();
  });

  it("rejects endTime before startTime", () => {
    expect(() =>
      CalendarEventSchema.parse({
        summary: "Bad Event",
        startTime: "2026-07-01T10:00:00.000Z",
        endTime: "2026-07-01T09:00:00.000Z",
      }),
    ).toThrow();
  });

  it("rejects empty summary", () => {
    expect(() =>
      CalendarEventSchema.parse({
        summary: "",
        startTime: "2026-07-01T09:00:00.000Z",
        endTime: "2026-07-01T10:00:00.000Z",
      }),
    ).toThrow();
  });

  it("rejects more than 50 attendees", () => {
    const attendees = Array.from(
      { length: 51 },
      (_, i) => `attendee${i}@example.com`,
    );
    expect(() =>
      CalendarEventSchema.parse({
        summary: "Big Meeting",
        startTime: "2026-07-01T09:00:00.000Z",
        endTime: "2026-07-01T10:00:00.000Z",
        attendees,
      }),
    ).toThrow();
  });
});

// ─── CreateOrderSchema ────────────────────────────────────────────────────────

describe("CreateOrderSchema", () => {
  it("accepts a valid order", () => {
    const result = CreateOrderSchema.parse({ amount: 49900, currency: "INR" });
    expect(result.amount).toBe(49900);
    expect(result.currency).toBe("INR");
  });

  it("defaults currency to INR", () => {
    const result = CreateOrderSchema.parse({ amount: 100 });
    expect(result.currency).toBe("INR");
  });

  it("rejects amount below 100", () => {
    expect(() => CreateOrderSchema.parse({ amount: 99 })).toThrow();
  });

  it("rejects non-integer amount", () => {
    expect(() => CreateOrderSchema.parse({ amount: 99.5 })).toThrow();
  });

  it("rejects unsupported currency", () => {
    expect(() =>
      CreateOrderSchema.parse({ amount: 100, currency: "XYZ" }),
    ).toThrow();
  });

  it("rejects amount exceeding maximum", () => {
    expect(() => CreateOrderSchema.parse({ amount: 10_000_001 })).toThrow();
  });

  it("rejects receipt with invalid characters", () => {
    expect(() =>
      CreateOrderSchema.parse({
        amount: 100,
        receipt: "receipt; DROP TABLE orders;",
      }),
    ).toThrow();
  });
});

// ─── VerifyPaymentSchema ──────────────────────────────────────────────────────

describe("VerifyPaymentSchema", () => {
  const validPayload = {
    razorpay_order_id: "order_abc123XYZ",
    razorpay_payment_id: "pay_abc123XYZ",
    razorpay_signature: "a".repeat(64),
  };

  it("accepts a valid payload", () => {
    expect(() => VerifyPaymentSchema.parse(validPayload)).not.toThrow();
  });

  it("rejects missing fields", () => {
    expect(() =>
      VerifyPaymentSchema.parse({ razorpay_order_id: "order_abc123XYZ" }),
    ).toThrow();
  });

  it("rejects order_id without 'order_' prefix", () => {
    expect(() =>
      VerifyPaymentSchema.parse({
        ...validPayload,
        razorpay_order_id: "bad_123",
      }),
    ).toThrow();
  });

  it("rejects payment_id without 'pay_' prefix", () => {
    expect(() =>
      VerifyPaymentSchema.parse({
        ...validPayload,
        razorpay_payment_id: "bad_123",
      }),
    ).toThrow();
  });

  it("rejects signature that is not 64 hex chars", () => {
    expect(() =>
      VerifyPaymentSchema.parse({ ...validPayload, razorpay_signature: "abc" }),
    ).toThrow();
    expect(() =>
      VerifyPaymentSchema.parse({
        ...validPayload,
        razorpay_signature: "G".repeat(64), // not valid hex
      }),
    ).toThrow();
  });
});

// ─── RazorpayWebhookEventSchema ───────────────────────────────────────────────

describe("RazorpayWebhookEventSchema", () => {
  const validEvent = {
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
  };

  it("accepts a valid subscription.charged event", () => {
    expect(() => RazorpayWebhookEventSchema.parse(validEvent)).not.toThrow();
  });

  it("accepts subscription.halted event", () => {
    expect(() =>
      RazorpayWebhookEventSchema.parse({
        ...validEvent,
        event: "subscription.halted",
      }),
    ).not.toThrow();
  });

  it("rejects missing payload", () => {
    expect(() =>
      RazorpayWebhookEventSchema.parse({ event: "subscription.charged" }),
    ).toThrow();
  });

  it("rejects missing entity id", () => {
    expect(() =>
      RazorpayWebhookEventSchema.parse({
        event: "subscription.charged",
        payload: { subscription: { entity: { status: "active" } } },
      }),
    ).toThrow();
  });
});

// ─── SnoozeEmailSchema ────────────────────────────────────────────────────────

describe("SnoozeEmailSchema", () => {
  it("rejects snoozeUntil in the past", () => {
    expect(() =>
      SnoozeEmailSchema.parse({
        entityId: "abc123",
        snoozeUntil: new Date(Date.now() - 1000).toISOString(),
      }),
    ).toThrow();
  });

  it("accepts a future snoozeUntil", () => {
    expect(() =>
      SnoozeEmailSchema.parse({
        entityId: "abc123",
        snoozeUntil: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    ).not.toThrow();
  });
});

// ─── ToggleStarSchema ─────────────────────────────────────────────────────────

describe("ToggleStarSchema", () => {
  it("accepts valid star toggle", () => {
    expect(() =>
      ToggleStarSchema.parse({ entityId: "abc123", starred: true }),
    ).not.toThrow();
  });

  it("rejects missing starred field", () => {
    expect(() => ToggleStarSchema.parse({ entityId: "abc123" })).toThrow();
  });
});

// ─── ListWithTriageSchema ─────────────────────────────────────────────────────

describe("ListWithTriageSchema", () => {
  it("defaults limit to 150 and priority to all", () => {
    const result = ListWithTriageSchema.parse({});
    expect(result.limit).toBe(150);
    expect(result.priority).toBe("all");
  });

  it("rejects limit of 0", () => {
    expect(() => ListWithTriageSchema.parse({ limit: 0 })).toThrow();
  });

  it("rejects limit over 500", () => {
    expect(() => ListWithTriageSchema.parse({ limit: 501 })).toThrow();
  });

  it("accepts known priority filters", () => {
    const filters = [
      "all",
      "urgent",
      "needs_reply",
      "fyi",
      "unread",
      "starred",
      "sent",
    ];
    for (const priority of filters) {
      expect(() => ListWithTriageSchema.parse({ priority })).not.toThrow();
    }
  });
});

// ─── SearchEmailSchema ────────────────────────────────────────────────────────

describe("SearchEmailSchema", () => {
  it("accepts valid search query", () => {
    expect(() => SearchEmailSchema.parse({ query: "invoice" })).not.toThrow();
  });

  it("rejects empty query", () => {
    expect(() => SearchEmailSchema.parse({ query: "" })).toThrow();
  });

  it("rejects query over 200 chars", () => {
    expect(() => SearchEmailSchema.parse({ query: "a".repeat(201) })).toThrow();
  });
});
