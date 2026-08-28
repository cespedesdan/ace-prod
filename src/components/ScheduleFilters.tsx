'use client'

import { useEffect, useMemo, useState } from 'react'

type ScheduleBucket = 'today' | 'upcoming' | 'finished'
type ScheduleFilter = 'all' | ScheduleBucket
type MatchMeta = { bucket: ScheduleBucket; round: number | null }

const filters: Array<{ value: ScheduleFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoje' },
  { value: 'upcoming', label: 'Próximas' },
  { value: 'finished', label: 'Finalizadas' },
]

const roundOptions = [1, 2, 3, 4, 5]

export function ScheduleFilters({ matches }: { matches: MatchMeta[] }) {
  const [filter, setFilter] = useState<ScheduleFilter>('all')
  const [round, setRound] = useState('all')
  const counts = useMemo(() => {
    const selected = matches.filter((match) => round === 'all' || match.round === Number(round))
    return {
      all: selected.length,
      today: selected.filter((match) => match.bucket === 'today').length,
      upcoming: selected.filter((match) => match.bucket === 'upcoming').length,
      finished: selected.filter((match) => match.bucket === 'finished').length,
    }
  }, [matches, round])

  useEffect(() => {
    const root = document.getElementById('jogos')
    if (!root) return

    for (const section of root.querySelectorAll<HTMLElement>('[data-schedule-section]')) {
      const bucket = section.dataset.scheduleSection as ScheduleBucket
      section.hidden = filter !== 'all' && filter !== bucket

      let visibleMatches = 0
      for (const card of section.querySelectorAll<HTMLElement>('[data-schedule-match]')) {
        const visible = round === 'all' || card.dataset.round === round
        card.hidden = !visible
        if (visible) visibleMatches += 1
      }

      for (const placeholder of section.querySelectorAll<HTMLElement>('[data-schedule-placeholder]')) {
        placeholder.hidden = round !== 'all' && placeholder.dataset.round !== round
      }

      const empty = section.querySelector<HTMLElement>('[data-schedule-empty]')
      const hasVisiblePlaceholder = [...section.querySelectorAll<HTMLElement>('[data-schedule-placeholder]')].some((item) => !item.hidden)
      if (empty) empty.hidden = visibleMatches > 0 || hasVisiblePlaceholder

      const count = section.querySelector<HTMLElement>('[data-schedule-count]')
      if (count) count.textContent = String(counts[bucket])
    }
  }, [counts, filter, round])

  return (
    <div className="flex flex-col gap-3 border-b border-cyan-400/20 bg-[#170f1e] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar partidas por período">
        {filters.map((item) => (
          <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} className={`border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${filter === item.value ? 'border-copa-cyan bg-copa-cyan text-[#1c1124]' : 'border-slate-500 text-slate-200 hover:border-copa-cyan hover:text-white'}`}>
            {item.label} <span className="ml-1 opacity-70">{counts[item.value]}</span>
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        Rodada
        <select value={round} onChange={(event) => setRound(event.target.value)} className="border border-white/15 bg-[#21152a] px-3 py-2 text-xs font-bold text-white outline-none focus:border-copa-cyan">
          <option value="all">Todas (1–5)</option>
          {roundOptions.map((value) => <option key={value} value={value}>Rodada {value}</option>)}
        </select>
      </label>
    </div>
  )
}
