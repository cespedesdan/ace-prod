import type { MetadataRoute } from 'next'
import { hallOfFameEditions } from '@/data/hallOfFame'
import { prisma } from '@/lib/prisma'
import { tournamentPublicPath } from '@/lib/tournaments'

const baseUrl = 'https://aceprodutora.com.br'
export const revalidate = 60

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ['', '/copa-ace-10', '/inscreva-se', '/schedule', '/news', '/hall-of-fame']
  const archives = hallOfFameEditions
    .filter((edition) => !edition.href)
    .map((edition) => `/hall-of-fame/${edition.slug}`)

  const tournaments = await prisma.tournament.findMany({
    where: { published: true }, select: { slug: true, updatedAt: true },
  })
  const entries = new Map<string, MetadataRoute.Sitemap[number]>(
    [...pages, ...archives].map((path) => [path, { url: `${baseUrl}${path}` }]),
  )
  for (const tournament of tournaments) {
    const path = tournamentPublicPath(tournament.slug)
    entries.set(path, { url: `${baseUrl}${path}`, lastModified: tournament.updatedAt })
  }
  return [...entries.values()]
}
