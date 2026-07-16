import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const nippo = localFont({
  src: './fonts/Nippo-Variable.ttf',
  variable: '--font-nippo',
  display: 'swap',
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
    <html lang="pt-BR">
      <body className={`${poppins.variable} ${nippo.variable} min-h-screen bg-gray-900 text-white`}>
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
