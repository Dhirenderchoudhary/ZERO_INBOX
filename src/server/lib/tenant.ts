import { corsair } from "../corsair";

export function getTenant(tenantId: string) {
  const effectiveTenant =
    process.env.NODE_ENV === "development" ? "dev" : tenantId;
  return corsair.withTenant(effectiveTenant);
}
