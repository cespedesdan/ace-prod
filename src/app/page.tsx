import type { Metadata } from 'next'
import './home.css'
import { Hero } from '@/components/Hero'
import { RankingTable } from '@/components/RankingTable'
import { YouTubeLivePlayer } from '@/components/YouTubeLivePlayer'
import type { FaceitChampionshipSnapshot } from '@/lib/faceit'
import { prisma } from '@/lib/prisma'
import { publicLiveStreamId, publicTournament } from '@/lib/public-content'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Home | Ace Produtora',
  description: 'Página inicial da Ace Produtora e preview da classificação da Copa ACE 10.',
}

async function getFaceitStandings() {
  const championship = await prisma.faceitChampionship.findFirst({
    where: { tournament: publicTournament, stage: 'SWISS' },
    select: { teamsJson: true, matchesJson: true, syncedAt: true },
  })
  if (!championship) return null

  try {
    const teams: unknown = JSON.parse(championship.teamsJson)
    const matches: unknown = JSON.parse(championship.matchesJson)
    if (!Array.isArray(teams) || !Array.isArray(matches)) return null
    return {
      teams: teams as FaceitChampionshipSnapshot['teams'],
      matches: matches as FaceitChampionshipSnapshot['matches'],
      syncedAt: championship.syncedAt,
    }
  } catch {
    return null
  }
}

export default async function HomePage() {
  const [championship, liveStream] = await Promise.all([
    getFaceitStandings(),
    prisma.liveStream.findUnique({ where: { id: publicLiveStreamId } }),
  ])

  return (
    <div className="home-page min-h-screen">
      <Hero />
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
      <div className="deferred-render mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 border-l-4 border-copa-cyan pl-5">
          <p className="brand-kicker mb-2">Competição atual</p>
          <h2 className="text-3xl font-bold uppercase text-white">Classificação Copa ACE 10</h2>
          <p className="mt-2 text-gray-400">Preview da tabela oficial das 16 equipes no formato suíço.</p>
        </div>

        <RankingTable teams={championship?.teams ?? []} matches={championship?.matches ?? []} syncedAt={championship?.syncedAt ?? null} />
      </div>
    </div>
  )
}
