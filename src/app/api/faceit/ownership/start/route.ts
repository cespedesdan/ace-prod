import { NextRequest, NextResponse } from 'next/server'
import { FaceitApiError, getFaceitTeam } from '@/lib/faceit'
import {
  createFaceitAuthorization,
  FaceitOAuthError,
  FACEIT_OAUTH_STATE_TTL_SECONDS,
  getFaceitCookieOptions,
  getFaceitOAuthCookieNames,
} from '@/lib/faceit-ownership'
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit'
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/request-body'

export const runtime = 'nodejs'

const OAUTH_RATE_LIMIT = { limit: 10, windowMs: 15 * 60_000, blockMs: 15 * 60_000 }

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    if (ip) {
      const limit = await consumeRateLimit({ scope: 'faceit-oauth-ip', identifier: ip, ...OAUTH_RATE_LIMIT })
      if (!limit.allowed) {
        return NextResponse.json(
          { error: 'Muitas tentativas de autenticação. Tente novamente mais tarde.' },
          { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
        )
      }
    }

    const body = await readJsonWithLimit<{ url?: unknown }>(request, 1024)
    if (typeof body.url !== 'string' || body.url.length > 300) {
      return NextResponse.json({ error: 'Informe o link do time na FACEIT.' }, { status: 400 })
    }

    const team = await getFaceitTeam(body.url)
    const leader = team.members.find((member) => member.isLeader)
    if (!leader) {
      return NextResponse.json({ error: 'A FACEIT não informou o líder deste time.' }, { status: 422 })
    }

    const authorization = createFaceitAuthorization(team.teamId)
    const response = NextResponse.json({ authorizationUrl: authorization.authorizationUrl })
    response.cookies.set(
      getFaceitOAuthCookieNames().state,
      authorization.stateToken,
      getFaceitCookieOptions(FACEIT_OAUTH_STATE_TTL_SECONDS),
    )
    return response
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'Consulta inválida.' }, { status: 413 })
    }
    if (error instanceof FaceitApiError || error instanceof FaceitOAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('FACEIT ownership start error:', error)
    return NextResponse.json({ error: 'Não foi possível iniciar a autenticação FACEIT.' }, { status: 500 })
  }
}
