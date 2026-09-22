import { CalendarDays, LockKeyhole } from 'lucide-react'

export default function RegistrationClosed() {
  return (
    <main className="tournament-page copa-ace-10-page registration-page min-h-screen text-white">
      <section className="tournament-hero copa10-hero registration-hero flex min-h-[calc(100vh-5rem)] items-center">
        <div className="copa10-hero-glow" aria-hidden="true" />
        <div className="tournament-container relative grid gap-8 py-10 lg:grid-cols-[1fr_380px] lg:py-14">
          <div>
            <div className="registration-open-badge mt-7 inline-flex items-center gap-2 border bg-[#8f0000] px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#ffd276]">
              <span className="h-2 w-2 bg-[#ffd276]" /> Inscrições encerradas
            </div>
            <h1 className="mt-5 text-4xl font-black uppercase tracking-tight sm:text-6xl">Nenhuma inscrição <span>aberta agora</span></h1>
            <p className="lcp-text mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">Quando uma nova competição abrir inscrições, o formulário ficará disponível automaticamente nesta página.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-slate-300">
              <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-2"><LockKeyhole size={15} className="text-[#ffd276]" /> Inscrições encerradas</span>
            </div>
          </div>
          <aside className="registration-aside self-end border border-[#d99a28]/25 bg-black/45 p-5">
            <h2 className="font-black text-white">Acompanhe os próximos campeonatos</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex gap-2.5"><CalendarDays size={17} className="mt-0.5 shrink-0 text-[#ffd276]" /> Consulte datas e horários na agenda.</li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  )
}
