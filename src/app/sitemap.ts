import type { MetadataRoute } from 'next'
import { hallOfFameEditions } from '@/data/hallOfFame'

const baseUrl = 'https://aceprodutora.com.br'

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/copa-ace-10', '/inscreva-se', '/schedule', '/news', '/hall-of-fame']
  const archives = hallOfFameEditions
    .filter((edition) => !edition.href)
    .map((edition) => `/hall-of-fame/${edition.slug}`)

  return [...pages, ...archives].map((path) => ({ url: `${baseUrl}${path}` }))
}
