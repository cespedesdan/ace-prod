import Image from 'next/image'
import Link from 'next/link'
import { CalendarIcon, Radio, TrophyIcon } from 'lucide-react'
import { hallOfFameEditions } from '@/data/hallOfFame'
import { IntentLink } from '@/components/IntentLink'

export function HallOfFameList() {
  return (
    <div className="space-y-5">
      {[...hallOfFameEditions].reverse().map((edition) => {
        const href = edition.href ?? `/hall-of-fame/${edition.slug}`
        const EditionLink = href === '/copa-ace-10' ? IntentLink : Link
        return <EditionLink
          key={edition.slug}
          href={href}
          className="deferred-render-compact brand-card group grid gap-5 p-5 transition hover:border-copa-cyan/50 sm:grid-cols-[120px_1fr_auto] sm:items-center"
        >
          <div className="relative h-24 w-24 overflow-hidden border border-white/10 bg-smoke/70">
            <Image
              src={edition.logo}
              alt={`Logo ${edition.title}`}
              fill
              sizes="96px"
              className="object-contain p-3 transition duration-200 group-hover:scale-105"
            />
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-bold text-white">{edition.title}</h3>
              {edition.status === 'ongoing' && (
                <span className="inline-flex items-center gap-1 bg-copa-cyan/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-copa-cyan">
                  <Radio size={11} /> Em andamento
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
        </EditionLink>
      })}
    </div>
  )
}
