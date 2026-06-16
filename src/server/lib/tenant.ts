import { corsair } from "../corsair";

export function getTenant(tenantId: string) {
  return corsair.withTenant(tenantId);
}
