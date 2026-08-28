export function registrationClaimKey(tournament: string, faceitTeamId: string | null, teamNameNormalized?: string) {
  const normalizedTournament = tournament.trim().toLocaleLowerCase('pt-BR')
  const identity =
    faceitTeamId?.trim().toLowerCase() ||
    (teamNameNormalized?.trim() ? `name:${teamNameNormalized.trim().toLocaleLowerCase('pt-BR')}` : '')

  if (!normalizedTournament || !identity) {
    throw new Error('A tournament and team identity are required to create a registration claim.')
  }
  return `${normalizedTournament}:${identity}`
}
