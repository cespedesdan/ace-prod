import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { adminCookieName } from '@/lib/admin-request'
import { prisma } from '@/lib/prisma'

function isAdmin(request: NextRequest) {
  const token = request.cookies.get(adminCookieName())?.value
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN'
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })
  }

  const registrations = await prisma.registration.findMany({
    orderBy: { createdAt: 'desc' },
    include: { players: { orderBy: { nickname: 'asc' } } },
  })

  return NextResponse.json({
    registrations: registrations.map((registration) => ({
      ...registration,
      logoPath: undefined,
      paymentProofPath: undefined,
      logoDownloadUrl: `/api/admin/registrations/${registration.id}/files/logo`,
      paymentDownloadUrl: `/api/admin/registrations/${registration.id}/files/payment`,
    })),
  })
}
