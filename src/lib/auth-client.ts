import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

import { sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  plugins: [sentinelClient()],
});

export const { signIn, signOut, useSession } = authClient;
