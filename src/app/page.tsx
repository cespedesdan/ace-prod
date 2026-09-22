import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Newspaper, Shield, Trophy, UsersRound } from 'lucide-react'
import './home.css'
import { Hero } from '@/components/Hero'
import { YouTubeLivePlayer } from '@/components/YouTubeLivePlayer'
import { prisma } from '@/lib/prisma'
import { publicLiveStreamId } from '@/lib/public-content'
import { getOpenRegistrationTournament } from '@/lib/registration-status'
import { tournamentFormatLabels, tournamentPrizeBreakdown, tournamentPrizeLabel, tournamentPublicPath } from '@/lib/tournaments'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Home | Ace Produtora',
  description: 'Página inicial da Ace Produtora.',
}

export default async function HomePage() {
  const [liveStream, tournament] = await Promise.all([
    prisma.liveStream.findUnique({ where: { id: publicLiveStreamId } }),
    getOpenRegistrationTournament(),
  ])
  const isClutch = tournament?.slug.startsWith('ace-clutch') ?? false
  const accentCard = isClutch ? 'border-[#bd1159]/20 bg-[#bd1159]/5' : 'border-copa-cyan/20 bg-copa-cyan/5'
  const accentText = isClutch ? 'text-[#ff6fae]' : 'text-copa-cyan'

  return (
    <div className="home-page min-h-screen">
      <Hero tournament={tournament ? { name: tournament.name, href: tournamentPublicPath(tournament.slug), clutch: isClutch } : null} />
      {liveStream?.visibleOnHome && (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8" aria-labelledby="live-title">
          <div className="brand-card overflow-hidden border-red-500/30">
            <header className="flex flex-col justify-between gap-2 border-b border-red-500/20 bg-red-500/10 px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-red-400"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Ao vivo</p>
                <h2 id="live-title" className="mt-1 text-xl font-black uppercase text-white">{liveStream.title}</h2>
              </div>
              <a href={`https://www.youtube.com/watch?v=${liveStream.youtubeVideoId}`} target="_blank" rel="noreferrer" className="text-xs font-black uppercase text-red-300 hover:underline">Assistir no YouTube</a>
            </header>
            <YouTubeLivePlayer videoId={liveStream.youtubeVideoId} />
          </div>
        </section>
      )}
      {tournament && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="next-tournament-title">
          <div className={`brand-card grid overflow-hidden lg:grid-cols-[240px_1fr] ${isClutch ? 'clutch-feature-card' : ''}`}>
            <div className="grid min-h-56 place-items-center border-b border-white/10 bg-black/30 p-8 lg:border-b-0 lg:border-r">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tournament.logoUrl || '/copa_ace_logo_clean.png'} alt={`Logo ${tournament.name}`} className="h-40 w-40 object-contain" />
            </div>
            <div className="p-6 sm:p-8">
              <p className="brand-kicker">Próximo campeonato</p>
              <h2 id="next-tournament-title" className="mt-2 text-3xl font-black uppercase text-white">{tournament.name}</h2>
              {tournament.description && <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-6 text-slate-400">{tournament.description}</p>}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <article className={`border p-4 ${accentCard}`}><CalendarDays className={accentText} size={19} /><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Período</p><strong className="mt-1 block text-sm text-white">{tournament.startDate.toLocaleDateString('pt-BR')} a {tournament.endDate.toLocaleDateString('pt-BR')}</strong></article>
                <article className={`border p-4 ${accentCard}`}><UsersRound className={accentText} size={19} /><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Vagas</p><strong className="mt-1 block text-sm text-white">{tournament.teamLimit} equipes</strong></article>
                <article className={`border p-4 ${accentCard}`}><Trophy className={accentText} size={19} /><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Premiação</p><strong className="mt-1 block text-sm text-white">{tournamentPrizeLabel(tournament.slug, tournament.prizePoolCents)}</strong>{tournamentPrizeBreakdown(tournament.slug) && <span className="mt-1 block text-[10px] leading-4 text-slate-400">{tournamentPrizeBreakdown(tournament.slug)}</span>}</article>
              </div>
              <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-400"><Shield className={accentText} size={15} /> {tournamentFormatLabels[tournament.format as keyof typeof tournamentFormatLabels] || tournament.format}{isClutch && ' · Inscrição R$ 25,00'}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/inscreva-se" className={`brand-button-primary ${isClutch ? 'clutch-button' : ''}`}>Inscreva-se <ArrowRight size={17} /></Link>
                <Link href={tournamentPublicPath(tournament.slug)} className="brand-button-secondary">Ver campeonato</Link>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { href: '/schedule', icon: CalendarDays, title: 'Agenda', text: 'Confira datas e próximas partidas.' },
              { href: '/news', icon: Newspaper, title: 'Notícias', text: 'Acompanhe as novidades da organização.' },
              { href: '/hall-of-fame', icon: Trophy, title: 'Hall da Fama', text: 'Relembre campeões e edições anteriores.' },
            ].map(({ href, icon: Icon, title, text }) => (
              <Link key={href} href={href} className="brand-card group flex items-center gap-4 p-5 transition hover:border-copa-cyan/50">
                <Icon className="shrink-0 text-copa-cyan" size={24} />
                <span><strong className="block text-sm uppercase text-white">{title}</strong><span className="mt-1 block text-xs text-slate-500">{text}</span></span>
                <ArrowRight className="ml-auto shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-copa-cyan" size={17} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
