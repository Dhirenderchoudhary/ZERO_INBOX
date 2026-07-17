"use client";
// @ts-expect-error - Vercel TS resolution workaround
import { createCorsairReactClient } from "corsair/client/react";

export const { useCreateConnectLink } = createCorsairReactClient({
  baseURL: "/api/corsair",
});
