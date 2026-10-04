import type { Metadata, Viewport } from 'next'
import './critical-fonts.css'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  metadataBase: new URL('https://aceprodutora.com.br'),
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
      <body className="min-h-screen bg-gray-900 text-white">
        <div className="flex flex-col min-h-screen">
          <a href="#conteudo-principal" className="skip-link">Pular para o conteúdo</a>
          <Navbar />
          <main id="conteudo-principal" tabIndex={-1} className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
