import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hallOfFameEditions } from '@/data/hallOfFame'
import CopaAce9Page from '@/components/CopaAce9Page'
import CopaAce10Page from '@/components/CopaAce10Page'
import AceClutch2Page from '@/components/AceClutch2Page'
import AceClutch1Page from '@/components/AceClutch1Page'

export const dynamic = 'force-dynamic'

interface EditionPageProps {
  params: Promise<{ slug: string }>
}

export default async function HallOfFameEditionPage({ params }: EditionPageProps) {
  const { slug } = await params
  const edition = hallOfFameEditions.find((item) => item.slug === slug)

  if (!edition) {
    notFound()
  }

  if (edition.slug === 'copa-ace-9') {
    return <CopaAce9Page />
  }

  if (edition.slug === 'ace-clutch-2') {
    return <AceClutch2Page />
  }

  if (edition.slug === 'ace-clutch') {
    return <AceClutch1Page />
  }

  if (edition.slug === 'copa-ace-10') {
    return <CopaAce10Page />
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/hall-of-fame" className="text-cyan-400 hover:text-cyan-300 mb-6 inline-block">
          ← Voltar ao Hall da Fama
        </Link>

        <div className="brand-card p-8">
          <p className="text-cyan-400 font-semibold uppercase tracking-[0.2em] text-sm mb-3">
            Edição especial
          </p>
          <h1 className="text-3xl font-bold text-white mb-4">{edition.title}</h1>
          <p className="text-gray-300 mb-6">{edition.description}</p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900/70 rounded-xl p-6 border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Campeão</p>
              <p className="text-2xl font-semibold text-white">{edition.champion}</p>
            </div>
            <div className="bg-gray-900/70 rounded-xl p-6 border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Vice-campeão</p>
              <p className="text-2xl font-semibold text-white">{edition.runnerUp}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Destaques</h2>
            <ul className="space-y-3 text-gray-300">
              {edition.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
