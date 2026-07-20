import { NextRequest, NextResponse } from 'next/server'
import { FaceitApiError, getFaceitTeam } from '@/lib/faceit'
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit'
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/request-body'

export const runtime = 'nodejs'

const LOOKUP_RATE_LIMIT = { limit: 20, windowMs: 15 * 60_000, blockMs: 15 * 60_000 }

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    if (ip) {
      const limit = await consumeRateLimit({ scope: 'faceit-lookup-ip', identifier: ip, ...LOOKUP_RATE_LIMIT })
      if (!limit.allowed) {
        return NextResponse.json(
          { error: 'Muitas consultas à FACEIT. Tente novamente mais tarde.' },
          { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
        )
      }
    }

    let body: { url?: unknown } | null = null
    try {
      body = await readJsonWithLimit<{ url?: unknown }>(request, 1024)
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) throw error
    }
    if (!body) return NextResponse.json({ error: 'Consulta inválida.' }, { status: 400 })
    if (typeof body.url !== 'string' || body.url.length > 300) {
      return NextResponse.json({ error: 'Informe o link do time na FACEIT.' }, { status: 400 })
    }

    return NextResponse.json({ team: await getFaceitTeam(body.url) })
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'Consulta inválida.' }, { status: 413 })
    }
    if (error instanceof FaceitApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('FACEIT lookup error:', error)
    return NextResponse.json({ error: 'Não foi possível consultar a FACEIT.' }, { status: 500 })
  }
}
