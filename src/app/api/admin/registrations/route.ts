import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { adminCookieName } from '@/lib/admin-request'
import { prisma } from '@/lib/prisma'
import { privateJson } from '@/lib/private-response'
import { tournamentPublicPath } from '@/lib/tournaments'

function isAdmin(request: NextRequest) {
  const token = request.cookies.get(adminCookieName())?.value
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN'
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return privateJson({ error: 'Acesso negado' }, { status: 401 })
  }

  const [registrations, tournaments] = await Promise.all([
    prisma.registration.findMany({
      orderBy: { createdAt: 'desc' },
      include: { players: { orderBy: { nickname: 'asc' } } },
    }),
    prisma.tournament.findMany({
      orderBy: { startDate: 'asc' },
      select: { name: true, slug: true, teamLimit: true, registrationOpen: true, published: true, status: true },
    }),
  ])
  const tournamentByName = new Map(tournaments.map((tournament) => [tournament.name, tournament]))
  const openTournamentName = tournaments.find((tournament) =>
    tournament.registrationOpen && tournament.published && tournament.status !== 'COMPLETED',
  )?.name || null

  return privateJson({
    openTournamentName,
    registrations: registrations.map((registration) => {
      const tournament = tournamentByName.get(registration.tournament)
      return {
        ...registration,
        logoPath: undefined,
        paymentProofPath: undefined,
        tournamentTeamLimit: tournament?.teamLimit || 16,
        tournamentPublicUrl: tournament ? tournamentPublicPath(tournament.slug) : null,
        logoDownloadUrl: `/api/admin/registrations/${registration.id}/files/logo`,
        paymentDownloadUrl: `/api/admin/registrations/${registration.id}/files/payment`,
      }
    }),
  })
}
