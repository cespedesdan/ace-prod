import type { Metadata } from 'next'
import './schedule.css'
import { ChevronLeft } from 'lucide-react'
import { ScheduleList } from '@/components/ScheduleList'
import { CopaAce10Schedule } from '@/components/CopaAce10Schedule'
import { IntentLink } from '@/components/IntentLink'
import { ClientPerformance } from '@/components/ClientPerformance'
import type { FaceitChampionshipSnapshot } from '@/lib/faceit'
import { prisma } from '@/lib/prisma'
import { publicTournament } from '@/lib/public-content'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Agenda Copa Ace 10 | Ace Produtora',
  description: 'Cronograma e partidas das cinco rodadas suíças da Copa Ace 10.',
}

async function getFaceitSchedule() {
  const championship = await prisma.faceitChampionship.findUnique({
    where: { tournament: publicTournament },
    select: { faceitUrl: true, matchesJson: true, syncedAt: true },
  })
  if (!championship) return null

  try {
    const matches: unknown = JSON.parse(championship.matchesJson)
    if (!Array.isArray(matches)) return null
    return {
      faceitUrl: championship.faceitUrl,
      matches: matches as FaceitChampionshipSnapshot['matches'],
      syncedAt: championship.syncedAt,
    }
  } catch {
    return null
  }
}

export default async function SchedulePage() {
  const faceitSchedule = await getFaceitSchedule()

  return (
    <main className="schedule-page tournament-page">
      <ClientPerformance />
      <section className="tournament-hero">
        <div className="tournament-container py-6">
          <IntentLink href="/copa-ace-10" className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-slate-300 transition hover:text-white">
            <ChevronLeft size={16} /> Copa Ace 10
          </IntentLink>
          <p className="tournament-kicker">Calendário oficial</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">Agenda de jogos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Acompanhe as cinco rodadas do sistema suíço e os playoffs da Copa ACE 10.</p>
        </div>
      </section>

      <div className="tournament-container space-y-6 py-8">
        <CopaAce10Schedule />
        <ScheduleList championship={faceitSchedule} />
      </div>
    </main>
  )
}
