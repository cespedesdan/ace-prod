export const ADMIN_LOGIN_SOURCE_RATE_LIMIT = {
  limit: 3,
  windowMs: 15 * 60_000,
  blockMs: 60 * 60_000,
}

export const ADMIN_LOGIN_ACCOUNT_RATE_LIMIT = {
  limit: 20,
  windowMs: 15 * 60_000,
  blockMs: 10 * 60_000,
}

export function adminLoginRateLimitIdentifiers(email: string, ip: string | null) {
  const emailKey = email || 'invalid-email'
  return {
    emailKey,
    credentialKey: ip ? `${emailKey}:${ip}` : emailKey,
  }
}
