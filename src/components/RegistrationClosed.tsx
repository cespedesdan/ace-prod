import Image from 'next/image'
import { Check, LockKeyhole, UsersRound } from 'lucide-react'

export default function RegistrationClosed() {
  return (
    <main className="tournament-page copa-ace-10-page registration-page min-h-screen text-white">
      <section className="tournament-hero copa10-hero registration-hero flex min-h-[calc(100vh-5rem)] items-center">
        <div className="copa10-hero-glow" aria-hidden="true" />
        <div className="tournament-container relative grid gap-8 py-10 lg:grid-cols-[1fr_380px] lg:py-14">
          <div>
            <div className="copa10-logo-lockup">
              <Image src="/copa-ace-10/copa-ace-logo-10-cropped.png" alt="Copa ACE" width={583} height={235} sizes="(min-width: 1024px) 583px, 90vw" />
            </div>
            <div className="registration-open-badge mt-7 inline-flex items-center gap-2 border bg-[#8f0000] px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#ffd276]">
              <span className="h-2 w-2 bg-[#ffd276]" /> Inscrições encerradas
            </div>
            <h1 className="mt-5 text-4xl font-black uppercase tracking-tight sm:text-6xl">Inscrições encerradas <span>na Copa ACE 10</span></h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">As inscrições desta edição foram encerradas. Consulte o regulamento e acompanhe a competição pela agenda.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-slate-300">
              <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-2"><UsersRound size={15} className="text-[#ffd276]" /> 16 equipes</span>
              <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-2"><LockKeyhole size={15} className="text-[#ffd276]" /> Inscrições encerradas</span>
              <a href="/Regulamento_Copa_Ace_10.pdf" target="_blank" rel="noreferrer" className="copa10-button-secondary">Regulamento</a>
            </div>
          </div>
          <aside className="registration-aside self-end border border-[#d99a28]/25 bg-black/30 p-5 backdrop-blur">
            <h2 className="font-black text-white">Acompanhe a Copa ACE 10</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {['Confira as equipes confirmadas', 'Veja datas e horários na agenda', 'Acompanhe resultados e classificação'].map((item) => (
                <li key={item} className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-[#ffd276]" /> {item}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </main>
  )
}
