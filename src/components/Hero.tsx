import Link from 'next/link'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Logo } from './Logo'

export function Hero() {
  return (
    <section className="brand-gradient brand-grid relative overflow-hidden border-b border-copa-cyan/30">
      <div className="absolute -right-24 -top-40 h-96 w-96 rotate-45 border-[72px] border-white/5" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_380px] lg:items-center lg:px-8 lg:py-24">
        <div>
          <p className="brand-kicker">Competição que conecta</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-7xl">
            O jogo começa aqui
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            Campeonatos de Counter-Strike 2 com produção profissional, experiência acessível e a energia da comunidade.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/copa-ace-10" className="brand-button-primary">
              Conhecer a Copa Ace 10 <ArrowRight size={17} />
            </Link>
            <Link href="/schedule" className="brand-button-secondary border-white/45 bg-white/5 text-white hover:border-white hover:bg-white/10">
              <CalendarDays size={17} /> Ver agenda
            </Link>
          </div>
        </div>

        <div className="mx-auto grid h-72 w-72 place-items-center border border-white/15 bg-smoke/45 p-12 backdrop-blur sm:h-80 sm:w-80">
          <Logo size="lg" variant="neutral" className="h-40 w-40" sizes="160px" priority />
        </div>
      </div>
    </section>
  )
}
