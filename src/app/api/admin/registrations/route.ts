import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { privateJson } from '@/lib/private-response'

function isAdmin(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN'
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return privateJson({ error: 'Acesso negado' }, { status: 401 })
  }

  const registrations = await prisma.registration.findMany({
    orderBy: { createdAt: 'desc' },
    include: { players: { orderBy: { nickname: 'asc' } } },
  })

  return privateJson({
    registrations: registrations.map((registration) => ({
      ...registration,
      logoPath: undefined,
      paymentProofPath: undefined,
      logoDownloadUrl: `/api/admin/registrations/${registration.id}/files/logo`,
      paymentDownloadUrl: `/api/admin/registrations/${registration.id}/files/payment`,
    })),
  })
}
