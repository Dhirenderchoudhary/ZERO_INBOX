import { eq } from "drizzle-orm";
import { corsair, initCorsair } from "@/server/corsair";
import { db } from "@/server/db";
import { account } from "@/server/db/schema";
export { isCorsairAuthMissingError } from "./corsair-errors";

type BetterAuthGoogleAccount = typeof account.$inferSelect;

const userTokenSyncPromises = new Map<string, Promise<boolean>>();

export async function syncGoogleTokensForAccount(
  googleAccount: BetterAuthGoogleAccount,
) {
  if (googleAccount.providerId !== "google") return false;

  await initCorsair(googleAccount.userId);

  const tenant = corsair.withTenant(googleAccount.userId);
  const tasks: Promise<unknown>[] = [];

  if (googleAccount.accessToken) {
    tasks.push(tenant.gmail.keys.set_access_token(googleAccount.accessToken));
    tasks.push(
      tenant.googlecalendar.keys.set_access_token(googleAccount.accessToken),
    );
  }

  if (googleAccount.refreshToken) {
    tasks.push(tenant.gmail.keys.set_refresh_token(googleAccount.refreshToken));
    tasks.push(
      tenant.googlecalendar.keys.set_refresh_token(googleAccount.refreshToken),
    );
  }

  if (googleAccount.accessTokenExpiresAt) {
    const expires = googleAccount.accessTokenExpiresAt.toISOString();
    tasks.push(tenant.gmail.keys.set_expires_at(expires));
    tasks.push(tenant.googlecalendar.keys.set_expires_at(expires));
  }

  await Promise.all(tasks);
  return tasks.length > 0;
}

export async function syncGoogleTokensForUser(userId: string) {
  const googleAccount = await db.query.account.findFirst({
    where: eq(account.userId, userId),
  });

  if (googleAccount?.providerId !== "google") return false;
  return syncGoogleTokensForAccount(googleAccount);
}

async function ensureGoogleTokensSyncedForUser(userId: string) {
  let syncPromise = userTokenSyncPromises.get(userId);
  if (!syncPromise) {
    syncPromise = syncGoogleTokensForUser(userId).catch((error) => {
      userTokenSyncPromises.delete(userId);
      throw error;
    });
    userTokenSyncPromises.set(userId, syncPromise);
  }

  return syncPromise;
}

export async function hasGmailRefreshToken(userId: string) {
  const googleAccount = await db.query.account.findFirst({
    where: eq(account.userId, userId),
  });

  if (googleAccount?.providerId === "google" && googleAccount.refreshToken) {
    return true;
  }

  try {
    const token = await Promise.race([
      corsair.withTenant(userId).gmail.keys.get_refresh_token(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
    return typeof token === "string" && token.length > 0;
  } catch {
    return false;
  }
}

export async function ensureGmailRefreshToken(userId: string) {
  await ensureGoogleTokensSyncedForUser(userId);
  return hasGmailRefreshToken(userId);
}
