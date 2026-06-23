/**
 * Centralized Zod validation schemas for the Zero Inbox backend.
 * All routers and API routes import from here for consistent validation.
 */
import { z } from "zod";

// ─── Primitive Schemas ──────────────────────────────────────────────────────

/**
 * A Corsair / Gmail entity ID (alphanumeric with underscores and hyphens).
 * Note: Gmail message IDs can contain hex chars so we allow [a-zA-Z0-9_-].
 */
export const EntityIdSchema = z
  .string()
  .trim()
  .min(1, "Entity ID is required")
  .max(255, "Entity ID is too long")
  .regex(
    /^[a-zA-Z0-9_\-]+$/,
    "Entity ID must only contain alphanumeric characters, underscores, or hyphens",
  );

/**
 * A valid email address (RFC 5321 max 254 chars, lowercased).
 */
export const EmailAddressSchema = z
  .string()
  .trim()
  .email("Must be a valid email address")
  .max(254, "Email address is too long")
  .toLowerCase();

/**
 * An optional email address — either a valid email or an empty string.
 */
export const OptionalEmailSchema = z
  .string()
  .trim()
  .email("Must be a valid email address")
  .max(254)
  .toLowerCase()
  .optional()
  .or(z.literal("").transform(() => undefined));

/**
 * ISO 8601 datetime string (e.g. 2026-06-17T09:00:00.000Z).
 */
export const DateTimeSchema = z
  .string()
  .datetime({ message: "Must be a valid ISO 8601 datetime string" });

/**
 * A future datetime — rejects timestamps in the past.
 */
export const FutureDateTimeSchema = DateTimeSchema.refine(
  (val) => new Date(val) > new Date(),
  { message: "Datetime must be in the future" },
);

// ─── Email Priority ─────────────────────────────────────────────────────────

export const EMAIL_PRIORITIES = [
  "urgent",
  "needs_reply",
  "fyi",
  "newsletter",
  "other",
] as const;

export type EmailPriority = (typeof EMAIL_PRIORITIES)[number];

export const PrioritySchema = z.enum(EMAIL_PRIORITIES);

export const PriorityFilterSchema = z
  .enum([...EMAIL_PRIORITIES, "all", "unread", "starred", "sent"])
  .default("all");

// ─── AI / Agent Schemas ─────────────────────────────────────────────────────

/** Strip HTML/script tags to prevent prompt injection. */
const sanitizeMessage = (s: string) =>
  s.replace(/<[^>]*>/g, "").replace(/[<>]/g, "");

export const AgentMessageContentSchema = z
  .string()
  .trim()
  .min(1, "Message cannot be empty")
  .max(2000, "Message is too long (max 2000 characters)")
  .transform(sanitizeMessage);

export const AgentHistoryItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .string()
    .trim()
    .max(2000, "History message is too long")
    .transform(sanitizeMessage),
});

export const AgentConfirmedActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("send_email"),
    to: EmailAddressSchema,
    subject: z.string().trim().min(1).max(255),
    body: z.string().trim().min(1).max(10_000),
  }),
  z
    .object({
      type: z.literal("create_event"),
      summary: z.string().trim().min(1).max(200),
      description: z.string().trim().max(5000).optional().default(""),
      startTime: z
        .string()
        .refine((v) => !isNaN(Date.parse(v)), "Invalid start time"),
      endTime: z
        .string()
        .refine((v) => !isNaN(Date.parse(v)), "Invalid end time"),
      attendees: z.array(EmailAddressSchema).max(50).default([]),
      sendInvites: z.boolean().default(true),
    })
    .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
      message: "End time must be after start time",
      path: ["endTime"],
    }),
]);

export const AgentChatSchema = z.object({
  message: AgentMessageContentSchema,
  history: z
    .array(AgentHistoryItemSchema)
    .max(50, "History is too long")
    .default([]),
  confirmedAction: AgentConfirmedActionSchema.optional(),
});

// ─── Gmail / Email Schemas ───────────────────────────────────────────────────

export const SendEmailSchema = z.object({
  to: EmailAddressSchema,
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(255, "Subject is too long"),
  body: z
    .string()
    .trim()
    .min(1, "Body is required")
    .max(10_000, "Body is too long"),
  cc: OptionalEmailSchema,
});

export const SaveDraftSchema = z.object({
  to: OptionalEmailSchema,
  subject: z.string().trim().max(255).optional(),
  body: z.string().trim().max(10_000).optional(),
});

export const ScheduledEmailSchema = z.object({
  to: EmailAddressSchema,
  subject: z.string().trim().min(1, "Subject is required").max(255),
  body: z.string().trim().min(1, "Body is required").max(10_000),
  cc: OptionalEmailSchema,
  sendAt: FutureDateTimeSchema,
});

export const TriageOneSchema = z.object({
  entityId: EntityIdSchema,
  subject: z.string().trim().max(1000).default(""),
  snippet: z.string().trim().max(5000).default(""),
  from: z.string().trim().max(255).default(""),
});

export const SummarizeEmailSchema = z.object({
  subject: z.string().trim().max(1000).default(""),
  body: z.string().trim().max(10_000),
  from: z.string().trim().max(255).default(""),
});

export const DraftReplySchema = SummarizeEmailSchema;

export const ListWithTriageSchema = z.object({
  limit: z.number().int().min(1).max(500).default(150),
  priority: PriorityFilterSchema,
});

export const SearchEmailSchema = z.object({
  query: z.string().trim().min(1).max(200),
  limit: z.number().int().min(1).max(50).default(30),
});

export const SnoozeEmailSchema = z.object({
  entityId: EntityIdSchema,
  snoozeUntil: FutureDateTimeSchema,
});

export const ToggleStarSchema = z.object({
  entityId: EntityIdSchema,
  starred: z.boolean(),
});

// ─── Calendar Schemas ────────────────────────────────────────────────────────

export const CalendarEventSchema = z
  .object({
    summary: z.string().trim().min(1, "Event title is required").max(200),
    description: z.string().trim().max(5000).optional(),
    startTime: DateTimeSchema,
    endTime: DateTimeSchema,
    attendees: z
      .array(EmailAddressSchema)
      .max(50, "Too many attendees")
      .default([]),
    location: z.string().trim().max(200).optional(),
    sendInvites: z.boolean().default(true),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const WeekEventsSchema = z.object({
  weekStart: DateTimeSchema,
});

export const SearchEventsSchema = z.object({
  query: z.string().trim().min(1).max(100),
});

// ─── Razorpay / Payment Schemas ──────────────────────────────────────────────

/** ISO 4217 currency codes we accept. Extend as needed. */
const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;

export const CreateOrderSchema = z.object({
  /** Amount in smallest currency unit (paise for INR, cents for USD, etc.) */
  amount: z
    .number()
    .int("Amount must be an integer")
    .min(100, "Amount must be at least 100 (smallest currency unit)")
    .max(10_000_000, "Amount exceeds maximum allowed value"),
  currency: z.enum(SUPPORTED_CURRENCIES).default("INR"),
  receipt: z
    .string()
    .trim()
    .max(40, "Receipt ID is too long")
    .regex(/^[a-zA-Z0-9_\-#]+$/, "Receipt ID contains invalid characters")
    .optional(),
});

export const VerifyPaymentSchema = z.object({
  razorpay_order_id: z
    .string()
    .trim()
    .min(1, "Order ID is required")
    .max(100)
    .regex(/^order_[a-zA-Z0-9]+$/, "Invalid order ID format"),
  razorpay_payment_id: z
    .string()
    .trim()
    .min(1, "Payment ID is required")
    .max(100)
    .regex(/^pay_[a-zA-Z0-9]+$/, "Invalid payment ID format"),
  razorpay_signature: z
    .string()
    .trim()
    .length(64, "Invalid signature length")
    .regex(/^[a-f0-9]+$/, "Signature must be a hex string"),
});

// ─── Razorpay Webhook Schemas ────────────────────────────────────────────────

const RazorpaySubscriptionEntitySchema = z.object({
  id: z.string().trim().min(1),
  status: z.string().trim().min(1),
  current_end: z.number().int().positive().optional(),
});

const RazorpaySubscriptionPayloadSchema = z.object({
  subscription: z.object({
    entity: RazorpaySubscriptionEntitySchema,
  }),
});

export const RazorpayWebhookEventSchema = z.object({
  event: z.string().trim().min(1),
  payload: RazorpaySubscriptionPayloadSchema,
});

export type RazorpayWebhookEvent = z.infer<typeof RazorpayWebhookEventSchema>;

// ─── Type exports ────────────────────────────────────────────────────────────

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;
export type SendEmailInput = z.infer<typeof SendEmailSchema>;
export type ScheduledEmailInput = z.infer<typeof ScheduledEmailSchema>;
export type CalendarEventInput = z.infer<typeof CalendarEventSchema>;
export type AgentChatInput = z.infer<typeof AgentChatSchema>;
export type AgentConfirmedAction = z.infer<typeof AgentConfirmedActionSchema>;
export type TriageOneInput = z.infer<typeof TriageOneSchema>;

// ─── AI Tool Argument Schemas ────────────────────────────────────────────────

export const GetRecentEmailsSchema = z.object({});

export const AISendEmailSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export const AICreateEventSchema = z.object({
  summary: z.string().min(1, "Event summary is required"),
  description: z.string().optional().default(""),
  startTime: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Invalid start time ISO 8601 string"),
  endTime: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Invalid end time ISO 8601 string"),
  attendees: z
    .array(z.string().email("Invalid attendee email"))
    .optional()
    .default([]),
  sendInvites: z.boolean().optional().default(true),
});

export const SearchDriveSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

export const ListGithubIssuesSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repo is required"),
});

export const CreateGithubIssueSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repo is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string().optional().default(""),
});
