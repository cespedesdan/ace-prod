import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { adminCookieName, requireSameOrigin } from '@/lib/admin-request'
import { prisma } from '@/lib/prisma'
import { registrationClaimKeys } from '@/lib/registration-claim'
import { tournamentPublicPath } from '@/lib/tournaments'

const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const
type AllowedStatus = (typeof allowedStatuses)[number]

function isAdmin(request: NextRequest) {
  const token = request.cookies.get(adminCookieName())?.value
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN'
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const invalidOrigin = requireSameOrigin(request)
  if (invalidOrigin) return invalidOrigin

  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })
  }

  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null
  if (!body || typeof body.status !== 'string' || !allowedStatuses.includes(body.status as AllowedStatus)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const status = body.status as AllowedStatus
  let result
  try {
    result = await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          tournament: true,
          faceitTeamId: true,
          teamNameNormalized: true,
        },
      })
      if (!registration) return null
      const tournament = await tx.tournament.findUnique({
        where: { name: registration.tournament },
        select: { name: true, slug: true, teamLimit: true },
      })
      const teamLimit = tournament?.teamLimit || 16

      if (status === 'APPROVED' && registration.status !== 'APPROVED') {
        const approvedCount = await tx.registration.count({
          where: { tournament: registration.tournament, status: 'APPROVED' },
        })
        if (approvedCount >= teamLimit) return { full: true as const, tournament: registration.tournament, teamLimit }
      }

      const activeClaims = status === 'REJECTED'
        ? { claimKey: null, teamNameClaimKey: null }
        : registrationClaimKeys(
            registration.tournament,
            registration.faceitTeamId,
            registration.teamNameNormalized,
          )

      const updated = await tx.registration.update({
        where: { id },
        data: {
          status,
          ...activeClaims,
        },
        select: { id: true, status: true, updatedAt: true },
      })
      return { full: false as const, registration: updated, slug: tournament?.slug }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma inscrição ativa para esta equipe.' }, { status: 409 })
    }
    throw error
  }

  if (!result) {
    return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 })
  }
  if (result.full) {
    return NextResponse.json({ error: `As ${result.teamLimit} vagas de ${result.tournament} já estão preenchidas.` }, { status: 409 })
  }

  if (result.slug) revalidatePath(tournamentPublicPath(result.slug))
  revalidatePath('/hall-of-fame')

  return NextResponse.json({ success: true, registration: result.registration })
}
