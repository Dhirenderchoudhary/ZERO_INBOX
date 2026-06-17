/**
 * QStash-based scheduled email delivery.
 *
 * When a user schedules an email, we publish a QStash message with a delay
 * equal to the time until sendAt. QStash calls our webhook at exactly the
 * right time with automatic retries on failure.
 *
 * Flow:
 *   User → scheduleSend tRPC mutation
 *     → Insert into scheduledEmails DB (for record-keeping)
 *     → Publish QStash message with delay
 *     → QStash calls POST /api/qstash/send-email at sendAt time
 *     → Webhook sends the email via Gmail API and marks as sent
 */

import { Client } from "@upstash/qstash";
import { env } from "@/env";

let _client: Client | null = null;

/** Get the QStash client (returns null if QSTASH_TOKEN is not configured). */
export function getQStashClient(): Client | null {
  if (_client) return _client;
  if (process.env.QSTASH_TOKEN) {
    _client = new Client({ token: process.env.QSTASH_TOKEN });
  }
  return _client;
}

/** The URL that QStash will call to deliver a scheduled email. */
function getDeliveryUrl(): string {
  return `${env.NEXT_PUBLIC_APP_URL}/api/qstash/send-email`;
}

export interface ScheduledEmailPayload {
  scheduledEmailId: number;
  userId: string;
  to: string;
  subject: string;
  body: string;
  cc?: string;
}

/**
 * Publish a scheduled email to QStash.
 * QStash will call the delivery URL after `delaySeconds`.
 * Returns the QStash message ID, or null if QStash is not configured.
 */
export async function scheduleEmailViaQStash(
  payload: ScheduledEmailPayload,
  sendAt: Date,
): Promise<string | null> {
  const client = getQStashClient();
  if (!client) {
    console.warn(
      "[qstash] QSTASH_TOKEN not configured — scheduled email will rely on cron fallback",
    );
    return null;
  }

  const delaySeconds = Math.max(
    0,
    Math.floor((sendAt.getTime() - Date.now()) / 1000),
  );

  const result = await client.publishJSON({
    url: getDeliveryUrl(),
    body: payload,
    delay: delaySeconds,
    retries: 3,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return result.messageId;
}

/**
 * Trigger background AI triage for a user's inbox via QStash.
 */
export async function triggerBackgroundTriage(
  userId: string,
): Promise<string | null> {
  const client = getQStashClient();
  if (!client) {
    console.warn(
      "[qstash] QSTASH_TOKEN not configured — background triage skipped",
    );
    return null;
  }

  const result = await client.publishJSON({
    url: `${env.NEXT_PUBLIC_APP_URL}/api/qstash/triage`,
    body: { userId },
    retries: 2,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return result.messageId;
}

/**
 * Trigger durable background inbox sync via Upstash Workflow.
 */
export async function triggerInboxSyncWorkflow(
  userId: string,
): Promise<string | null> {
  const client = getQStashClient();
  if (!client) {
    console.warn(
      "[qstash] QSTASH_TOKEN not configured — background inbox sync skipped",
    );
    return null;
  }

  // Upstash Workflow routes are triggered just like regular QStash endpoints
  const result = await client.publishJSON({
    url: `${env.NEXT_PUBLIC_APP_URL}/api/workflow/sync-inbox`,
    body: { userId },
    retries: 2,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return result.messageId;
}
