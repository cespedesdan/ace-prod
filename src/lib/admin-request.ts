import { NextRequest, NextResponse } from 'next/server'

export function adminCookieName(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === 'production' ? '__Host-admin-token' : 'admin-token'
}

function requestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')

  if (!forwardedProto && !forwardedHost) return request.nextUrl.origin
  if (!forwardedProto || !forwardedHost || forwardedProto.includes(',') || forwardedHost.includes(',')) {
    return null
  }

  const protocol = forwardedProto.trim().toLowerCase()
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

export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return NextResponse.json({ error: 'Origem da requisição inválida' }, { status: 403 })

  try {
    const expectedOrigin = requestOrigin(request)
    if (expectedOrigin && new URL(origin).origin === expectedOrigin) return null
  } catch {
    return NextResponse.json({ error: 'Origem da requisição inválida' }, { status: 403 })
  }
  return NextResponse.json({ error: 'Origem da requisição inválida' }, { status: 403 })
}
