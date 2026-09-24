import type { Metadata } from 'next'
import './schedule.css'
import { ChevronLeft } from 'lucide-react'
import { ScheduleList } from '@/components/ScheduleList'
import { CopaAce10Schedule } from '@/components/CopaAce10Schedule'
import { IntentLink } from '@/components/IntentLink'
import { ClientPerformance } from '@/components/ClientPerformance'
import { storedFaceitMatches } from '@/lib/faceit-public'
import { prisma } from '@/lib/prisma'
import { publicTournament } from '@/lib/public-content'
import { tournamentPublicPath } from '@/lib/tournaments'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Agenda de jogos | Ace Produtora',
  description: 'Acompanhe as partidas e resultados dos campeonatos da Ace Produtora.',
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ campeonato?: string }> }) {
  const tournaments = await prisma.tournament.findMany({
    where: { published: true },
    orderBy: { startDate: 'desc' },
    select: { name: true, slug: true, format: true, status: true, registrationOpen: true },
  })
  const requested = (await searchParams).campeonato
  const selected = tournaments.find((tournament) => tournament.slug === requested)
    ?? tournaments.find((tournament) => tournament.registrationOpen)
    ?? tournaments.find((tournament) => tournament.status === 'ONGOING')
    ?? tournaments.find((tournament) => tournament.slug === 'copa-ace-10')
    ?? tournaments[0]
  const championships = selected ? await prisma.faceitChampionship.findMany({
    where: { tournament: selected.slug === 'copa-ace-10' ? publicTournament : selected.name },
    orderBy: { stage: 'asc' },
    select: { stage: true, faceitUrl: true, matchesJson: true, syncedAt: true },
  }) : []
  const schedules = championships.flatMap((championship) =>
    championship.stage === 'SWISS' || championship.stage === 'PLAYOFFS'
      ? [{ ...championship, stage: championship.stage as 'SWISS' | 'PLAYOFFS', matches: storedFaceitMatches(championship.matchesJson) }]
      : [],
  )

  return (
    <main className="schedule-page tournament-page">
      <ClientPerformance />
      <section className="tournament-hero">
        <div className="tournament-container py-6">
          {selected && <IntentLink href={tournamentPublicPath(selected.slug)} className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-slate-300 transition hover:text-white"><ChevronLeft size={16} /> {selected.name}</IntentLink>}
          <p className="tournament-kicker">Calendário oficial</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">Agenda de jogos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Partidas e resultados de {selected?.name || 'nossos campeonatos'}.</p>
        </div>
      </section>

      <div className="tournament-container space-y-6 py-8">
        {selected ? <>
          <form action="/schedule" className="flex flex-wrap items-end gap-3">
            <label htmlFor="schedule-tournament" className="grid gap-2 text-sm font-bold text-slate-200">Campeonato
              <select id="schedule-tournament" name="campeonato" defaultValue={selected.slug} className="min-h-11 min-w-56 border border-white/25 bg-[#21152a] px-3 py-2 text-white focus:border-copa-cyan">
                {tournaments.map((tournament) => <option key={tournament.slug} value={tournament.slug}>{tournament.name}</option>)}
              </select>
            </label>
            <button type="submit" className="min-h-11 border border-copa-cyan bg-copa-cyan px-4 font-black text-[#1c1124]">Ver agenda</button>
          </form>
          {selected.slug === 'copa-ace-10' && <CopaAce10Schedule />}
          <ScheduleList key={selected.slug} tournamentName={selected.name} format={selected.format} showFirstRoundPlaceholders={selected.slug === 'copa-ace-10'} championships={schedules} />
        </> : <p className="text-slate-300">Nenhum campeonato publicado no momento.</p>}
      </div>
    </main>
  )
}
