import { CalendarIcon, Radio, TrophyIcon } from 'lucide-react'
import { hallOfFameEditions } from '@/data/hallOfFame'
import { prisma } from '@/lib/prisma'
import { tournamentPublicPath, tournamentStatusLabel } from '@/lib/tournaments'
import { IntentLink } from './IntentLink'

function optimizedLogoSrc(src: string) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=192&q=60`
}

export async function HallOfFameList() {
  const published = await prisma.tournament.findMany({
    where: {
      published: true,
      OR: [{ status: { not: 'COMPLETED' } }, { publishedInHallOfFame: true }],
    },
    orderBy: { endDate: 'asc' },
  })
  const editions = new Map(hallOfFameEditions.map((edition) => [edition.slug, edition]))
  for (const tournament of published) {
    const existing = editions.get(tournament.slug)
    editions.set(tournament.slug, {
      slug: tournament.slug,
      title: tournament.name,
      logo: tournament.logoUrl || existing?.logo || '/copa_ace_logo_clean.png',
      date: tournament.status === 'COMPLETED'
        ? tournament.endDate.toLocaleDateString('pt-BR')
        : `${tournament.startDate.toLocaleDateString('pt-BR')} a ${tournament.endDate.toLocaleDateString('pt-BR')}`,
      champion: tournament.champion || 'Em disputa',
      runnerUp: tournament.runnerUp || 'A definir',
      description: tournament.description,
      highlights: existing?.highlights || [],
      status: tournament.status === 'COMPLETED' ? 'completed' : 'ongoing',
      statusLabel: tournamentStatusLabel(tournament.status, tournament.registrationOpen),
      href: existing?.href || tournamentPublicPath(tournament.slug),
    })
  }

  return (
    <div className="space-y-5">
      {[...editions.values()].reverse().map((edition) => {
        const href = edition.href ?? `/hall-of-fame/${edition.slug}`
        return <IntentLink
          key={edition.slug}
          href={href}
          className="deferred-render-compact brand-card group grid gap-5 p-5 transition hover:border-copa-cyan/50 sm:grid-cols-[120px_1fr_auto] sm:items-center"
        >
          <div className="relative h-24 w-24 overflow-hidden border border-white/10 bg-smoke/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={optimizedLogoSrc(edition.logo)} alt={`Logo ${edition.title}`} width={96} height={96} decoding="async" loading="lazy" className="h-full w-full object-contain p-3 transition duration-200 group-hover:scale-105" />
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-bold text-white">{edition.title}</h3>
              {edition.status === 'ongoing' && (
                <span className="inline-flex items-center gap-1 bg-copa-cyan/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-copa-cyan">
                  <Radio size={11} /> {edition.statusLabel || 'Em progresso'}
                </span>
              )}
            </div>
            <p className="flex items-center gap-2 font-medium text-copa-cyan"><TrophyIcon size={15} /> Campeão: {edition.champion}</p>
            <p className="mt-1 text-sm text-gray-400">Vice: {edition.runnerUp}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400 sm:justify-end sm:text-right">
            <CalendarIcon className="h-5 w-5 shrink-0 text-copa-cyan" />
            <span className="font-semibold">{edition.date ?? 'Data não informada'}</span>
          </div>
        </IntentLink>
      })}
    </div>
  )
}
