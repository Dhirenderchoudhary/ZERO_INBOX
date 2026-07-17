"use client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vercel TS resolution workaround
import { createCorsairReactClient } from "corsair/client/react";

export const { useCreateConnectLink } = createCorsairReactClient({
  baseURL: "/api/corsair",
});
