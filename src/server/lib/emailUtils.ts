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
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    body,
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
  if (payload.body?.data) {
    try {
      const b64 = payload.body.data.replace(/-/g, "+").replace(/_/g, "/");
      return decodeURIComponent(escape(atob(b64)));
    } catch {}
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        try {
          const b64 = part.body.data.replace(/-/g, "+").replace(/_/g, "/");
          return decodeURIComponent(escape(atob(b64)));
        } catch {}
      }
    }
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
