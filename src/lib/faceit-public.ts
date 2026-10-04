import type { ArchiveRound, ArchiveTeam } from '@/data/tournamentArchives'
import type { FaceitChampionshipSnapshot } from '@/lib/faceit'
import { faceitMatchWinnerTeamId } from '@/lib/faceit'

type Match = FaceitChampionshipSnapshot['matches'][number]

export function faceitDoubleElimination(matches: Match[]) {
  // FACEIT group 1/2 were verified against the Ace Clutch 3 winners' progression.
  const upperMatches = matches.filter((match) => match.group === 1)
  const lower = matches.filter((match) => match.group === 2)
  const teamCount = new Set(matches.flatMap((match) => match.teams.map((team) => team.teamId))).size
  const upperFinalRound = Math.ceil(Math.log2(Math.max(4, teamCount)))
  const finalist = (lane: Match[], finalRound: number) => {
    const lastMatches = lane.filter((match) => match.round === finalRound)
    return lastMatches.length === 1 ? faceitMatchWinnerTeamId(lastMatches[0]) : null
  }
  // Do not guess the final from a round/group number not yet verified by the API.
  const final = matches.filter((match) => {
    if (match.group === 2) return false
    const upperBeforeFinal = upperMatches.filter((upper) => upper.matchId !== match.matchId
      && (match.group !== 1 || (upper.round ?? 0) < (match.round ?? 0)))
    const finalists = [finalist(upperBeforeFinal, upperFinalRound), finalist(lower, 2 * (upperFinalRound - 1))]
    return finalists.every(Boolean) && new Set(finalists).size === 2
      && match.teams.length === 2 && match.teams.every((team) => finalists.includes(team.teamId))
  })
  const upper = upperMatches.filter((match) => !final.includes(match))
  const other = matches.filter((match) => match.group !== 1 && match.group !== 2 && !final.includes(match))
  return [
    { title: 'Chave superior', matches: upper },
    { title: 'Chave inferior', matches: lower },
    { title: 'Grande final', matches: final },
    ...(other.length ? [{ title: 'Outros confrontos', matches: other }] : []),
  ]
}

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
    matches: matches.filter((match) => match.round === round)
      .sort((a, b) => (a.scheduledAt ?? Number.MAX_SAFE_INTEGER) - (b.scheduledAt ?? Number.MAX_SAFE_INTEGER) || a.matchId.localeCompare(b.matchId)).map((match) => {
      const [teamA, teamB] = [...match.teams].sort((a, b) => a.faction.localeCompare(b.faction))
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
