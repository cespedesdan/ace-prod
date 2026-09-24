import type { ArchiveRound, ArchiveTeam } from '@/data/tournamentArchives'
import type { FaceitChampionshipSnapshot } from '@/lib/faceit'

type Match = FaceitChampionshipSnapshot['matches'][number]

export function storedFaceitMatches(value: string): Match[] {
  try {
    const matches: unknown = JSON.parse(value)
    return Array.isArray(matches) ? matches as Match[] : []
  } catch {
    return []
  }
}

function bracketTeam(team?: Match['teams'][number]): ArchiveTeam {
  const name = team?.name || 'A definir'
  return { name, shortName: name.slice(0, 3).toUpperCase(), logo: team?.avatarUrl || undefined }
}

function score(match: Match, team?: Match['teams'][number]) {
  return team ? match.scores[team.faction] ?? match.scores[team.teamId] ?? null : null
}

export function faceitBracketRounds(matches: Match[]): ArchiveRound[] {
  const roundNumbers = [...new Set(matches.map((match) => match.round))]
    .sort((a, b) => (a ?? Number.MAX_SAFE_INTEGER) - (b ?? Number.MAX_SAFE_INTEGER))
  const multipleGroups = new Set(matches.map((match) => match.group).filter((group) => group !== null)).size > 1

  return roundNumbers.map((round) => ({
    name: round && round > 0 ? `Rodada ${round}` : 'Rodada a definir',
    matches: matches.filter((match) => match.round === round).map((match) => {
      const [teamA, teamB] = match.teams
      const date = match.scheduledAt
        ? new Date(match.scheduledAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : 'Horário a definir'
      return {
        label: `${multipleGroups && match.group !== null ? `Grupo ${match.group} · ` : ''}${date}`,
        teamA: bracketTeam(teamA),
        teamB: bracketTeam(teamB),
        scoreA: score(match, teamA),
        scoreB: score(match, teamB),
        bestOf: match.bestOf === 1 || match.bestOf === 3 ? match.bestOf : undefined,
        href: match.faceitUrl || undefined,
      }
    }),
  }))
}
