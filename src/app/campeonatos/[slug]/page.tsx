import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, CalendarDays, ExternalLink, Radio, Shield, Trophy, Users } from 'lucide-react'
import { adminCookieName } from '@/lib/admin-request'
import { verifyToken } from '@/lib/auth'
import { faceitBracketRounds, storedFaceitMatches } from '@/lib/faceit-public'
import { prisma } from '@/lib/prisma'
import { tournamentFormatLabels, tournamentPrizeBreakdown, tournamentPrizeLabel, tournamentStageLabel } from '@/lib/tournaments'
import { BracketLane } from '@/components/TournamentFormatPage'

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }

function formatLabel(format: string) {
  return tournamentFormatLabels[format as keyof typeof tournamentFormatLabels] || format
}

async function canPreview(searchParams: PageProps['searchParams']) {
  if ((await searchParams).preview !== '1') return false
  const token = (await cookies()).get(adminCookieName())?.value
  return Boolean(token && verifyToken(token)?.role === 'ADMIN')
}

async function getTournament(slug: string, preview = false) {
  return prisma.tournament.findFirst({ where: { slug, ...(preview ? {} : { published: true }) } })
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const tournament = await getTournament((await params).slug, await canPreview(searchParams))
  return tournament
    ? { title: `${tournament.name} | Ace Produtora`, description: tournament.description }
    : { title: 'Campeonato não encontrado | Ace Produtora' }
}

export default async function TournamentPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  if (slug === 'copa-ace-10') redirect('/copa-ace-10')
  const preview = await canPreview(searchParams)
  const tournament = await getTournament(slug, preview)
  if (!tournament) notFound()
  const isClutch = tournament.slug.startsWith('ace-clutch')

  const [teams, championships] = await Promise.all([
    prisma.registration.findMany({
      where: { tournament: tournament.name, status: 'APPROVED' },
      orderBy: { updatedAt: 'asc' },
      select: { id: true, teamName: true, teamTag: true },
      take: tournament.teamLimit,
    }),
    prisma.faceitChampionship.findMany({
      where: { tournament: tournament.name },
      orderBy: { stage: 'asc' },
      select: { stage: true, name: true, faceitUrl: true, status: true, matchesJson: true, syncedAt: true },
    }),
  ])
  const faceitStages = championships.map((championship) => ({
    ...championship,
    matches: storedFaceitMatches(championship.matchesJson),
  }))

  return (
    <main className={`tournament-page min-h-screen bg-gray-950 text-white ${isClutch ? 'clutch-page' : ''}`}>
      {preview && !tournament.published && <div className="border-b border-amber-400/30 bg-amber-400/10 px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-amber-300">Pré-visualização administrativa · página ainda não publicada</div>}
      <section className="border-b border-white/10 bg-gray-900">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_260px] lg:px-8">
          <div>
            <p className="brand-kicker">Campeonato oficial</p>
            <h1 className="mt-3 text-4xl font-black uppercase">{tournament.name}</h1>
            <p className="mt-4 max-w-3xl text-slate-300">{tournament.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-slate-300">
              <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-2"><CalendarDays size={15} /> {tournament.startDate.toLocaleDateString('pt-BR')} a {tournament.endDate.toLocaleDateString('pt-BR')}</span>
              <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-2"><Users size={15} /> Até {tournament.teamLimit} times</span>
              <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-2"><Shield size={15} /> {formatLabel(tournament.format)}</span>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {tournament.registrationOpen && <Link href="/inscreva-se" className={`brand-button-primary ${isClutch ? 'clutch-button' : ''}`}>Inscreva-se <ArrowRight size={17} /></Link>}
              <Link href={`/schedule?campeonato=${tournament.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:underline"><CalendarDays size={16} /> Ver agenda</Link>
            </div>
          </div>
          <div className="flex items-center justify-center border border-white/10 bg-black/20 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tournament.logoUrl || '/copa_ace_logo_clean.png'} alt={`Logo ${tournament.name}`} className="aspect-square max-h-48 w-full object-contain" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <article className="brand-card p-5"><p className="text-xs font-black uppercase text-cyan-400">Premiação</p><strong className="mt-2 block text-xl">{tournamentPrizeLabel(tournament.slug, tournament.prizePoolCents)}</strong>{tournamentPrizeBreakdown(tournament.slug) && <span className="mt-2 block text-sm text-slate-400">{tournamentPrizeBreakdown(tournament.slug)}</span>}</article>
          <article className="brand-card p-5"><p className="text-xs font-black uppercase text-cyan-400">Equipes confirmadas</p><strong className="mt-2 block text-xl">{teams.length}/{tournament.teamLimit}</strong></article>
        </section>

        {tournament.status === 'COMPLETED' && tournament.champion && (
          <section className="brand-card grid gap-4 p-6 sm:grid-cols-2">
            <div><p className="inline-flex items-center gap-2 text-xs font-black uppercase text-cyan-400"><Trophy size={15} /> Campeão</p><h2 className="mt-2 text-2xl font-black">{tournament.champion}</h2></div>
            <div><p className="text-xs font-black uppercase text-slate-400">Vice-campeão</p><h2 className="mt-2 text-2xl font-black">{tournament.runnerUp}</h2></div>
          </section>
        )}

        <section className="brand-card p-5">
          <h2 className="text-xl font-black uppercase">Times confirmados</h2>
          {teams.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{teams.map((team) => <div key={team.id} className="flex min-w-0 items-center gap-3 bg-slate-900 px-4 py-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden border border-white/10 bg-white">
              <Image src={`/api/tournaments/${tournament.slug}/teams/${team.id}/logo`} alt={`Logo ${team.teamName}`} width={48} height={48} className="h-full w-full object-contain p-1" />
            </span>
            <div className="min-w-0"><strong className="block truncate">{team.teamName}</strong><span className="text-xs text-slate-400">{team.teamTag}</span></div>
          </div>)}</div> : <p className="mt-3 text-sm text-slate-400">Os times confirmados serão divulgados em breve.</p>}
        </section>

        <section id="partidas" className="space-y-5">
          <div className="brand-card p-5">
            <h2 className="inline-flex items-center gap-2 text-xl font-black uppercase"><Radio className="text-cyan-400" size={19} /> Jogos e chaveamento</h2>
            {faceitStages.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{faceitStages.map((championship) => <article key={championship.stage} className="bg-slate-900 p-4"><p className="text-xs font-black uppercase text-cyan-400">{tournamentStageLabel(tournament.format, championship.stage)}</p><h3 className="mt-1 font-black">{championship.name}</h3><p className="mt-2 text-xs text-slate-400">{championship.matches.length} partidas · atualizado em {championship.syncedAt.toLocaleString('pt-BR')}</p><a href={championship.faceitUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:underline">Abrir na FACEIT <ExternalLink size={12} /></a></article>)}</div> : <p className="mt-3 text-sm text-slate-400">Os confrontos serão divulgados em breve.</p>}
          </div>
          {faceitStages.map((championship) => championship.matches.length > 0 && (
            <BracketLane
              key={championship.stage}
              title={tournamentStageLabel(tournament.format, championship.stage)}
              eyebrow="Partidas oficiais FACEIT"
              subtitle="Confrontos por rodada"
              rounds={faceitBracketRounds(championship.matches)}
            />
          ))}
        </section>

        <Link href="/hall-of-fame" className="inline-flex text-sm font-bold text-cyan-300 hover:underline">Ver histórico de campeonatos</Link>
      </div>
    </main>
  )
}
