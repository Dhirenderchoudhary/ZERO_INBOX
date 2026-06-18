import { ApiReference } from "@scalar/nextjs-api-reference";
import { generateOpenApiDocument } from "trpc-to-openapi";
import { appRouter } from "@/server/api/root";

// Auto-generate OpenAPI spec from TRPC routes
const trpcOpenApiDocument = generateOpenApiDocument(appRouter, {
  title: "Zero Inbox API",
  version: "1.0.0",
  baseUrl: "http://localhost:3000/api/trpc",
});

export const GET = ApiReference({
  theme: "kepler",
  layout: "modern",
  hideDownloadButton: false,
  hideModels: false,
  showSidebar: true,
  metaData: {
    title: "Zero Inbox | API Reference",
    description: "The world-class developer API for Zero Inbox",
  },
  spec: {
    content: {
      openapi: "3.1.0",
      info: {
        title: "Zero Inbox API",
        version: "1.0.0",
        description: `
# Welcome to the Zero Inbox API

Integrate the power of the Zero Inbox AI agent, webhook ingestion, and real-time email syncing directly into your own applications.

## Authentication
Most tRPC routes require an authenticated NextAuth session. For external API integrations, please provide your Bearer Token in the \`Authorization\` header.

## Webhooks
We securely process realtime events from **Corsair** and **Razorpay** to keep your inbox and billing state instantly synced.
        `,
        contact: {
          name: "API Support",
          email: "support@zeroinbox.app",
        },
      },
      servers: [
        {
          url: "https://zeroinbox.app",
          description: "Production Server",
        },
        {
          url: "http://localhost:3000",
          description: "Local Development Server",
        },
      ],
      tags: [
        { name: "Webhooks", description: "Realtime push notification ingestion endpoints" },
        { name: "AI", description: "AI Processing and Intelligence APIs" },
        { name: "tRPC", description: "Internal frontend-to-backend RPC definitions" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        { bearerAuth: [] },
      ],
      paths: {
        ...trpcOpenApiDocument.paths,
        "/api/speech-to-text": {
          post: {
            tags: ["AI"],
            summary: "Speech to Text",
            description: "Convert an audio file to text using OpenAI Whisper.",
            requestBody: {
              content: {
                "multipart/form-data": {
                  schema: {
                    type: "object",
                    properties: {
                      file: {
                        type: "string",
                        format: "binary",
                        description:
                          "The audio file to transcribe (.webm, .mp3, etc.)",
                      },
                    },
                    required: ["file"],
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Successful transcription",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        text: {
                          type: "string",
                          description: "The transcribed text",
                        },
                      },
                    },
                  },
                },
              },
              "400": {
                description: "No audio file provided",
              },
              "500": {
                description: "Server error or missing API key",
              },
            },
          },
        },
        "/api/webhooks/corsair": {
          post: {
            tags: ["Webhooks"],
            summary: "Corsair Realtime Webhook",
            description:
              "Handles incoming push notifications directly from Corsair. Used for realtime email and calendar syncing.",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    description: "Corsair Event Payload (e.g. message.created)",
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Webhook received and processed successfully",
              },
              "500": {
                description: "Webhook processing failed",
              },
            },
          },
        },
        "/api/qstash/send-email": {
          post: {
            tags: ["Background Jobs"],
            summary: "Delayed Email Sending Worker",
            description: "Executed securely by Upstash QStash to send delayed/scheduled emails asynchronously.",
            responses: { "200": { description: "Email sent" } }
          }
        },
        "/api/qstash/triage": {
          post: {
            tags: ["Background Jobs"],
            summary: "AI Inbox Triage Worker",
            description: "Executed securely by Upstash QStash to process bulk email triage using LLMs in the background without blocking the client.",
            responses: { "200": { description: "Triage complete" } }
          }
        },
        "/api/webhooks/razorpay": {
          post: {
            tags: ["Webhooks"],
            summary: "Razorpay Billing Webhook",
            description:
              "Securely processes incoming subscription events from Razorpay (e.g., subscription.charged, subscription.halted) to maintain accurate billing state.",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    description: "Razorpay Webhook Payload",
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Webhook handled successfully",
              },
              "400": {
                description: "Invalid signature or payload",
              },
              "500": {
                description: "Internal server error during processing",
              },
            },
          },
        },
        "/api/create-order": {
          post: {
            tags: ["Billing"],
            summary: "Create Razorpay Order",
            description: "Initiates a new subscription order with Razorpay. Requires an authenticated session.",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      amount: { type: "integer", description: "Amount in smallest currency unit (e.g., paise)" },
                      currency: { type: "string", description: "ISO Currency Code" }
                    },
                    required: ["amount"]
                  }
                }
              }
            },
            responses: { "200": { description: "Order created successfully" }, "401": { description: "Unauthorized" } }
          }
        },
        "/api/verify-payment": {
          post: {
            tags: ["Billing"],
            summary: "Verify Razorpay Payment",
            description: "Verifies the cryptographic signature of a completed Razorpay payment and provisions the subscription.",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      razorpay_payment_id: { type: "string" },
                      razorpay_order_id: { type: "string" },
                      razorpay_signature: { type: "string" },
                      planId: { type: "string" }
                    },
                    required: ["razorpay_payment_id", "razorpay_order_id", "razorpay_signature", "planId"]
                  }
                }
              }
            },
            responses: { "200": { description: "Subscription provisioned" }, "400": { description: "Invalid signature" } }
          }
        },
      },
    },
  },
});
