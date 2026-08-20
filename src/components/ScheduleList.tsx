import { CalendarDays, ExternalLink, Gamepad2 } from 'lucide-react'
import type { FaceitChampionshipSnapshot } from '@/lib/faceit'

const firstRoundMatches = Array.from({ length: 8 }, (_, index) => ({ id: index + 1 }))
type FaceitMatch = FaceitChampionshipSnapshot['matches'][number]

type ChampionshipSchedule = {
  faceitUrl: string
  matches: FaceitMatch[]
  syncedAt: Date
} | null

function matchDate(timestamp: number | null) {
  return timestamp
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
      }).format(timestamp)
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

export function ScheduleList({ championship }: { championship: ChampionshipSchedule }) {
  const matches = championship?.matches ?? []

  return (
    <section className="tournament-panel">
      <header className="tournament-panel-header flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="tournament-kicker">Copa Ace 10</p>
          <h2 className="mt-1 text-xl font-black uppercase">{matches.length ? 'Partidas sincronizadas' : 'Fase de grupos · Rodada 1'}</h2>
        </div>
        <div className="text-left sm:text-right">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400"><Gamepad2 size={15} /> Sistema suíço · MD1</span>
          {championship && (
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
              Atualizado em {championship.syncedAt.toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-px bg-slate-200 md:grid-cols-2">
        {matches.length ? matches.map((match) => (
          <article key={match.matchId} className="bg-white p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                {match.round !== null ? `Rodada ${match.round}` : 'Rodada a definir'}{match.group !== null ? ` · Grupo ${match.group}` : ''}
              </p>
              <span className="bg-orange-50 px-2 py-1 text-[10px] font-black uppercase text-orange-600">MD{match.bestOf || '?'}</span>
            </div>
            <div className="space-y-3 py-5">
              {match.teams.length ? match.teams.map((team) => {
                const score = teamScore(match, team.faction, team.teamId)
                const isWinner = match.winner === team.faction || match.winner === team.teamId
                return (
                  <div key={`${match.matchId}-${team.faction}`} className="flex items-center justify-between gap-4">
                    <span className={isWinner ? 'font-black text-orange-600' : 'font-black text-slate-800'}>{team.name}</span>
                    <strong className={isWinner ? 'text-orange-600' : 'text-slate-500'}>{score ?? '–'}</strong>
                  </div>
                )
              }) : <p className="py-3 text-center text-sm font-bold text-slate-400">Adversários a definir</p>}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs font-bold text-slate-400">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {matchDate(match.scheduledAt)}</span>
              {match.faceitUrl
                ? <a href={match.faceitUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-orange-600 hover:underline">{statusLabel(match.status)} <ExternalLink size={12} /></a>
                : <span>{statusLabel(match.status)}</span>}
            </div>
          </article>
        )) : firstRoundMatches.map((match) => (
          <article key={match.id} className="bg-white p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Fase de grupos</p>
              <span className="bg-orange-50 px-2 py-1 text-[10px] font-black uppercase text-orange-600">MD1</span>
            </div>
            <div className="flex items-center justify-between gap-5 py-6">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center bg-slate-100 font-black text-slate-400">?</span>
                <span className="font-black text-slate-700">A definir</span>
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">vs</span>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-3 text-right">
                <span className="font-black text-slate-700">A definir</span>
                <span className="grid h-10 w-10 shrink-0 place-items-center bg-slate-100 font-black text-slate-400">?</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-400">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> A definir</span>
              <span>Jogo {match.id}</span>
            </div>
          </article>
        ))}
      </div>
      {championship && matches.length === 0 && (
        <p className="border-t border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
          A FACEIT ainda não publicou partidas para este campeonato.{' '}
          <a href={championship.faceitUrl} target="_blank" rel="noreferrer" className="font-black text-orange-600 hover:underline">Abrir campeonato</a>
        </p>
      )}
    </section>
  )
}
