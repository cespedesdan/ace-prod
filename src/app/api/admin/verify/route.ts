import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { privateJson } from '@/lib/private-response'
import { adminCookieName } from '@/lib/admin-request'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(adminCookieName())?.value

    if (!token) {
      return privateJson(
        { error: 'Token não encontrado' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return privateJson(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    if (payload.role !== 'ADMIN') {
      return privateJson(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    return privateJson({ success: true, user: payload })
  } catch (error) {
    console.error('Verification error:', error)
    return privateJson(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
