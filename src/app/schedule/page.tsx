import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ScheduleList } from '@/components/ScheduleList'
import { CopaAce10Schedule } from '@/components/CopaAce10Schedule'

export const metadata: Metadata = {
  title: 'Agenda Copa Ace 10 | Ace Produtora',
  description: 'Cronograma e primeira rodada da Copa Ace 10.',
}

export default function SchedulePage() {
  return (
    <main className="tournament-page">
      <section className="tournament-hero">
        <div className="tournament-container py-6">
          <Link href="/copa-ace-10" className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-slate-300 transition hover:text-white">
            <ChevronLeft size={16} /> Copa Ace 10
          </Link>
          <p className="tournament-kicker">Calendário oficial</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">Agenda de jogos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Datas do sistema suíço e dos playoffs da Copa ACE 10. Confrontos e horários serão divulgados em breve.</p>
        </div>
      </section>

      <div className="tournament-container space-y-6 py-8">
        <CopaAce10Schedule />
        <ScheduleList />
      </div>
    </main>
  )
}
