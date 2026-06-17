import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

import { sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : env.NEXT_PUBLIC_APP_URL,
  plugins: [sentinelClient()],
});

export const { signIn, signOut, useSession } = authClient;
