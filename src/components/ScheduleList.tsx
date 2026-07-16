import { CalendarDays, Gamepad2 } from 'lucide-react'

const firstRoundMatches = Array.from({ length: 8 }, (_, index) => ({ id: index + 1 }))

export function ScheduleList() {
  return (
    <section className="tournament-panel">
      <header className="tournament-panel-header flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="tournament-kicker">Copa Ace 10</p>
          <h2 className="mt-1 text-xl font-black uppercase">Fase de grupos · Rodada 1</h2>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400"><Gamepad2 size={15} /> Sistema suíço · MD1</span>
      </header>

      <div className="grid gap-px bg-slate-200 md:grid-cols-2">
        {firstRoundMatches.map((match) => (
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
    </section>
  )
}
