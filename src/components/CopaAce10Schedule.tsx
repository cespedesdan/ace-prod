import { CalendarDays } from 'lucide-react'

const phases = [
  {
    title: 'Sistema suíço',
    format: 'MD1',
    rounds: [
      ['Rodada 1', '20–23 AGO'],
      ['Rodada 2', '23–25 AGO'],
      ['Rodada 3', '25–28 AGO'],
      ['Rodada 4', '29–30 AGO'],
      ['Rodada 5', '30–31 AGO'],
    ],
  },
  {
    title: 'Playoffs',
    format: 'MD3',
    rounds: [
      ['Quartas de final', '01–03 SET'],
      ['Semifinais', '03–04 SET'],
      ['Grande final', '04–07 SET'],
    ],
  },
]

export function CopaAce10Schedule() {
  return (
    <section id="cronograma" className="tournament-panel">
      <header className="tournament-panel-header flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="tournament-kicker">Copa ACE 10</p>
          <h2 className="mt-1 text-xl font-black uppercase">Cronograma</h2>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400"><CalendarDays size={15} /> 20 AGO — 07 SET</span>
      </header>

      <div className="grid gap-px bg-slate-200 md:grid-cols-2">
        {phases.map((phase) => (
          <article key={phase.title} className="bg-white p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black uppercase text-slate-900">{phase.title}</h3>
              <span className="bg-orange-50 px-2 py-1 text-[10px] font-black uppercase text-orange-600">{phase.format}</span>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {phase.rounds.map(([round, date]) => (
                <li key={round} className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-600">{round}</span>
                  <time className="shrink-0 font-black text-slate-900">{date}</time>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
