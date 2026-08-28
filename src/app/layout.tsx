import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ClientPerformance } from '@/components/ClientPerformance'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
  display: 'optional',
  preload: false,
})

const nippo = localFont({
  src: './fonts/Nippo-Variable.woff2',
  weight: '700',
  variable: '--font-nippo',
  display: 'optional',
  preload: false,
})

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
      <head><noscript><style>{'img[data-deferred-src]{display:none!important}'}</style></noscript></head>
      <body className={`${poppins.variable} ${nippo.variable} min-h-screen bg-gray-900 text-white`}>
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
