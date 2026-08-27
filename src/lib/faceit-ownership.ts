import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'

const AUTHORIZATION_ENDPOINT = 'https://accounts.faceit.com/'
const TOKEN_ENDPOINT = 'https://api.faceit.com/auth/v1/oauth/token'
const USERINFO_ENDPOINT = 'https://api.faceit.com/auth/v1/resources/userinfo'
const STATE_TTL_SECONDS = 10 * 60
const PROOF_TTL_SECONDS = 15 * 60
const ownershipGlobal = globalThis as typeof globalThis & { aceDevFaceitCookieSecret?: string }

type OAuthStatePayload = {
  kind: 'faceit-oauth-state'
  state: string
  verifier: string
  teamId: string
}

export type FaceitOwnershipProof = {
  kind: 'faceit-team-ownership'
  teamId: string
  playerId: string
}

type FaceitOAuthConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export class FaceitOAuthError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message)
    this.name = 'FaceitOAuthError'
  }
}

function getCookieSecret() {
  const secret = process.env.FACEIT_OAUTH_COOKIE_SECRET || process.env.JWT_SECRET
  if (secret) {
    if (secret.length < 32) throw new FaceitOAuthError('O segredo da autenticação FACEIT é inválido.', 503)
    return secret
  }
  if (process.env.NODE_ENV === 'production') {
    throw new FaceitOAuthError('A autenticação FACEIT ainda não está configurada.', 503)
  }
  ownershipGlobal.aceDevFaceitCookieSecret ||= randomBytes(32).toString('hex')
  return ownershipGlobal.aceDevFaceitCookieSecret
}

function getOAuthConfig(): FaceitOAuthConfig {
  const clientId = process.env.FACEIT_OAUTH_CLIENT_ID?.trim()
  const clientSecret = process.env.FACEIT_OAUTH_CLIENT_SECRET?.trim()
  const redirectUri = process.env.FACEIT_OAUTH_REDIRECT_URI?.trim()
  if (!clientId || !clientSecret || !redirectUri) {
    throw new FaceitOAuthError('A autenticação FACEIT ainda não está configurada.', 503)
  }

  let parsedRedirect: URL
  try {
    parsedRedirect = new URL(redirectUri)
  } catch {
    throw new FaceitOAuthError('A URL de retorno da FACEIT é inválida.', 503)
  }
  if (parsedRedirect.pathname !== '/api/faceit/ownership/callback' ||
      (process.env.NODE_ENV === 'production' && parsedRedirect.protocol !== 'https:')) {
    throw new FaceitOAuthError('A URL de retorno da FACEIT é inválida.', 503)
  }

  return { clientId, clientSecret, redirectUri: parsedRedirect.toString() }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function signPayload(payload: OAuthStatePayload | FaceitOwnershipProof, expiresIn: number) {
  return jwt.sign(payload, getCookieSecret(), {
    algorithm: 'HS256',
    audience: 'ace-faceit-registration',
    issuer: 'ace-produtora',
    expiresIn,
  })
}

function verifyPayload(token: string) {
  return jwt.verify(token, getCookieSecret(), {
    algorithms: ['HS256'],
    audience: 'ace-faceit-registration',
    issuer: 'ace-produtora',
  }) as jwt.JwtPayload & {
    kind?: unknown
    state?: unknown
    verifier?: unknown
    teamId?: unknown
    playerId?: unknown
  }
}

export function getFaceitOAuthCookieNames() {
  const prefix = process.env.NODE_ENV === 'production' ? '__Host-' : ''
  return {
    state: `${prefix}ace-faceit-oauth-state`,
    ownership: `${prefix}ace-faceit-ownership`,
  }
}

export function getFaceitCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

export function createFaceitAuthorization(teamId: string) {
  const config = getOAuthConfig()
  const state = randomBytes(32).toString('base64url')
  const verifier = randomBytes(48).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const stateToken = signPayload({ kind: 'faceit-oauth-state', state, verifier, teamId: teamId.toLowerCase() }, STATE_TTL_SECONDS)
  const authorizationUrl = new URL(AUTHORIZATION_ENDPOINT)
  authorizationUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'openid profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString()

  return { authorizationUrl: authorizationUrl.toString(), stateToken }
}

export function verifyFaceitOAuthState(token: string, returnedState: string): OAuthStatePayload | null {
  try {
    const payload = verifyPayload(token)
    if (payload.kind !== 'faceit-oauth-state' || typeof payload.state !== 'string' ||
        typeof payload.verifier !== 'string' || typeof payload.teamId !== 'string' ||
        !safeEqual(payload.state, returnedState)) return null
    return {
      kind: 'faceit-oauth-state',
      state: payload.state,
      verifier: payload.verifier,
      teamId: payload.teamId,
    }
  } catch {
    return null
  }
}

export async function exchangeFaceitAuthorizationCode(code: string, verifier: string) {
  const config = getOAuthConfig()
  let tokenResponse: Response
  try {
    tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        code_verifier: verifier,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    })
  } catch {
    throw new FaceitOAuthError('A FACEIT não respondeu à autenticação. Tente novamente.', 503)
  }
  if (!tokenResponse.ok) throw new FaceitOAuthError('A FACEIT recusou a autenticação.', 401)

  const tokenData = await tokenResponse.json().catch(() => null) as { access_token?: unknown } | null
  if (!tokenData || typeof tokenData.access_token !== 'string' || !tokenData.access_token) {
    throw new FaceitOAuthError('A FACEIT retornou uma autenticação inválida.')
  }

  let userResponse: Response
  try {
    userResponse = await fetch(USERINFO_ENDPOINT, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${tokenData.access_token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    })
  } catch {
    throw new FaceitOAuthError('A FACEIT não respondeu à consulta do usuário. Tente novamente.', 503)
  }
  if (!userResponse.ok) throw new FaceitOAuthError('Não foi possível confirmar o usuário FACEIT.', 401)

  const userData = await userResponse.json().catch(() => null) as { sub?: unknown } | null
  if (!userData || typeof userData.sub !== 'string' || !userData.sub || userData.sub.length > 200) {
    throw new FaceitOAuthError('A FACEIT retornou um usuário inválido.')
  }
  return userData.sub.toLowerCase()
}

export function createFaceitOwnershipProof(teamId: string, playerId: string) {
  return signPayload({
    kind: 'faceit-team-ownership',
    teamId: teamId.toLowerCase(),
    playerId: playerId.toLowerCase(),
  }, PROOF_TTL_SECONDS)
}

export function verifyFaceitOwnershipProof(token: string): FaceitOwnershipProof | null {
  try {
    const payload = verifyPayload(token)
    if (payload.kind !== 'faceit-team-ownership' || typeof payload.teamId !== 'string' ||
        typeof payload.playerId !== 'string') return null
    return {
      kind: 'faceit-team-ownership',
      teamId: payload.teamId.toLowerCase(),
      playerId: payload.playerId.toLowerCase(),
    }
  } catch {
    return null
  }
}

export function getRegistrationReturnUrl(error?: string) {
  const redirectUri = new URL(getOAuthConfig().redirectUri)
  const returnUrl = new URL('/inscreva-se', redirectUri.origin)
  if (error) returnUrl.searchParams.set('faceit_error', error)
  return returnUrl
}

export const FACEIT_OAUTH_STATE_TTL_SECONDS = STATE_TTL_SECONDS
export const FACEIT_OWNERSHIP_TTL_SECONDS = PROOF_TTL_SECONDS
