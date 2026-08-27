import Link from 'next/link'
import { Instagram, Mail } from 'lucide-react'
import { Logotipo } from './Logotipo'

export function Footer() {
  return (
    <footer className="deferred-render border-t border-ace-cyan/20 bg-smoke">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-6 inline-flex p-3">
              <Logotipo size="md" variant="neutral" />
            </div>
            <p className="max-w-lg text-sm leading-7 text-gray-400">
              Produzimos campeonatos amadores com ferramentas profissionais, conectando novos jogadores, comunidade e marcas por meio da competição.
            </p>
          </div>

          <div>
            <p className="brand-kicker mb-4">Navegação</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="text-gray-400 transition hover:text-copa-cyan">Home</Link></li>
              <li><Link href="/schedule" className="text-gray-400 transition hover:text-copa-cyan">Agenda</Link></li>
              <li><Link href="/hall-of-fame" className="text-gray-400 transition hover:text-copa-cyan">Hall da Fama</Link></li>
            </ul>
          </div>

          <div>
            <p className="brand-kicker mb-4">Contato</p>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="mailto:faleconosco@aceprodutora.com.br" className="inline-flex items-center gap-2 transition hover:text-copa-cyan"><Mail size={15} /> faleconosco@aceprodutora.com.br</a>
              </li>
              <li>
                <a href="https://instagram.com/AceProdutora" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition hover:text-copa-cyan"><Instagram size={15} /> @AceProdutora</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-ace-cyan/15 pt-7 text-center text-xs text-gray-500">
          © 2026 Ace Produtora. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
