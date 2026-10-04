import Image from 'next/image'
import { Shield, ShieldCheck, ShieldX } from 'lucide-react'
import type { CopaAce10FaceitData } from '@/components/CopaAce10Faceit'
import { faceitMatchWinnerTeamId } from '@/lib/faceit'

type Match = CopaAce10FaceitData['matches'][number]
type Team = CopaAce10FaceitData['teams'][number]
type DisplayTeam = Pick<Team, 'teamId' | 'name' | 'avatarUrl'>
type Campaign = { wins: number; losses: number }

const SWISS_ROUNDS = {
  1: ['0-0'],
  2: ['1-0', '0-1'],
  3: ['2-0', '1-1', '0-2'],
  4: ['2-1', '1-2'],
  5: ['2-2'],
} as const

type RoundNumber = keyof typeof SWISS_ROUNDS
type SwissRecord = (typeof SWISS_ROUNDS)[RoundNumber][number]

const MATCH_SLOTS: Record<SwissRecord, number> = {
  '0-0': 8,
  '1-0': 4,
  '0-1': 4,
  '2-0': 2,
  '1-1': 4,
  '0-2': 2,
  '2-1': 3,
  '1-2': 3,
  '2-2': 3,
}

const TERMINAL_RECORDS: Partial<Record<RoundNumber, { advance: string; eliminate: string }>> = {
  3: { advance: '3-0', eliminate: '0-3' },
  4: { advance: '3-1', eliminate: '1-3' },
  5: { advance: '3-2', eliminate: '2-3' },
}

function matchDate(timestamp: number | null) {
  return timestamp
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(timestamp)
    : 'Horário a definir'
}

function recordOf(campaign: Campaign) {
  return `${campaign.wins}-${campaign.losses}`
}

export function buildSwissRounds(matches: Match[], teams: Team[]) {
  const campaigns = new Map<string, Campaign>()
  const stageTeams = new Map<string, DisplayTeam>()

  for (const team of teams) {
    campaigns.set(team.teamId, { wins: 0, losses: 0 })
    stageTeams.set(team.teamId, team)
  }
  for (const match of matches) {
    for (const team of match.teams) {
      campaigns.set(team.teamId, campaigns.get(team.teamId) || { wins: 0, losses: 0 })
      stageTeams.set(team.teamId, team)
    }
  }

  const rounds = (Object.keys(SWISS_ROUNDS).map(Number) as RoundNumber[]).map((round) => {
    const records = [...SWISS_ROUNDS[round]] as SwissRecord[]
    const roundMatches = matches.filter((match) => match.round === round && match.status?.toLowerCase() !== 'cancelled')
    const matchesByRecord = new Map<SwissRecord, Match[]>(records.map((record) => [record, []]))
    const pairedTeamIds = new Set<string>()

    for (const match of roundMatches) {
      const firstTeam = match.teams[0]
      const record = firstTeam ? recordOf(campaigns.get(firstTeam.teamId) || { wins: 0, losses: 0 }) : ''
      if (!records.includes(record as SwissRecord)) continue
      matchesByRecord.get(record as SwissRecord)?.push(match)
      match.teams.forEach((team) => pairedTeamIds.add(team.teamId))
    }

    const groups = records.map((record) => ({
      record,
      matches: matchesByRecord.get(record) || [],
      waitingTeams: [...stageTeams.values()].filter((team) => !pairedTeamIds.has(team.teamId) && recordOf(campaigns.get(team.teamId) || { wins: 0, losses: 0 }) === record),
    }))

    for (const match of roundMatches) {
      const winnerId = faceitMatchWinnerTeamId(match)
      if (!winnerId) continue
      for (const team of match.teams) {
        const campaign = campaigns.get(team.teamId) || { wins: 0, losses: 0 }
        campaigns.set(team.teamId, team.teamId === winnerId
          ? { ...campaign, wins: campaign.wins + 1 }
          : { ...campaign, losses: campaign.losses + 1 })
      }
    }

    return { round, groups }
  })

  return { rounds, campaigns, teams: [...stageTeams.values()] }
}

function TeamMark({ team }: { team?: DisplayTeam }) {
  return (
    <span className="swiss-team-mark" title={team?.name}>
      {team?.avatarUrl
        ? <Image src={team.avatarUrl} alt={team.name} width={56} height={56} />
        : <Shield aria-hidden="true" />}
    </span>
  )
}

function MatchCard({ match, teamA, teamB }: { match?: Match; teamA?: DisplayTeam; teamB?: DisplayTeam }) {
  if (!match) {
    return <article className="swiss-match is-placeholder" aria-label="Confronto a definir"><TeamMark team={teamA} /><TeamMark team={teamB} /></article>
  }

  const [left, right] = match.teams
  const leftScore = left ? match.scores[left.faction] ?? match.scores[left.teamId] : undefined
  const rightScore = right ? match.scores[right.faction] ?? match.scores[right.teamId] : undefined
  const score = leftScore === undefined || rightScore === undefined ? 'VS' : `${leftScore}:${rightScore}`
  const label = `${left?.name || 'A definir'} ${score} ${right?.name || 'A definir'} · ${matchDate(match.scheduledAt)}`
  const content = <><TeamMark team={left} /><strong className="swiss-score">{score}</strong><TeamMark team={right} /></>

  return match.faceitUrl
    ? <a href={match.faceitUrl} target="_blank" rel="noreferrer" className="swiss-match" aria-label={label}>{content}</a>
    : <article className="swiss-match" aria-label={label}>{content}</article>
}

function Outcome({ record, teams, tone }: { record: string; teams: DisplayTeam[]; tone: 'advance' | 'eliminate' }) {
  const Icon = tone === 'advance' ? ShieldCheck : ShieldX
  return (
    <div className="swiss-outcome" data-tone={tone}>
      <header><Icon aria-hidden="true" /><strong>{record.replace('-', ':')}</strong></header>
      <div>{teams.length ? teams.map((team) => <TeamMark key={team.teamId} team={team} />) : <small>--</small>}</div>
    </div>
  )
}

export function CopaAce10Swiss({ matches, teams }: { matches: Match[]; teams: Team[] }) {
  const stage = buildSwissRounds(matches, teams)
  const outcomeTeams = (record: string) => stage.teams.filter((team) => recordOf(stage.campaigns.get(team.teamId) || { wins: 0, losses: 0 }) === record)

  return (
    <div className="swiss-stage">
      <header className="swiss-stage-header">
        <div><p>Sistema</p><h3>Formato suíço</h3></div>
        <strong>As melhores 8 equipes avançam</strong>
        <div className="swiss-rules"><span>3 vitórias <b>Avança</b></span><span>3 derrotas <b>Eliminado</b></span></div>
      </header>

      <div className="swiss-flow-scroll" tabIndex={0} aria-label="Chaveamento do sistema suíço; role horizontalmente para ver todas as rodadas">
        <div className="swiss-flow">
          {stage.rounds.map(({ round, groups }) => {
            const terminal = TERMINAL_RECORDS[round]
            return (
              <section key={round} className="swiss-round" aria-labelledby={`swiss-round-${round}`}>
                <h4 id={`swiss-round-${round}`} className="sr-only">Rodada {round}</h4>
                <div className="swiss-round-content">
                  {terminal && <Outcome record={terminal.advance} teams={outcomeTeams(terminal.advance)} tone="advance" />}
                  <div className="swiss-pools">
                    {groups.map((group) => (
                      <div key={group.record} className="swiss-pool">
                        <div className="swiss-pool-label">{group.record.replace('-', ':')}</div>
                        <div className="swiss-pool-matches">
                          {Array.from({ length: Math.max(MATCH_SLOTS[group.record], group.matches.length) }, (_, index) => {
                            const waitingIndex = (index - group.matches.length) * 2
                            return <MatchCard key={group.matches[index]?.matchId || `${group.record}-${index}`} match={group.matches[index]} teamA={group.waitingTeams[waitingIndex]} teamB={group.waitingTeams[waitingIndex + 1]} />
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {terminal && <Outcome record={terminal.eliminate} teams={outcomeTeams(terminal.eliminate)} tone="eliminate" />}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
