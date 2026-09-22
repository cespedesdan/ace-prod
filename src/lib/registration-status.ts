import { prisma } from '@/lib/prisma'

export function getOpenRegistrationTournament() {
  return prisma.tournament.findFirst({
    where: { registrationOpen: true, published: true, status: { not: 'COMPLETED' } },
    orderBy: { startDate: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      description: true,
      format: true,
      teamLimit: true,
      prizePoolCents: true,
      startDate: true,
      endDate: true,
    },
  })
}
