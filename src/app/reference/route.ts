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
  spec: {
    content: {
      openapi: "3.1.0",
      info: {
        title: "Zero Inbox API",
        version: "1.0.0",
        description: "Public API documentation for the Zero Inbox backend.",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local development",
        },
      ],
      paths: {
        ...trpcOpenApiDocument.paths,
        "/api/speech-to-text": {
          post: {
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
      },
    },
  },
  theme: "purple", // Giving it a beautiful default theme
  hideDownloadButton: true,
});
