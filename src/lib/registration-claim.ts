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
