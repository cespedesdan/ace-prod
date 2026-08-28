import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken } from '@/lib/auth'
import {
  ADMIN_LOGIN_ACCOUNT_RATE_LIMIT,
  ADMIN_LOGIN_SOURCE_RATE_LIMIT,
  adminLoginRateLimitIdentifiers,
} from '@/lib/admin-login-rate-limit'
import { consumeRateLimit, getClientIp, resetRateLimit } from '@/lib/rate-limit'
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/request-body'

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: 'Muitas tentativas. Tente novamente mais tarde.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  )
}

export async function POST(request: NextRequest) {
  try {
    let body: { email?: unknown; password?: unknown } | null = null
    try {
      body = await readJsonWithLimit(request, 4096)
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: 'Requisição inválida' }, { status: 413 })
      }
    }
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const ip = getClientIp(request)
    const { emailKey, credentialKey } = adminLoginRateLimitIdentifiers(email, ip)

    const [ipLimit, credentialLimit, accountLimit] = await Promise.all([
      ip
        ? consumeRateLimit({ scope: 'admin-login-ip', identifier: ip, ...ADMIN_LOGIN_SOURCE_RATE_LIMIT })
        : Promise.resolve({ allowed: true, remaining: ADMIN_LOGIN_SOURCE_RATE_LIMIT.limit, retryAfterSeconds: 0 }),
      consumeRateLimit({
        scope: 'admin-login-credential',
        identifier: credentialKey,
        ...ADMIN_LOGIN_SOURCE_RATE_LIMIT,
      }),
      consumeRateLimit({
        scope: 'admin-login-account',
        identifier: emailKey,
        ...ADMIN_LOGIN_ACCOUNT_RATE_LIMIT,
      }),
    ])
    if (!ipLimit.allowed || !credentialLimit.allowed || !accountLimit.allowed) {
      return rateLimitResponse(Math.max(
        ipLimit.retryAfterSeconds,
        credentialLimit.retryAfterSeconds,
        accountLimit.retryAfterSeconds,
      ))
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !password || password.length > 200) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const token = generateToken(user)
    await Promise.all([
      ...(ip ? [resetRateLimit('admin-login-ip', ip)] : []),
      resetRateLimit('admin-login-credential', credentialKey),
      resetRateLimit('admin-login-account', emailKey),
    ])

    const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
