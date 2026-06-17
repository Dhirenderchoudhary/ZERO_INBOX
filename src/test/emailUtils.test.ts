/**
 * Unit tests for email utility functions.
 */
import { describe, it, expect } from "vitest";
import {
  encodeRawEmail,
  decodeEmailBody,
  parseSenderName,
  parseSenderEmail,
  parseRawGoogleMessage,
} from "@/server/lib/emailUtils";

// ─── encodeRawEmail ───────────────────────────────────────────────────────────

describe("encodeRawEmail", () => {
  it("returns a non-empty base64url-encoded string", () => {
    const result = encodeRawEmail({
      to: "alice@example.com",
      subject: "Test Subject",
      body: "Hello World",
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    // base64url uses - and _ not + and /
    expect(result).not.toContain("+");
    expect(result).not.toContain("/");
  });

  it("encodes special characters in subject via RFC 2047", () => {
    const result = encodeRawEmail({
      to: "alice@example.com",
      subject: "Héllo Wörld 😊",
      body: "Body",
    });
    // The encoded result should be a valid base64url string
    expect(result).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("includes CC header when provided", () => {
    const result = encodeRawEmail({
      to: "alice@example.com",
      subject: "Subject",
      body: "Body",
      cc: "bob@example.com",
    });
    // Decode and check for Cc header
    const decoded = decodeURIComponent(
      escape(atob(result.replace(/-/g, "+").replace(/_/g, "/"))),
    );
    expect(decoded).toContain("Cc: bob@example.com");
  });

  it("omits CC header when not provided", () => {
    const result = encodeRawEmail({
      to: "alice@example.com",
      subject: "Subject",
      body: "Body",
    });
    const decoded = decodeURIComponent(
      escape(atob(result.replace(/-/g, "+").replace(/_/g, "/"))),
    );
    expect(decoded).not.toContain("Cc:");
  });

  it("includes a unique Message-ID in each encoding", () => {
    const r1 = encodeRawEmail({
      to: "a@example.com",
      subject: "s",
      body: "b",
    });
    const r2 = encodeRawEmail({
      to: "a@example.com",
      subject: "s",
      body: "b",
    });
    // Different UUIDs → different encoded output
    expect(r1).not.toBe(r2);
  });

  it("converts newlines in body to <br> tags", () => {
    const result = encodeRawEmail({
      to: "a@example.com",
      subject: "s",
      body: "line1\nline2",
    });
    const decoded = decodeURIComponent(
      escape(atob(result.replace(/-/g, "+").replace(/_/g, "/"))),
    );
    expect(decoded).toContain("<br>");
  });
});

// ─── decodeEmailBody ──────────────────────────────────────────────────────────

describe("decodeEmailBody", () => {
  it("returns empty string for null/undefined payload", () => {
    expect(decodeEmailBody(null)).toBe("");
    expect(decodeEmailBody(undefined)).toBe("");
  });

  it("decodes base64url-encoded body.data", () => {
    // "Hello" in base64url
    const data = btoa("Hello World").replace(/\+/g, "-").replace(/\//g, "_");
    const payload = { body: { data } };
    expect(decodeEmailBody(payload)).toBe("Hello World");
  });

  it("decodes text/plain from MIME parts", () => {
    const data = btoa("Plain text content")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const payload = {
      parts: [{ mimeType: "text/plain", body: { data } }],
    };
    expect(decodeEmailBody(payload)).toBe("Plain text content");
  });

  it("falls back to text/html if no text/plain part", () => {
    const htmlData = btoa("<p>HTML</p>")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const payload = {
      parts: [{ mimeType: "text/html", body: { data: htmlData } }],
    };
    expect(decodeEmailBody(payload)).toBe("<p>HTML</p>");
  });

  it("returns empty string when parts have no body data", () => {
    const payload = {
      parts: [{ mimeType: "text/plain", body: {} }],
    };
    expect(decodeEmailBody(payload)).toBe("");
  });
});

// ─── parseSenderName ──────────────────────────────────────────────────────────

describe("parseSenderName", () => {
  it('extracts name from "Name <email>" format', () => {
    expect(parseSenderName("Alice Smith <alice@example.com>")).toBe(
      "Alice Smith",
    );
  });

  it('extracts name from "\"Quoted Name\" <email>" format', () => {
    expect(parseSenderName('"Quoted Name" <q@example.com>')).toBe(
      "Quoted Name",
    );
  });

  it("returns username portion for bare email addresses", () => {
    expect(parseSenderName("alice@example.com")).toBe("alice");
  });

  it("returns 'Unknown' for undefined input", () => {
    expect(parseSenderName(undefined)).toBe("Unknown");
  });

  it("returns 'Unknown' for empty string", () => {
    expect(parseSenderName("")).toBe("Unknown");
  });
});

// ─── parseSenderEmail ─────────────────────────────────────────────────────────

describe("parseSenderEmail", () => {
  it('extracts email from "Name <email>" format', () => {
    expect(parseSenderEmail("Alice Smith <alice@example.com>")).toBe(
      "alice@example.com",
    );
  });

  it("returns bare email address as-is", () => {
    expect(parseSenderEmail("alice@example.com")).toBe("alice@example.com");
  });

  it("returns empty string for undefined input", () => {
    expect(parseSenderEmail(undefined)).toBe("");
  });
});

// ─── parseRawGoogleMessage ────────────────────────────────────────────────────

describe("parseRawGoogleMessage", () => {
  const makeMsg = (headers: { name: string; value: string }[]) => ({
    id: "msg1",
    snippet: "Test snippet",
    labelIds: ["INBOX"],
    internalDate: "1718000000000",
    payload: {
      headers,
      body: {},
      parts: [],
    },
  });

  it("extracts from, subject, and date from headers", () => {
    const msg = makeMsg([
      { name: "From", value: "Alice <alice@example.com>" },
      { name: "Subject", value: "Hello" },
      { name: "Date", value: "Mon, 17 Jun 2026 09:00:00 +0000" },
    ]);
    const result = parseRawGoogleMessage(msg);
    expect(result.from).toBe("Alice <alice@example.com>");
    expect(result.subject).toBe("Hello");
    expect(result.snippet).toBe("Test snippet");
  });

  it("defaults subject to '(no subject)' when header is missing", () => {
    const msg = makeMsg([]);
    const result = parseRawGoogleMessage(msg);
    expect(result.subject).toBe("(no subject)");
  });

  it("defaults from to empty string when header is missing", () => {
    const msg = makeMsg([]);
    const result = parseRawGoogleMessage(msg);
    expect(result.from).toBe("");
  });

  it("is case-insensitive for header name lookup", () => {
    const msg = makeMsg([{ name: "FROM", value: "test@example.com" }]);
    const result = parseRawGoogleMessage(msg);
    expect(result.from).toBe("test@example.com");
  });
});
