import type { CopaAce10FaceitData } from '@/components/CopaAce10Faceit'

type Match = CopaAce10FaceitData['matches'][number]
type Team = CopaAce10FaceitData['teams'][number]
type Campaign = { wins: number; losses: number }

function matchDate(timestamp: number | null) {
  return timestamp
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(timestamp)
    : 'A definir'
}

function campaignTone(campaign: Campaign) {
  if (campaign.wins >= 2) return 'advance'
  if (campaign.losses >= 2) return 'eliminate'
  return 'neutral'
}

function winnerTeamId(match: Match) {
  return match.teams.find((team) => match.winner === team.faction || match.winner === team.teamId)?.teamId || null
}

function buildSwissRounds(matches: Match[]) {
  const campaigns = new Map<string, Campaign>()
  const roundNumbers = [...new Set(matches.flatMap((match) => match.round === null ? [] : [match.round]))].sort((a, b) => a - b)

  const rounds = roundNumbers.map((round) => {
    const pools = new Map<string, { campaign: Campaign; matches: Match[] }>()
    const roundMatches = matches.filter((match) => match.round === round)

    for (const match of roundMatches) {
      const firstTeam = match.teams[0]
      const current = firstTeam ? campaigns.get(firstTeam.teamId) || { wins: 0, losses: 0 } : { wins: 0, losses: 0 }
      const label = `${current.wins}-${current.losses}`
      const pool = pools.get(label) || { campaign: { ...current }, matches: [] }
      pool.matches.push(match)
      pools.set(label, pool)
    }

    for (const match of roundMatches) {
      const winnerId = winnerTeamId(match)
      if (!winnerId) continue
      for (const team of match.teams) {
        const campaign = campaigns.get(team.teamId) || { wins: 0, losses: 0 }
        campaigns.set(team.teamId, team.teamId === winnerId
          ? { ...campaign, wins: campaign.wins + 1 }
          : { ...campaign, losses: campaign.losses + 1 })
      }
    }

    return { round, pools: [...pools.entries()] }
  })

  return { rounds, campaigns }
}

export function CopaAce10Swiss({ matches, teams }: { matches: Match[]; teams: Team[] }) {
  const { rounds, campaigns } = buildSwissRounds(matches)
  const advanced = teams.filter((team) => (campaigns.get(team.teamId)?.wins || 0) >= 3)
  const eliminated = teams.filter((team) => (campaigns.get(team.teamId)?.losses || 0) >= 3)
  const qualificationSpots = Math.ceil(teams.length / 2)

  return (
    <div className="swiss-stage">
      <header className="swiss-stage-header">
        <div><p>Sistema</p><h3>Formato suíço</h3></div>
        <strong>As melhores {qualificationSpots} equipes avançam</strong>
        <div className="swiss-rules"><span>3 vitórias <b>Avança</b></span><span>3 derrotas <b>Eliminado</b></span></div>
      </header>

      <div className="swiss-flow-scroll" tabIndex={0} aria-label="Chaveamento do sistema suíço; role horizontalmente para ver todas as rodadas">
        <div className="swiss-flow">
          {rounds.map(({ round, pools }) => (
            <section key={round} className="swiss-round">
              <h4>Rodada {round}</h4>
              <div className="swiss-pools">
                {pools.map(([label, pool]) => (
                  <article key={label} className="swiss-pool" data-tone={campaignTone(pool.campaign)}>
                    <header><strong>{label}</strong><span>{pool.matches.length} partidas</span></header>
                    <div>
                      {pool.matches.map((match) => (
                        <a key={match.matchId} href={match.faceitUrl || undefined} target={match.faceitUrl ? '_blank' : undefined} rel={match.faceitUrl ? 'noreferrer' : undefined} className="swiss-match">
                          <time>{matchDate(match.scheduledAt)}</time>
                          {match.teams.length ? match.teams.map((team) => {
                            const score = match.scores[team.faction] ?? match.scores[team.teamId]
                            const winner = match.winner === team.faction || match.winner === team.teamId
                            return <span key={team.faction} className={winner ? 'is-winner' : ''}><b>{team.name}</b><em>{score ?? '–'}</em></span>
                          }) : <span><b>A definir</b><em>–</em></span>}
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <aside className="swiss-outcomes">
            <div className="is-advance"><p>3 vitórias</p><h4>Avançam</h4>{advanced.length ? advanced.map((team) => <span key={team.teamId}>{team.name}</span>) : <small>Aguardando resultados</small>}</div>
            <div className="is-eliminated"><p>3 derrotas</p><h4>Eliminados</h4>{eliminated.length ? eliminated.map((team) => <span key={team.teamId}>{team.name}</span>) : <small>Aguardando resultados</small>}</div>
          </aside>
        </div>
      </div>
    </div>
  )
}
