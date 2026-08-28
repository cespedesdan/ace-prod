import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { FaceitApiError, getFaceitTeam } from '@/lib/faceit'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { registrationClaimKeys } from '@/lib/registration-claim'

function isAdmin(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN'
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })
  }

  const { id } = await context.params
  const registration = await prisma.registration.findFirst({
    where: { id, tournament: 'Copa Ace 10' },
    select: {
      id: true,
      status: true,
      tournament: true,
      teamFaceitUrl: true,
      faceitTeamId: true,
      teamNameNormalized: true,
    },
  })
  if (!registration) {
    return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 })
  }

  try {
    const team = await getFaceitTeam(registration.teamFaceitUrl)
    if (registration.faceitTeamId && registration.faceitTeamId !== team.teamId) {
      return NextResponse.json({ error: 'O link agora aponta para outro time da FACEIT.' }, { status: 409 })
    }

    const syncedAt = new Date()
    const activeClaims = registration.status === 'REJECTED'
      ? { claimKey: null, teamNameClaimKey: null }
      : registrationClaimKeys(registration.tournament, team.teamId, registration.teamNameNormalized)
    const updated = await prisma.$transaction(async (tx) => {
      await tx.registrationPlayer.deleteMany({ where: { registrationId: id } })
      return tx.registration.update({
        where: { id },
        data: {
          teamFaceitUrl: team.faceitUrl,
          faceitTeamId: team.teamId,
          faceitTeamNickname: team.nickname,
          faceitTeamAvatarUrl: team.avatarUrl,
          faceitLastSyncedAt: syncedAt,
          ...activeClaims,
          players: {
            create: team.members.map((member) => ({
              faceitPlayerId: member.playerId,
              nickname: member.nickname,
              avatarUrl: member.avatarUrl,
              country: member.country,
              skillLevel: member.skillLevel,
              membershipType: member.membershipType,
              isLeader: member.isLeader,
              faceitUrl: member.faceitUrl,
              syncedAt,
            })),
          },
        },
        select: {
          faceitLastSyncedAt: true,
          players: { orderBy: { nickname: 'asc' } },
        },
      })
    })

    return NextResponse.json({ success: true, registration: updated })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma inscrição ativa para esta equipe.' }, { status: 409 })
    }
    if (error instanceof FaceitApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('FACEIT sync error:', error)
    return NextResponse.json({ error: 'Não foi possível sincronizar os players.' }, { status: 500 })
  }
}
