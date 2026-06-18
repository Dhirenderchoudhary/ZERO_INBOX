# Security Policy

Security is a foundational pillar of Zero Inbox. Because we handle highly sensitive data (emails, calendar events, personal documents), we employ multiple layers of defense.

## 1. Authentication & Session Management

- **Provider:** All authentication is delegated to Google via OAuth 2.0. We do not store, hash, or manage user passwords.
- **Session Tokens:** Sessions are managed by `better-auth`. Session tokens are HTTP-only, secure, and completely unreadable by client-side JavaScript.
- **RBAC:** Admin routes are strictly protected by role-based access control (RBAC). Both the UI and the underlying tRPC procedures verify that the user's role is `admin` before executing.

## 2. API Security

- **Rate Limiting:** Every incoming API request passes through a sliding-window rate limiter powered by Upstash Redis. The limit is globally set to prevent DDoS and brute-force attacks.
- **Input Validation:** Every tRPC procedure and API route validates incoming payloads using `Zod`. If an unexpected parameter is sent, the request is immediately rejected before touching the business logic.
- **Content Security Policy (CSP):** Next.js middleware injects a strict CSP to mitigate Cross-Site Scripting (XSS). Only explicitly whitelisted domains (like Razorpay and jsdelivr) can execute scripts or load external assets.

## 3. AI Security & Guardrails

Generative AI introduces the risk of Prompt Injection and data exfiltration.

- **Input Sanitization:** User prompts are pre-processed to detect common injection patterns (e.g., "Ignore previous instructions").
- **Telemetry:** Suspicious prompts are logged into the `security_events` database table and immediately surfaced on the Admin Security Dashboard.
- **Output Validation:** The AI agent is forced to output structured JSON. This output is further validated by Zod before being rendered or executed as a tool call.

## 4. Payment Security

- **Cryptographic Verification:** All Razorpay webhook events are cryptographically verified using HMAC SHA256. We never blindly trust incoming payment statuses.

## 5. Reporting a Vulnerability

If you discover a security vulnerability within Zero Inbox, please do **NOT** open a public issue.
Instead, please email `security@zeroinbox.app`. We aim to acknowledge all reports within 24 hours.
