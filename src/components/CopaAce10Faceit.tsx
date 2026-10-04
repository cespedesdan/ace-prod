import { ExternalLink, Radio, Shield } from 'lucide-react'
import { CopaAce10Swiss } from '@/components/CopaAce10Swiss'
import { BracketLane } from '@/components/TournamentFormatPage'
import type { ArchiveRound, ArchiveTeam } from '@/data/tournamentArchives'

const SHOW_FACEIT_TEAMS = false

export type CopaAce10FaceitData = {
  stage: string
  name: string
  faceitUrl: string
  status: string | null
  format: string | null
  seedingStrategy: string | null
  totalRounds: number | null
  syncedAt: Date
  teams: Array<{
    teamId: string
    name: string
    nickname: string | null
    avatarUrl: string | null
    faceitUrl: string | null
    status: string | null
    group: number | null
    coachPlayerId: string | null
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

function matchDate(timestamp: number | null) {
  return timestamp
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(timestamp)
    : 'Horário a definir'
}

function statusLabel(status: string | null) {
  const labels: Record<string, string> = {
    ongoing: 'Em andamento',
    started: 'Em andamento',
    scheduled: 'Agendada',
    ready: 'Pronta',
    finished: 'Finalizada',
    cancelled: 'Cancelada',
  }
  return status ? labels[status.toLowerCase()] || status : 'A definir'
}

function archiveTeam(team?: CopaAce10FaceitData['matches'][number]['teams'][number]): ArchiveTeam {
  const name = team?.name || 'A definir'
  return { name, shortName: name.slice(0, 3).toUpperCase(), logo: team?.avatarUrl || undefined }
}

const PLAYOFF_ROUNDS = [
  { name: 'Quartas de final', matches: 4 },
  { name: 'Semifinais', matches: 2 },
  { name: 'Grande final', matches: 1 },
] as const

export function buildPlayoffRounds(matches: CopaAce10FaceitData['matches']): ArchiveRound[] {
  return PLAYOFF_ROUNDS.map((round, index) => {
    const roundMatches = matches.filter((match) => match.round === index + 1)
    return {
      name: round.name,
      matches: Array.from({ length: Math.max(round.matches, roundMatches.length) }, (_, matchIndex) => {
        const match = roundMatches[matchIndex]
        if (!match) return {
          label: 'A definir', teamA: archiveTeam(), teamB: archiveTeam(), scoreA: null, scoreB: null, bestOf: 3 as const,
        }
      const [teamA, teamB] = match.teams
      return {
        label: `${matchDate(match.scheduledAt)} · ${statusLabel(match.status)}`,
        teamA: archiveTeam(teamA),
        teamB: archiveTeam(teamB),
        scoreA: teamA ? match.scores[teamA.faction] ?? match.scores[teamA.teamId] ?? null : null,
        scoreB: teamB ? match.scores[teamB.faction] ?? match.scores[teamB.teamId] ?? null : null,
        bestOf: match.bestOf === 1 || match.bestOf === 3 ? match.bestOf : undefined,
        href: match.faceitUrl || undefined,
      }
      }),
    }
  })
}

export function CopaAce10Faceit({ championship }: { championship: CopaAce10FaceitData }) {
  const isSwiss = championship.stage === 'SWISS' || [championship.format, championship.seedingStrategy]
    .some((value) => value?.toLowerCase().includes('swiss'))
  const stageLabel = isSwiss ? 'Fase suíça' : 'Playoffs'
  const stageId = isSwiss ? 'swiss' : 'playoffs'
  const playoffRounds = isSwiss ? [] : buildPlayoffRounds(championship.matches)
  const placements = championship.results.flatMap((result) => result.placements)

  return (
    <section id={`faceit-${stageId}`} className="deferred-render space-y-6">
      <article className="tournament-panel">
        <header className="tournament-panel-header flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="tournament-kicker inline-flex items-center gap-2"><Radio size={13} /> {stageLabel} · dados oficiais FACEIT</p>
            <h2 className="mt-1 text-xl font-black uppercase">{championship.name}</h2>
          </div>
          <div className="text-left sm:text-right">
            <a href={championship.faceitUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-[#ffd276] hover:underline">Abrir campeonato <ExternalLink size={12} /></a>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Atualizado em {championship.syncedAt.toLocaleString('pt-BR')}</p>
          </div>
        </header>
        <div className={`grid gap-px bg-slate-200 ${SHOW_FACEIT_TEAMS ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {SHOW_FACEIT_TEAMS && <div className="bg-white p-5"><strong className="text-3xl text-[#ffd276]">{championship.teams.length}</strong><span className="mt-1 block text-xs font-black uppercase tracking-wider text-slate-500">Times na FACEIT</span></div>}
          <div className="bg-white p-5"><strong className="text-3xl text-[#ffd276]">{championship.matches.length}</strong><span className="mt-1 block text-xs font-black uppercase tracking-wider text-slate-500">Partidas</span></div>
          <div className="bg-white p-5"><strong className="text-xl text-[#ffd276]">{statusLabel(championship.status)}</strong><span className="mt-2 block text-xs font-black uppercase tracking-wider text-slate-500">Status do campeonato</span></div>
        </div>
      </article>

      {SHOW_FACEIT_TEAMS && <div>
        <div className="mb-4 flex items-center gap-2"><Shield size={20} className="text-[#ffd276]" /><h2 className="tournament-section-title">Times na FACEIT</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {championship.teams.map((team) => (
            <article key={team.teamId} className="tournament-panel p-4">
              {team.faceitUrl
                ? <a href={team.faceitUrl} target="_blank" rel="noreferrer" className="font-black text-white hover:text-[#ffd276]">{team.name}</a>
                : <h3 className="font-black text-white">{team.name}</h3>}
              <p className="mt-2 text-xs text-slate-500">{team.group !== null ? `Grupo ${team.group}` : 'Grupo a definir'} · {statusLabel(team.status)}</p>
              {team.coachPlayerId && <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-[#ffd276]">Coach cadastrado</p>}
            </article>
          ))}
        </div>
      </div>}

      <div id={`partidas-${stageId}`}>
        {isSwiss ? <CopaAce10Swiss matches={championship.matches} teams={championship.teams} /> : playoffRounds.length ? (
          <BracketLane title="Chave dos playoffs" eyebrow="Mata-mata · dados oficiais FACEIT" subtitle="Eliminação simples · MD3" rounds={playoffRounds} />
        ) : <p className="tournament-panel p-5 text-sm text-slate-500">A FACEIT ainda não publicou as partidas.</p>}
      </div>

      {placements.length > 0 && (
        <article className="tournament-panel p-5">
          <p className="tournament-section-eyebrow">Classificação final</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {placements.map((placement) => <span key={`${placement.id}-${placement.name}`} className="border border-[#d99a28]/25 bg-black/20 px-3 py-2 text-sm font-bold text-white">{placement.name}</span>)}
          </div>
        </article>
      )}
    </section>
  )
}
