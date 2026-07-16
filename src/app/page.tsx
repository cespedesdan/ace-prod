import type { Metadata } from 'next'
import { Hero } from '@/components/Hero'
import { RankingTable } from '@/components/RankingTable'

export const metadata: Metadata = {
  title: 'Home | Ace Produtora',
  description: 'Página inicial da Ace Produtora e preview da classificação da Copa ACE 10.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 border-l-4 border-copa-cyan pl-5">
          <p className="brand-kicker mb-2">Competição atual</p>
          <h2 className="text-3xl font-bold uppercase text-white">Classificação Copa ACE 10</h2>
          <p className="mt-2 text-gray-400">Preview da tabela oficial das 16 equipes no formato suíço.</p>
        </div>

        <RankingTable />
      </div>
    </div>
  )
}
