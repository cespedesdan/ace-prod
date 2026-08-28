import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { adminCookieName } from '@/lib/admin-request'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(adminCookieName())?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Token não encontrado' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, user: payload })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
