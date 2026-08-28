import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ClientPerformance } from '@/components/ClientPerformance'

export const metadata: Metadata = {
  title: 'Ace Produtora',
  description: 'Produção audiovisual e campeonatos de eSports com padrão profissional.',
  keywords: 'counter-strike, cs2, esports, torneios, ace produtora',
}

export const viewport: Viewport = {
  themeColor: '#1C1124',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags -- This versioned font payload intentionally stays external and cacheable. */}
        <link rel="stylesheet" href="/critical-fonts-v1.css" />
        <noscript><style>{'img[data-deferred-src]{display:none!important}'}</style></noscript>
      </head>
      <body className="min-h-screen bg-gray-900 text-white">
        <ClientPerformance />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
