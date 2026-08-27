export function adminLoginRateLimitIdentifiers(email: string, ip: string | null) {
  const emailKey = email || 'invalid-email'
  return {
    emailKey,
    credentialKey: ip ? `${emailKey}:${ip}` : emailKey,
  }
}
