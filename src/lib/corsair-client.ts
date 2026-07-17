"use client";
import { createCorsairReactClient } from "corsair/client/react";

export const { useCreateConnectLink } = createCorsairReactClient({
  baseURL: "/api/corsair",
});
