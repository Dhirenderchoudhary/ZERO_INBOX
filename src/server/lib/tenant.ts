import { corsair } from '../corsair';
import { env } from '@/env';

export function getTenant() {
  return corsair.withTenant(env.TENANT_ID ?? 'dev');
}
