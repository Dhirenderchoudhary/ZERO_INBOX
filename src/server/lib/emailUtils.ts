export function encodeRawEmail(opts: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}): string {
  const lines = [
    ...(opts.from ? [`From: ${opts.from}`] : []),
    `To: ${opts.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(opts.subject).toString("base64")}?=`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    opts.body,
  ];
  const message = lines.join("\r\n");
  const base64 = Buffer.from(message, "utf-8").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};

export function decodeEmailBody(payload?: GmailPart): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  for (const part of payload.parts ?? []) {
    const text = decodeEmailBody(part);
    if (text) return text;
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  return "";
}

export function getHeader(
  headers: { name?: string; value?: string }[] | undefined,
  name: string,
): string {
  return (
    headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

export function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(?:(.*?)<)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:>)?$/);
  if (match) {
    return {
      name: (match[1] || "").trim().replace(/^"|"$/g, ""),
      email: match[2] || "",
    };
  }
  return { name: "", email: raw.trim() };
}
