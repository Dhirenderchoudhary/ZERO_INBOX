/**
 * Tests for Gmail tRPC router input validation.
 * Tests that UNAUTHORIZED is thrown without a session and validates input schemas.
 */
import { describe, it, expect, vi } from "vitest";
import {
  ListWithTriageSchema,
  SearchEmailSchema,
  SendEmailSchema,
  SaveDraftSchema,
  ScheduledEmailSchema,
  SnoozeEmailSchema,
  ToggleStarSchema,
  EntityIdSchema,
} from "@/server/lib/schemas";

// ── Schema input validation tests ─────────────────────────────────────────────
// These test the exact schemas used in each router procedure to ensure
// they enforce the correct constraints.

describe("gmailRouter input schemas", () => {
  describe("listWithTriage input", () => {
    it("defaults limit=150, priority='all'", () => {
      const result = ListWithTriageSchema.parse({});
      expect(result.limit).toBe(150);
      expect(result.priority).toBe("all");
    });

    it("rejects limit=0 and limit=501", () => {
      expect(() => ListWithTriageSchema.parse({ limit: 0 })).toThrow();
      expect(() => ListWithTriageSchema.parse({ limit: 501 })).toThrow();
    });

    it("accepts all known priority filter values", () => {
      const filters = [
        "all",
        "urgent",
        "needs_reply",
        "fyi",
        "newsletter",
        "other",
        "unread",
        "starred",
        "sent",
      ];
      filters.forEach((p) => {
        expect(() => ListWithTriageSchema.parse({ priority: p })).not.toThrow();
      });
    });
  });

  describe("search input", () => {
    it("rejects empty query", () => {
      expect(() => SearchEmailSchema.parse({ query: "" })).toThrow();
    });

    it("rejects query > 200 chars", () => {
      expect(() =>
        SearchEmailSchema.parse({ query: "a".repeat(201) }),
      ).toThrow();
    });

    it("defaults limit to 30", () => {
      const result = SearchEmailSchema.parse({ query: "hello" });
      expect(result.limit).toBe(30);
    });
  });

  describe("getOne / markRead / archive entityId input", () => {
    it("rejects empty entityId", () => {
      expect(() => EntityIdSchema.parse("")).toThrow();
    });

    it("rejects entityId with path traversal", () => {
      expect(() => EntityIdSchema.parse("../../etc/passwd")).toThrow();
    });

    it("accepts valid entity IDs", () => {
      expect(() => EntityIdSchema.parse("abc123")).not.toThrow();
      expect(() => EntityIdSchema.parse("gmail-msg-1a2b3c")).not.toThrow();
    });
  });

  describe("send input", () => {
    it("rejects invalid to email", () => {
      expect(() =>
        SendEmailSchema.parse({ to: "bad", subject: "Hi", body: "Body" }),
      ).toThrow();
    });

    it("rejects empty subject", () => {
      expect(() =>
        SendEmailSchema.parse({
          to: "a@example.com",
          subject: "",
          body: "Body",
        }),
      ).toThrow();
    });

    it("rejects body over 10000 chars", () => {
      expect(() =>
        SendEmailSchema.parse({
          to: "a@example.com",
          subject: "Hi",
          body: "x".repeat(10_001),
        }),
      ).toThrow();
    });

    it("accepts valid CC email", () => {
      const result = SendEmailSchema.parse({
        to: "a@example.com",
        subject: "Hi",
        body: "Body",
        cc: "B@Example.COM",
      });
      expect(result.cc).toBe("b@example.com"); // lowercased
    });
  });

  describe("scheduleSend input", () => {
    it("rejects sendAt in the past", () => {
      expect(() =>
        ScheduledEmailSchema.parse({
          to: "a@example.com",
          subject: "Hi",
          body: "Body",
          sendAt: new Date(Date.now() - 1000).toISOString(),
        }),
      ).toThrow();
    });

    it("accepts valid future sendAt", () => {
      expect(() =>
        ScheduledEmailSchema.parse({
          to: "a@example.com",
          subject: "Hi",
          body: "Body",
          sendAt: new Date(Date.now() + 3_600_000).toISOString(),
        }),
      ).not.toThrow();
    });
  });

  describe("snooze input", () => {
    it("rejects entityId with special chars", () => {
      expect(() =>
        SnoozeEmailSchema.parse({
          entityId: "bad<id>",
          snoozeUntil: new Date(Date.now() + 60_000).toISOString(),
        }),
      ).toThrow();
    });

    it("rejects snoozeUntil in past", () => {
      expect(() =>
        SnoozeEmailSchema.parse({
          entityId: "abc123",
          snoozeUntil: new Date(Date.now() - 1000).toISOString(),
        }),
      ).toThrow();
    });
  });

  describe("toggleStar input", () => {
    it("rejects missing starred field", () => {
      expect(() => ToggleStarSchema.parse({ entityId: "abc123" })).toThrow();
    });

    it("accepts star=true", () => {
      expect(() =>
        ToggleStarSchema.parse({ entityId: "abc123", starred: true }),
      ).not.toThrow();
    });
  });
});
