import type { Prisma } from '@prisma/client'

export function registrationClaimKeys(tournament: string, faceitTeamId: string | null, teamNameNormalized: string) {
  const normalizedTournament = tournament.trim().toLocaleLowerCase('pt-BR')
  const normalizedTeamName = teamNameNormalized.trim().toLocaleLowerCase('pt-BR')
  const faceitIdentity =
    faceitTeamId?.trim().toLowerCase() ||
    (normalizedTeamName ? `name:${normalizedTeamName}` : '')

  if (!normalizedTournament || !normalizedTeamName || !faceitIdentity) {
    throw new Error('A tournament and team identity are required to create a registration claim.')
  }

  return {
    claimKey: `${normalizedTournament}:${faceitIdentity}`,
    teamNameClaimKey: `${normalizedTournament}:name:${normalizedTeamName}`,
  }
}

export async function renameTournamentRegistrations(tx: Prisma.TransactionClient, oldName: string, newName: string) {
  const registrations = await tx.registration.findMany({ where: { tournament: oldName } })
  for (const registration of registrations) {
    await tx.registration.update({
      where: { id: registration.id },
      data: {
        tournament: newName,
        updatedAt: registration.updatedAt,
        ...(registration.status === 'REJECTED'
          ? { claimKey: null, teamNameClaimKey: null }
          : registrationClaimKeys(newName, registration.faceitTeamId, registration.teamNameNormalized)),
      },
    })
  }
}
