import crypto from "crypto";

export interface EmailParams {
  to: string;
  subject: string;
  body: string;
  from?: string;
  cc?: string;
  replyTo?: string;
}

export function encodeRawEmail({
  to,
  subject,
  body,
  from,
  cc,
  replyTo,
}: EmailParams): string {
  const encodeSubject = (s: string) => {
    const b64 = btoa(unescape(encodeURIComponent(s)));
    return `=?UTF-8?B?${b64}?=`;
  };

  const lines = [
    from ? `From: ${from}` : null,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    `Message-ID: <${crypto.randomUUID()}@zeroinbox.local>`,
    `Date: ${new Date().toUTCString()}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    body.replace(/\n/g, "<br>"),
  ]
    .filter(Boolean)
    .join("\r\n");

  return btoa(unescape(encodeURIComponent(lines)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeEmailBody(payload: any): string {
  if (!payload) return "";

  const tryDecode = (data: string) => {
    try {
      const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
      return decodeURIComponent(escape(atob(b64)));
    } catch {
      return "";
    }
  };

  if (payload.body?.data) {
    return tryDecode(payload.body.data);
  }

  let htmlBody = "";
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        const decoded = tryDecode(part.body.data);
        if (decoded) return decoded;
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        htmlBody = tryDecode(part.body.data);
      }
    }
    if (htmlBody) return htmlBody;

    for (const part of payload.parts) {
      const nested = decodeEmailBody(part);
      if (nested) return nested;
    }
  }
  return "";
}

export function parseSenderName(from: string | undefined): string {
  if (!from) return "Unknown";
  const match = /^"?([^"<]+)"?\s*</.exec(from);
  return match ? match[1]!.trim() : (from.split("@")[0] ?? from);
}

export function parseSenderEmail(from: string | undefined): string {
  if (!from) return "";
  const match = /<(.+)>/.exec(from);
  return match ? match[1]! : from;
}

export function parseRawGoogleMessage(fullMsg: any) {
  const headers = fullMsg.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())
      ?.value;

  const text = decodeEmailBody(fullMsg.payload);

  return {
    ...fullMsg,
    from: getHeader("from") || "",
    subject: getHeader("subject") || "(no subject)",
    date: getHeader("date") || fullMsg.internalDate || new Date().toISOString(),
    text,
    snippet: fullMsg.snippet || "",
    labelIds: fullMsg.labelIds || [],
  };
}
