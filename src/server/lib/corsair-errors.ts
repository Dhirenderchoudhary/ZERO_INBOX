export function isCorsairAuthMissingError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("[auth-missing:gmail:");
}
