import Image from 'next/image'
import { CalendarClock, CheckCircle2, Gamepad2, Radio } from 'lucide-react'
import type { FaceitChampionshipSnapshot } from '@/lib/faceit'
import { ScheduleFilters } from './ScheduleFilters'

const firstRoundMatches = Array.from({ length: 8 }, (_, index) => index + 1)
const finishedStatuses = new Set(['finished', 'cancelled'])
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })

type FaceitMatch = FaceitChampionshipSnapshot['matches'][number]
type ScheduleFilter = 'all' | 'today' | 'upcoming' | 'finished'

type ChampionshipSchedule = {
  faceitUrl: string
  matches: FaceitMatch[]
  syncedAt: Date
} | null

const sections = {
  today: { title: 'Partidas de hoje', eyebrow: 'Em destaque', icon: Radio, empty: 'Nenhuma partida marcada para hoje.' },
  upcoming: { title: 'Próximas partidas', eyebrow: 'Em breve', icon: CalendarClock, empty: 'Nenhuma próxima partida publicada.' },
  finished: { title: 'Partidas finalizadas', eyebrow: 'Resultados', icon: CheckCircle2, empty: 'Nenhuma partida finalizada.' },
} as const

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

function teamScore(match: FaceitMatch, faction: string, teamId: string) {
  return match.scores[faction] ?? match.scores[teamId]
}

export function scheduleBucket(match: FaceitMatch, now = Date.now()): Exclude<ScheduleFilter, 'all'> {
  if (match.winner || finishedStatuses.has(match.status?.toLowerCase() || '')) return 'finished'
  if (match.scheduledAt && dayFormatter.format(match.scheduledAt) === dayFormatter.format(now)) return 'today'
  return 'upcoming'
}

export function organizeSchedule(matches: FaceitMatch[], now = Date.now()) {
  const organized = { today: [] as FaceitMatch[], upcoming: [] as FaceitMatch[], finished: [] as FaceitMatch[] }
  for (const match of matches) organized[scheduleBucket(match, now)].push(match)
  for (const key of ['today', 'upcoming', 'finished'] as const) {
    organized[key].sort((a, b) => (a.round ?? 99) - (b.round ?? 99) || (a.scheduledAt ?? Number.MAX_SAFE_INTEGER) - (b.scheduledAt ?? Number.MAX_SAFE_INTEGER))
  }
  return organized
}

function TeamLogo({ team }: { team?: FaceitMatch['teams'][number] }) {
  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden border border-white/15 bg-[#100a15] text-xs font-black text-copa-cyan">
      {team?.avatarUrl
        ? <Image src={team.avatarUrl} alt="" width={44} height={44} className="h-full w-full object-contain p-1" />
        : team?.name.slice(0, 2).toUpperCase() || '?'}
    </span>
  )
}

function MatchCard({ match, bucket }: { match: FaceitMatch; bucket: Exclude<ScheduleFilter, 'all'> }) {
  const matchTeams = match.teams.length ? match.teams.slice(0, 2) : [undefined, undefined]

  return (
    <article data-schedule-match data-bucket={bucket} data-round={match.round ?? ''} className="border bg-[#2a1b34] p-4 shadow-[0_0_0_1px_#806592,0_16px_34px_rgba(0,0,0,.35)]">
      <div className="flex items-center justify-between border-b border-white/15 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-copa-cyan">
          {match.round !== null ? `Rodada ${match.round}` : 'Rodada a definir'}{match.group !== null ? ` · Grupo ${match.group}` : ''}
        </p>
        <span className="bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase text-copa-cyan">MD{match.bestOf || '?'}</span>
      </div>

      <div className="space-y-2 py-4">
        {matchTeams.map((team, index) => {
          const score = team ? teamScore(match, team.faction, team.teamId) : undefined
          const isWinner = team && (match.winner === team.faction || match.winner === team.teamId)
          return (
            <div key={team?.faction || index} className="flex items-center gap-3">
              <TeamLogo team={team} />
              <span className={`min-w-0 flex-1 truncate text-sm font-black ${isWinner ? 'text-copa-cyan' : team ? 'text-white' : 'text-slate-500'}`}>{team?.name || 'A definir'}</span>
              <strong className={isWinner ? 'text-copa-cyan' : 'text-slate-400'}>{score ?? '–'}</strong>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/15 pt-3 text-xs font-bold text-slate-300">
        <time>{matchDate(match.scheduledAt)}</time>
        {match.faceitUrl
          ? <a href={match.faceitUrl} target="_blank" rel="noreferrer" className="text-copa-cyan hover:underline">{statusLabel(match.status)} <span aria-hidden="true">↗</span></a>
          : <span>{statusLabel(match.status)}</span>}
      </div>
    </article>
  )
}

function PlaceholderCards() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {firstRoundMatches.map((match) => (
        <article key={match} data-schedule-placeholder data-bucket="upcoming" data-round="1" className="border bg-[#2a1b34] p-4 shadow-[0_0_0_1px_#806592,0_16px_34px_rgba(0,0,0,.35)]">
          <div className="flex items-center justify-between border-b border-white/15 pb-3"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-copa-cyan">Rodada 1</p><span className="bg-cyan-400/10 px-2 py-1 text-[10px] font-black text-copa-cyan">MD1</span></div>
          <div className="flex items-center justify-between py-6 text-sm font-black text-slate-300"><span>A definir</span><span className="text-copa-cyan">VS</span><span>A definir</span></div>
          <div className="border-t border-white/15 pt-3 text-xs font-bold text-slate-300">Horário a definir · Jogo {match}</div>
        </article>
      ))}
    </div>
  )
}

export function ScheduleList({ championship }: { championship: ChampionshipSchedule }) {
  const matches = championship?.matches ?? []
  const organized = organizeSchedule(matches)
  const matchMeta = matches.length
    ? (['today', 'upcoming', 'finished'] as const).flatMap((bucket) =>
        organized[bucket].map((match) => ({ bucket, round: match.round })),
      )
    : firstRoundMatches.map(() => ({ bucket: 'upcoming' as const, round: 1 }))

  return (
    <section id="jogos" className="tournament-panel overflow-hidden">
      <header className="tournament-panel-header flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
        <div><p className="tournament-kicker">Copa Ace 10</p><h2 className="mt-1 text-xl font-black uppercase">Agenda das cinco rodadas</h2></div>
        <div className="text-left sm:text-right">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400"><Gamepad2 size={15} /> Sistema suíço · MD1</span>
          {championship && <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">Atualizado em {championship.syncedAt.toLocaleString('pt-BR')}</p>}
        </div>
      </header>

      <ScheduleFilters matches={matchMeta} />

      {(['today', 'upcoming', 'finished'] as const).map((key) => {
        const section = sections[key]
        const Icon = section.icon
        const sectionMatches = organized[key]
        return (
          <section key={key} data-schedule-section={key} className="deferred-render border-b border-cyan-400/15 bg-[#100a15]/60 p-4 last:border-b-0 sm:p-5" aria-labelledby={`schedule-${key}`}>
            <header className="mb-4 flex items-end justify-between gap-3">
              <div><p className="tournament-section-eyebrow inline-flex items-center gap-2"><Icon size={14} /> {section.eyebrow}</p><h3 id={`schedule-${key}`} className="mt-1 text-lg font-black uppercase text-white">{section.title}</h3></div>
              <span data-schedule-count={key} className="text-xs font-black text-copa-cyan">{sectionMatches.length}</span>
            </header>
            {sectionMatches.length
              ? <div className="grid gap-3 md:grid-cols-2">{sectionMatches.map((match) => <MatchCard key={match.matchId} match={match} bucket={key} />)}</div>
              : key === 'upcoming' && !championship?.matches.length
                ? <><PlaceholderCards /><p hidden data-schedule-empty={key} className="border border-dashed border-slate-500 bg-[#21152a] px-4 py-6 text-center text-sm font-bold text-slate-300">{section.empty}</p></>
                : <p data-schedule-empty={key} className="border border-dashed border-slate-500 bg-[#21152a] px-4 py-6 text-center text-sm font-bold text-slate-300">{section.empty}</p>}
            {sectionMatches.length > 0 && <p hidden data-schedule-empty={key} className="border border-dashed border-slate-500 bg-[#21152a] px-4 py-6 text-center text-sm font-bold text-slate-300">{section.empty}</p>}
          </section>
        )
      })}

      {championship && !championship.matches.length && (
        <p className="border-t border-cyan-400/15 bg-[#1c1124] px-5 py-4 text-xs text-slate-500">A FACEIT ainda não publicou partidas para este campeonato. <a href={championship.faceitUrl} target="_blank" rel="noreferrer" className="font-black text-copa-cyan hover:underline">Abrir campeonato</a></p>
      )}
    </section>
  )
}
