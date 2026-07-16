import { prisma } from '@/lib/prisma'
import { NewsList } from '@/components/NewsList'

async function getNews() {
  try {
    const news = await prisma.news.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return news
  } catch (error) {
    console.error('Error fetching news:', error)
    return []
  }
}

export default async function NewsPage() {
  const news = await getNews()

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 border-l-4 border-copa-cyan pl-5">
          <p className="brand-kicker mb-2">Central de conteúdo</p>
          <h1 className="text-3xl font-bold uppercase text-white">Notícias</h1>
          <p className="mt-2 text-gray-400">Fique por dentro das últimas novidades do mundo do Counter-Strike 2</p>
        </div>

        <NewsList news={news} />
      </div>
    </div>
  )
}
