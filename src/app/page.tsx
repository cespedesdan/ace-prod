import type { Metadata } from 'next'
import { Hero } from '@/components/Hero'
import { RankingTable } from '@/components/RankingTable'
import type { FaceitChampionshipSnapshot } from '@/lib/faceit'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Home | Ace Produtora',
  description: 'Página inicial da Ace Produtora e preview da classificação da Copa ACE 10.',
}

async function getFaceitStandings() {
  const championship = await prisma.faceitChampionship.findUnique({
    where: { tournament: 'Copa Ace 10' },
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
  const championship = await getFaceitStandings()

  return (
    <div className="min-h-screen">
      <Hero />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
