import { prisma } from '@/lib/prisma'

const tournamentSelect = {
  id: true, name: true, slug: true, logoUrl: true, description: true,
  format: true, status: true, registrationOpen: true, teamLimit: true,
  prizePoolCents: true, startDate: true, endDate: true,
} as const

export function getOpenRegistrationTournament() {
  return prisma.tournament.findFirst({
    where: { registrationOpen: true, published: true, status: { not: 'COMPLETED' } },
    orderBy: { startDate: 'asc' },
    select: tournamentSelect,
  })
}

export async function getFeaturedTournament() {
  return await getOpenRegistrationTournament()
    ?? await prisma.tournament.findFirst({
      where: { published: true, status: 'ONGOING' },
      orderBy: { startDate: 'desc' },
      select: tournamentSelect,
    })
    ?? await prisma.tournament.findFirst({
      where: { published: true },
      orderBy: { endDate: 'desc' },
      select: tournamentSelect,
    })
}
