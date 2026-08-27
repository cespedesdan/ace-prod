import { NextRequest, NextResponse } from 'next/server'

export function adminCookieName(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === 'production' ? '__Host-admin-token' : 'admin-token'
}

export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return NextResponse.json({ error: 'Origem da requisição inválida' }, { status: 403 })

  try {
    if (new URL(origin).origin === request.nextUrl.origin) return null
  } catch {
    return NextResponse.json({ error: 'Origem da requisição inválida' }, { status: 403 })
  }
  return NextResponse.json({ error: 'Origem da requisição inválida' }, { status: 403 })
}
