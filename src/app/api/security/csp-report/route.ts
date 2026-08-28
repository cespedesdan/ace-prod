import { NextRequest, NextResponse } from 'next/server'
import {
  CSP_REPORT_MAX_BODY_BYTES,
  CSP_REPORT_RATE_LIMIT,
  cspReportOrigin,
  isSupportedCspReportContentType,
  sanitizeCspReports,
} from '@/lib/csp-report'
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit'
import { readRequestBody, RequestBodyTooLargeError } from '@/lib/request-body'

export const runtime = 'nodejs'

const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

function emptyResponse(status: number, headers: Record<string, string> = {}) {
  return new NextResponse(null, { status, headers: { ...RESPONSE_HEADERS, ...headers } })
}

export async function POST(request: NextRequest) {
  try {
    const reportOrigin = cspReportOrigin(request)
    if (!reportOrigin) return emptyResponse(403)
    if (!isSupportedCspReportContentType(request.headers.get('content-type'))) {
      return emptyResponse(415)
    }

    const source = getClientIp(request) || 'unresolved-source'
    const rateLimit = await consumeRateLimit({
      scope: 'csp-report-source',
      identifier: source,
      ...CSP_REPORT_RATE_LIMIT,
    })
    if (!rateLimit.allowed) {
      return emptyResponse(429, { 'Retry-After': String(rateLimit.retryAfterSeconds) })
    }

    let payload: unknown
    try {
      const body = await readRequestBody(request, CSP_REPORT_MAX_BODY_BYTES)
      payload = JSON.parse(body.toString('utf8')) as unknown
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) return emptyResponse(413)
      return emptyResponse(400)
    }

    const reports = sanitizeCspReports(payload, reportOrigin)
    if (reports.length === 0) return emptyResponse(400)

    for (const report of reports) console.info('CSP violation report', report)
    return emptyResponse(204)
  } catch (error) {
    console.error('CSP report collector error:', error)
    return emptyResponse(500)
  }
}
