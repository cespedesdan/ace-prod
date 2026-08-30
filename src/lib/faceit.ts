const FACEIT_API_URL = 'https://open.faceit.com/data/v4'
const TEAM_ID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const MAX_CHAMPIONSHIP_ITEMS = 1000

type FaceitMemberResponse = {
  user_id?: unknown
  nickname?: unknown
  avatar?: unknown
  country?: unknown
  skill_level?: unknown
  membership_type?: unknown
  faceit_url?: unknown
}

type FaceitTeamResponse = {
  team_id?: unknown
  name?: unknown
  nickname?: unknown
  avatar?: unknown
  faceit_url?: unknown
  leader?: unknown
  members?: unknown
}

export class FaceitApiError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message)
    this.name = 'FaceitApiError'
  }
}

export type FaceitTeamSnapshot = {
  teamId: string
  name: string
  nickname: string | null
  avatarUrl: string | null
  faceitUrl: string
  members: Array<{
    playerId: string
    nickname: string
    avatarUrl: string | null
    country: string | null
    skillLevel: number | null
    membershipType: string | null
    isLeader: boolean
    faceitUrl: string | null
  }>
}

export type FaceitChampionshipSnapshot = {
  championshipId: string
  name: string
  faceitUrl: string
  status: string | null
  gameId: string | null
  format: string | null
  seedingStrategy: string | null
  totalRounds: number | null
  startsAt: number | null
  teams: Array<{
    teamId: string
    name: string
    nickname: string | null
    avatarUrl: string | null
    faceitUrl: string | null
    status: string | null
    group: number | null
    leaderPlayerId: string | null
    coachPlayerId: string | null
    rosterPlayerIds: string[]
    substitutePlayerIds: string[]
  }>
  matches: Array<{
    matchId: string
    round: number | null
    group: number | null
    bestOf: number | null
    scheduledAt: number | null
    status: string | null
    faceitUrl: string | null
    winner: string | null
    scores: Record<string, number>
    teams: Array<{ faction: string; teamId: string; name: string; avatarUrl: string | null }>
  }>
  results: Array<{
    left: number | null
    right: number | null
    placements: Array<{ id: string; name: string; type: string | null }>
  }>
}

export type FaceitSwissStanding = {
  teamId: string
  name: string
  played: number
  wins: number
  losses: number
  scoreBalance: number
  status: 'Classificado' | 'Eliminado' | 'Em disputa'
}

export function buildFaceitSwissStandings(
  teams: FaceitChampionshipSnapshot['teams'],
  matches: FaceitChampionshipSnapshot['matches'],
) {
  const standings = new Map<string, Omit<FaceitSwissStanding, 'status'>>()

  const standingFor = (team: { teamId: string; name: string }) => {
    const current = standings.get(team.teamId)
    if (current) return current
    const created = { teamId: team.teamId, name: team.name, played: 0, wins: 0, losses: 0, scoreBalance: 0 }
    standings.set(team.teamId, created)
    return created
  }

  teams.forEach(standingFor)
  for (const match of matches) {
    const winner = match.teams.find((team) => match.winner === team.faction || match.winner === team.teamId)
    if (!winner) continue

    for (const team of match.teams) {
      const standing = standingFor(team)
      const score = match.scores[team.faction] ?? match.scores[team.teamId] ?? 0
      const opponentScore = match.teams
        .filter((opponent) => opponent.teamId !== team.teamId)
        .reduce((total, opponent) => total + (match.scores[opponent.faction] ?? match.scores[opponent.teamId] ?? 0), 0)
      standing.played += 1
      standing.scoreBalance += score - opponentScore
      if (team.teamId === winner.teamId) standing.wins += 1
      else standing.losses += 1
    }
  }

  return [...standings.values()]
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses || b.scoreBalance - a.scoreBalance || a.name.localeCompare(b.name, 'pt-BR'))
    .map((standing): FaceitSwissStanding => ({
      ...standing,
      status: standing.wins >= 3 ? 'Classificado' : standing.losses >= 3 ? 'Eliminado' : 'Em disputa',
    }))
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function localizedFaceitUrl(value: unknown) {
  const rawUrl = optionalString(value)?.replace('{lang}', 'pt')
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    return url.protocol === 'https:' && hostname === 'faceit.com' ? url.toString() : null
  } catch {
    return null
  }
}

function optionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function faceitTimestampMs(value: unknown) {
  const timestamp = optionalNumber(value)
  if (!timestamp || timestamp < 0) return null
  const milliseconds = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp
  const year = new Date(milliseconds).getUTCFullYear()
  return year >= 2010 && year <= 2100 ? milliseconds : null
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function uniqueBy<T>(items: T[], keyFor: (item: T) => string) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keyFor(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function faceitRequest(path: string, notFoundMessage: string) {
  const apiKey = process.env.FACEIT_API_KEY
  if (!apiKey) throw new FaceitApiError('A integração com a FACEIT ainda não está configurada.', 503)

  let response: Response
  try {
    response = await fetch(`${FACEIT_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    })
  } catch {
    throw new FaceitApiError('A FACEIT não respondeu. Tente novamente em alguns instantes.', 503)
  }

  if (response.status === 404) throw new FaceitApiError(notFoundMessage, 404)
  if (response.status === 429) throw new FaceitApiError('A FACEIT recebeu muitas consultas. Tente novamente mais tarde.', 429)
  if (!response.ok) throw new FaceitApiError('Não foi possível consultar a FACEIT.', 502)

  const data = await response.json().catch(() => null)
  if (!data || typeof data !== 'object') throw new FaceitApiError('A FACEIT retornou dados inválidos.', 502)
  return data as Record<string, unknown>
}

export function parseFaceitTeamId(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new FaceitApiError('Informe um link válido do time na FACEIT.', 400)
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  const segments = url.pathname.split('/').filter(Boolean)
  const teamsIndex = segments.findIndex((segment) => segment.toLowerCase() === 'teams')
  const teamId = teamsIndex >= 0 ? segments[teamsIndex + 1] : null

  if (url.protocol !== 'https:' || hostname !== 'faceit.com' || !teamId || !TEAM_ID_PATTERN.test(teamId)) {
    throw new FaceitApiError('Informe um link válido do time na FACEIT.', 400)
  }
  return teamId.toLowerCase()
}

export async function getFaceitTeam(value: string): Promise<FaceitTeamSnapshot> {
  const teamId = parseFaceitTeamId(value)
  const team = await faceitRequest(`/teams/${encodeURIComponent(teamId)}`, 'Time não encontrado na FACEIT.') as FaceitTeamResponse
  const returnedTeamId = optionalString(team?.team_id)
  const name = optionalString(team?.name)
  if (!team || !returnedTeamId || returnedTeamId.toLowerCase() !== teamId || !name || !Array.isArray(team.members)) {
    throw new FaceitApiError('A FACEIT retornou dados inválidos para este time.', 502)
  }

  const leader = optionalString(team.leader)
  const members = team.members.flatMap((rawMember) => {
    const member = rawMember as FaceitMemberResponse
    const playerId = optionalString(member.user_id)
    const nickname = optionalString(member.nickname)
    if (!playerId || !nickname) return []
    return [{
      playerId,
      nickname,
      avatarUrl: optionalString(member.avatar),
      country: optionalString(member.country),
      skillLevel: typeof member.skill_level === 'number' ? member.skill_level : null,
      membershipType: optionalString(member.membership_type),
      isLeader: playerId === leader,
      faceitUrl: localizedFaceitUrl(member.faceit_url),
    }]
  })

  return {
    teamId,
    name,
    nickname: optionalString(team.nickname),
    avatarUrl: optionalString(team.avatar),
    faceitUrl: localizedFaceitUrl(team.faceit_url) || `https://www.faceit.com/pt/teams/${teamId}`,
    members,
  }
}

export function parseFaceitChampionshipId(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new FaceitApiError('Informe um link válido do campeonato na FACEIT.', 400)
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  const segments = url.pathname.split('/').filter(Boolean)
  const index = segments.findIndex((segment) => segment.toLowerCase() === 'championship')
  const championshipId = index >= 0 ? segments[index + 1] : null
  if (url.protocol !== 'https:' || hostname !== 'faceit.com' || !championshipId || !TEAM_ID_PATTERN.test(championshipId)) {
    throw new FaceitApiError('Informe um link válido do campeonato na FACEIT.', 400)
  }
  return championshipId.toLowerCase()
}

async function getChampionshipItems(path: string, limit: 10 | 100, notFoundMessage: string) {
  const items: unknown[] = []
  for (let offset = 0; offset <= MAX_CHAMPIONSHIP_ITEMS; offset += limit) {
    const separator = path.includes('?') ? '&' : '?'
    const page = await faceitRequest(`${path}${separator}offset=${offset}&limit=${limit}`, notFoundMessage)
    if (!Array.isArray(page.items)) {
      throw new FaceitApiError('A FACEIT retornou dados inválidos para este campeonato.', 502)
    }
    const pageItems = page.items
    if (items.length + pageItems.length > MAX_CHAMPIONSHIP_ITEMS) {
      throw new FaceitApiError('O campeonato excedeu o limite seguro de itens para sincronização.', 502)
    }
    items.push(...pageItems)
    if (pageItems.length < limit) return items
  }
  throw new FaceitApiError('O campeonato excedeu o limite seguro de itens para sincronização.', 502)
}

export async function getFaceitChampionship(value: string): Promise<FaceitChampionshipSnapshot> {
  const championshipId = parseFaceitChampionshipId(value)
  const encodedId = encodeURIComponent(championshipId)
  const [details, matchItems, resultItems, subscriptions] = await Promise.all([
    faceitRequest(`/championships/${encodedId}`, 'Campeonato não encontrado na FACEIT.'),
    getChampionshipItems(`/championships/${encodedId}/matches?type=all`, 100, 'Campeonato não encontrado na FACEIT.'),
    getChampionshipItems(`/championships/${encodedId}/results`, 100, 'Campeonato não encontrado na FACEIT.'),
    getChampionshipItems(`/championships/${encodedId}/subscriptions`, 10, 'Campeonato não encontrado na FACEIT.'),
  ])

  const returnedId = optionalString(details.championship_id) || optionalString(details.id)
  const name = optionalString(details.name)
  if (!returnedId || returnedId.toLowerCase() !== championshipId || !name) {
    throw new FaceitApiError('A FACEIT retornou dados inválidos para este campeonato.', 502)
  }

  const teams = uniqueBy(subscriptions.map((rawSubscription) => {
    const subscription = record(rawSubscription)
    const team = record(subscription.team)
    const teamId = optionalString(team.team_id)
    const teamName = optionalString(team.name)
    if (!teamId || !teamName) {
      throw new FaceitApiError('A FACEIT retornou dados inválidos para os times deste campeonato.', 502)
    }
    return {
      teamId,
      name: teamName,
      nickname: optionalString(team.nickname),
      avatarUrl: optionalString(team.avatar),
      faceitUrl: localizedFaceitUrl(team.faceit_url),
      status: optionalString(subscription.status),
      group: optionalNumber(subscription.group),
      leaderPlayerId: optionalString(subscription.leader),
      coachPlayerId: optionalString(subscription.coach),
      rosterPlayerIds: Array.isArray(subscription.roster) ? subscription.roster.flatMap((id) => optionalString(id) || []) : [],
      substitutePlayerIds: Array.isArray(subscription.substitutes) ? subscription.substitutes.flatMap((id) => optionalString(id) || []) : [],
    }
  }), (team) => team.teamId)

  const matches = uniqueBy(matchItems.map((rawMatch) => {
    const match = record(rawMatch)
    const matchId = optionalString(match.match_id)
    if (!matchId) {
      throw new FaceitApiError('A FACEIT retornou dados inválidos para as partidas deste campeonato.', 502)
    }
    const results = record(match.results)
    const score = record(results.score)
    const scores = Object.fromEntries(Object.entries(score).flatMap(([teamId, value]) => {
      const number = optionalNumber(value)
      return number === null ? [] : [[teamId, number]]
    }))
    const matchTeams = Object.entries(record(match.teams)).flatMap(([faction, rawTeam]) => {
      const team = record(rawTeam)
      const teamId = optionalString(team.faction_id) || optionalString(team.team_id)
      const teamName = optionalString(team.name) || optionalString(team.nickname)
      return teamId && teamName ? [{ faction, teamId, name: teamName, avatarUrl: optionalString(team.avatar) }] : []
    })
    return {
      matchId,
      round: optionalNumber(match.round),
      group: optionalNumber(match.group),
      bestOf: optionalNumber(match.best_of),
      scheduledAt: faceitTimestampMs(match.scheduled_at),
      status: optionalString(match.status),
      faceitUrl: localizedFaceitUrl(match.faceit_url),
      winner: optionalString(results.winner),
      scores,
      teams: matchTeams,
    }
  }), (match) => match.matchId)
    .sort((a, b) => (a.round ?? 0) - (b.round ?? 0) || (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0))

  const championshipResults = resultItems.map((rawResult) => {
    const result = record(rawResult)
    const bounds = record(result.bounds)
    const placements = (Array.isArray(result.placements) ? result.placements : []).flatMap((rawPlacement) => {
      const placement = record(rawPlacement)
      const id = optionalString(placement.id)
      const placementName = optionalString(placement.name)
      return id && placementName ? [{ id, name: placementName, type: optionalString(placement.type) }] : []
    })
    return { left: optionalNumber(bounds.left), right: optionalNumber(bounds.right), placements }
  })

  return {
    championshipId,
    name,
    faceitUrl: localizedFaceitUrl(details.faceit_url) || `https://www.faceit.com/pt/championship/${championshipId}`,
    status: optionalString(details.status),
    gameId: optionalString(details.game_id),
    format: optionalString(details.type),
    seedingStrategy: optionalString(details.seeding_strategy),
    totalRounds: optionalNumber(details.total_rounds),
    startsAt: faceitTimestampMs(details.championship_start),
    teams,
    matches,
    results: championshipResults,
  }
}
