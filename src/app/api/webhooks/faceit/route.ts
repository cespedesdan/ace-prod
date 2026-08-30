import { NextRequest, NextResponse } from 'next/server'
import {
  FACEIT_WEBHOOK_MAX_BODY_BYTES,
  isFaceitWebhookSecretValid,
  parseFaceitWebhookWakeSignal,
  wakeFaceitChampionshipForWebhook,
} from '@/lib/faceit-webhook'
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/request-body'

export const runtime = 'nodejs'

const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

function emptyResponse(status: number) {
  return new NextResponse(null, { status, headers: RESPONSE_HEADERS })
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.FACEIT_WEBHOOK_SECRET
  if (!isFaceitWebhookSecretValid(configuredSecret, configuredSecret)) return emptyResponse(503)
  if (!isFaceitWebhookSecretValid(request.headers.get('x-faceit-webhook-secret'), configuredSecret)) {
    return emptyResponse(401)
  }

  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'application/json') return emptyResponse(415)

  try {
    const payload = await readJsonWithLimit<unknown>(request, FACEIT_WEBHOOK_MAX_BODY_BYTES)
    const signal = parseFaceitWebhookWakeSignal(payload)
    if (!signal) return emptyResponse(204)
    if (!signal.entityId) {
      console.warn('FACEIT webhook ignored: no championship identifier', { event: signal.event })
      return emptyResponse(204)
    }

    const wake = await wakeFaceitChampionshipForWebhook({
      championshipId: signal.entityId,
      event: signal.event,
    })
    return emptyResponse(wake.matched ? 202 : 204)
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return emptyResponse(413)
    if (error instanceof SyntaxError) return emptyResponse(400)
    console.error('FACEIT webhook wake-up failed')
    return emptyResponse(500)
  }
}
