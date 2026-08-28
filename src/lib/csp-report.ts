export const CSP_REPORT_MAX_BODY_BYTES = 16 * 1024
export const CSP_REPORT_MAX_REPORTS = 5
export const CSP_REPORT_RATE_LIMIT = {
  limit: 30,
  windowMs: 60_000,
  blockMs: 10 * 60_000,
}

export type SanitizedCspReport = {
  documentPath: string
  effectiveDirective: string
  blockedLocation: string
  sourceOrigin?: string
  disposition: 'report' | 'enforce' | 'unknown'
  statusCode?: number
  lineNumber?: number
  columnNumber?: number
}

type UnknownRecord = Record<string, unknown>

const KNOWN_DOCUMENT_PATHS = new Set([
  '/',
  '/admin',
  '/admin/faceit',
  '/admin/inscricoes',
  '/admin/live',
  '/admin/login',
  '/admin/noticias',
  '/copa-ace-10',
  '/hall-of-fame',
  '/inscreva-se',
  '/news',
  '/schedule',
])

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null
}

function readString(record: UnknownRecord, ...keys: string[]) {
  for (const key of keys) {
    if (typeof record[key] === 'string') return record[key]
  }
  return ''
}

function boundedInteger(value: unknown, maximum: number) {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= maximum
    ? Number(value)
    : undefined
}

function documentPath(value: string, expectedOrigin: string) {
  try {
    const url = new URL(value)
    if (url.origin !== expectedOrigin) return null
    if (KNOWN_DOCUMENT_PATHS.has(url.pathname)) return url.pathname
    if (/^\/hall-of-fame\/[^/]+\/?$/.test(url.pathname)) return '/hall-of-fame/:slug'
    return '/other'
  } catch {
    return null
  }
}

function effectiveDirective(value: string) {
  const normalized = value.trim().toLowerCase()
  return /^[a-z][a-z0-9-]{0,79}$/.test(normalized) ? normalized : null
}

function reportLocation(value: string, expectedOrigin: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return 'unknown'
  if (['inline', 'eval', 'self', 'data', 'blob'].includes(normalized)) return normalized

  try {
    const url = new URL(value)
    return url.origin === expectedOrigin ? 'self' : url.origin.slice(0, 256)
  } catch {
    return 'unknown'
  }
}

function reportDisposition(value: string): SanitizedCspReport['disposition'] {
  if (value === 'report' || value === 'enforce') return value
  return 'unknown'
}

function reportBodies(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload
      .slice(0, CSP_REPORT_MAX_REPORTS)
      .flatMap((report) => {
        const record = asRecord(report)
        if (!record || record.type !== 'csp-violation') return []
        const body = asRecord(record.body)
        return body ? [body] : []
      })
  }

  const record = asRecord(payload)
  const legacyBody = record ? asRecord(record['csp-report']) : null
  return legacyBody ? [legacyBody] : []
}

export function isSupportedCspReportContentType(value: string | null) {
  const contentType = value?.split(';', 1)[0]?.trim().toLowerCase()
  return contentType === 'application/csp-report' || contentType === 'application/reports+json'
}

function requestOrigin(request: Request) {
  const forwardedProtocol = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')

  if (!forwardedProtocol && !forwardedHost) return new URL(request.url).origin
  if (
    !forwardedProtocol ||
    !forwardedHost ||
    forwardedProtocol.includes(',') ||
    forwardedHost.includes(',')
  ) return null

  const protocol = forwardedProtocol.trim().toLowerCase()
  const host = forwardedHost.trim()
  if ((protocol !== 'http' && protocol !== 'https') || !host) return null

  try {
    const url = new URL(`${protocol}://${host}`)
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null
    return url.origin
  } catch {
    return null
  }
}

export function cspReportOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return null

  try {
    const parsedOrigin = new URL(origin)
    if (parsedOrigin.origin !== origin || !['http:', 'https:'].includes(parsedOrigin.protocol)) return null
  } catch {
    return null
  }

  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && fetchSite !== 'same-origin') return null

  const expectedOrigin = requestOrigin(request)
  return expectedOrigin === origin ? origin : null
}

export function sanitizeCspReports(payload: unknown, expectedOrigin: string): SanitizedCspReport[] {
  return reportBodies(payload).flatMap((body) => {
    const path = documentPath(readString(body, 'document-uri', 'documentURL'), expectedOrigin)
    const directive = effectiveDirective(readString(
      body,
      'effective-directive',
      'effectiveDirective',
      'violated-directive',
    ))
    if (!path || !directive) return []

    const source = reportLocation(readString(body, 'source-file', 'sourceFile'), expectedOrigin)
    return [{
      documentPath: path,
      effectiveDirective: directive,
      blockedLocation: reportLocation(readString(body, 'blocked-uri', 'blockedURL'), expectedOrigin),
      ...(source === 'unknown' ? {} : { sourceOrigin: source }),
      disposition: reportDisposition(readString(body, 'disposition')),
      statusCode: boundedInteger(body['status-code'] ?? body.statusCode, 599),
      lineNumber: boundedInteger(body['line-number'] ?? body.lineNumber, 1_000_000),
      columnNumber: boundedInteger(body['column-number'] ?? body.columnNumber, 1_000_000),
    }]
  })
}
