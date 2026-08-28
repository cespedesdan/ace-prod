import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrationClaimKey } from '@/lib/registration-claim'

const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const
type AllowedStatus = (typeof allowedStatuses)[number]

function isAdmin(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN'
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })
  }

  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null
  if (!body || typeof body.status !== 'string' || !allowedStatuses.includes(body.status as AllowedStatus)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const status = body.status as AllowedStatus
  let updated
  try {
    updated = await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findFirst({
        where: { id, tournament: 'Copa Ace 10' },
        select: {
          id: true,
          status: true,
          tournament: true,
          faceitTeamId: true,
          teamNameNormalized: true,
        },
      })
      if (!registration) return null

      if (status === 'APPROVED' && registration.status !== 'APPROVED') {
        const approvedCount = await tx.registration.count({
          where: { tournament: 'Copa Ace 10', status: 'APPROVED' },
        })
        if (approvedCount >= 16) return 'full' as const
      }

      return tx.registration.update({
        where: { id },
        data: {
          status,
          claimKey: status === 'REJECTED'
            ? null
            : registrationClaimKey(
                registration.tournament,
                registration.faceitTeamId,
                registration.teamNameNormalized,
              ),
        },
        select: { id: true, status: true, updatedAt: true },
      })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma inscrição ativa para esta equipe.' }, { status: 409 })
    }
    throw error
  }

  if (!updated) {
    return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 })
  }
  if (updated === 'full') {
    return NextResponse.json({ error: 'As 16 vagas da Copa Ace 10 já estão preenchidas.' }, { status: 409 })
  }

  revalidatePath('/copa-ace-10')
  revalidatePath('/hall-of-fame/copa-ace-10')

  return NextResponse.json({ success: true, registration: updated })
}
