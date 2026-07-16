import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, ExternalLink, Gamepad2, Medal, ShieldCheck, Swords, Trophy, Users } from 'lucide-react'
import {
  aceClutch2Teams,
  faceitTournamentUrl,
  finalStandings,
  grandFinal,
  lowerBracket,
  upperBracket,
  type AceClutchMatch,
  type AceClutchTeam,
} from '@/data/aceClutch2'

function TeamLogo({ team, size = 34 }: { team: AceClutchTeam; size?: number }) {
  if (!team.logo) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-sm bg-slate-700 font-black text-white"
        style={{ width: size, height: size, fontSize: Math.max(9, size * 0.26) }}
      >
        {team.shortName}
      </span>
    )
  }

  return (
    <span className={`${team.name === 'Dragons White' ? 'team-logo-surface-dark' : 'team-logo-surface'} relative block shrink-0 overflow-hidden rounded-sm`} style={{ width: size, height: size }}>
      <Image src={team.logo} alt={`Logo ${team.name}`} fill sizes={`${size}px`} className="object-contain p-1" />
    </span>
  )
}

function MatchCard({ match }: { match: AceClutchMatch }) {
  const aWon = match.scoreA > match.scoreB
  const bWon = match.scoreB > match.scoreA

  return (
    <a href={match.href} target="_blank" rel="noreferrer" className="block transition hover:-translate-y-0.5 hover:border-copa-cyan">
      <article className="overflow-hidden border border-slate-300 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
          <span>{match.label}</span>
          <span className="inline-flex items-center gap-1">MD{match.bestOf} <ExternalLink size={10} /></span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2.5 ${aWon ? 'bg-orange-50' : ''}`}>
          <TeamLogo team={match.teamA} size={25} />
          <span className={`min-w-0 flex-1 truncate text-sm ${aWon ? 'font-black text-slate-950' : 'font-semibold text-slate-600'}`}>{match.teamA.name}</span>
          <span className={`text-base font-black tabular-nums ${aWon ? 'text-orange-600' : 'text-slate-400'}`}>{match.scoreA}</span>
        </div>
        <div className={`flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 ${bWon ? 'bg-orange-50' : ''}`}>
          <TeamLogo team={match.teamB} size={25} />
          <span className={`min-w-0 flex-1 truncate text-sm ${bWon ? 'font-black text-slate-950' : 'font-semibold text-slate-600'}`}>{match.teamB.name}</span>
          <span className={`text-base font-black tabular-nums ${bWon ? 'text-orange-600' : 'text-slate-400'}`}>{match.scoreB}</span>
        </div>
      </article>
    </a>
  )
}

function BracketLane({ title, subtitle, rounds }: { title: string; subtitle: string; rounds: typeof upperBracket }) {
  const layout = rounds.length === 4 ? 'min-w-[1180px] grid-cols-4' : 'min-w-[900px] grid-cols-3'

  return (
    <section className="tournament-panel">
      <header className="tournament-panel-header flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">Dupla eliminação</p>
          <h2 className="mt-1 text-xl font-black uppercase">{title}</h2>
        </div>
        <span className="text-xs font-bold text-slate-400">{subtitle}</span>
      </header>
      <div className="overflow-x-auto bg-slate-100 p-5 sm:p-7">
        <div className={`grid gap-10 ${layout}`}>
          {rounds.map((round, roundIndex) => (
            <div key={round.name} className="flex flex-col">
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center bg-orange-500 text-xs font-black text-white">{roundIndex + 1}</span>
                <h3 className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">{round.name}</h3>
              </div>
              <div className="flex flex-1 flex-col justify-around gap-5">
                {round.matches.map((match) => <MatchCard key={match.label} match={match} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function AceClutch2Page() {
  return (
    <main className="tournament-page">
      <section className="tournament-hero">
        <div className="tournament-container py-6">
          <Link href="/hall-of-fame" className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-slate-300 transition hover:text-white">
            <ChevronLeft size={16} /> Hall da Fama
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="tournament-kicker mb-3 flex items-center gap-2">
                <span className="h-2 w-2 bg-orange-500" /> Arquivo oficial · 2ª edição
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl">Ace Clutch 2</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
                Oito equipes em uma chave de dupla eliminação. A NOX CLAN atravessou a upper invicta e venceu a Last AuAu por 2–0 na grande final.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-300">
                <span className="flex items-center gap-2"><CalendarDays size={16} className="text-orange-400" /> 27 de setembro de 2025</span>
                <span className="flex items-center gap-2"><Gamepad2 size={16} className="text-orange-400" /> Counter-Strike 2</span>
                <span className="flex items-center gap-2"><Users size={16} className="text-orange-400" /> 8 equipes</span>
              </div>
            </div>

            <div className="relative overflow-hidden border border-white/10 bg-white/5 p-5">
              <div className="absolute right-0 top-0 h-24 w-24 bg-orange-500/10 blur-2xl" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">Campeã</p>
              <div className="mt-3 flex items-center gap-5">
                <div className="grid h-24 w-24 place-items-center bg-white p-3 shadow-xl"><TeamLogo team={aceClutch2Teams.nox} size={72} /></div>
                <div>
                  <Trophy className="mb-2 text-orange-400" size={24} />
                  <h2 className="text-2xl font-black">NOX CLAN</h2>
                  <p className="mt-1 text-sm text-slate-400">4–0 no torneio</p>
                </div>
              </div>
            </div>
          </div>

          <nav className="tournament-tabs">
            <a href="#resumo" className="text-white hover:text-orange-400">Resumo</a>
            <a href="#classificacao" className="hover:text-orange-400">Classificação</a>
            <a href="#chaveamento" className="hover:text-orange-400">Chaveamento</a>
          </nav>
        </div>
      </section>

      <div className="tournament-container space-y-8 py-8">
        <section id="resumo" className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Campeã', team: aceClutch2Teams.nox, place: '1º' },
            { label: 'Vice-campeã', team: aceClutch2Teams.lastAuAu, place: '2º' },
            { label: 'Finalista lower', team: aceClutch2Teams.ufmg, place: '3º' },
            { label: 'Top 4', team: aceClutch2Teams.bala, place: '4º' },
          ].map((item) => (
            <article key={item.team.name} className="tournament-stat-card">
              <div className="mb-4 flex items-start justify-between">
                <TeamLogo team={item.team} size={52} />
                <span className="text-2xl font-black text-slate-300">{item.place}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <h3 className="mt-1 font-black text-slate-900">{item.team.name}</h3>
            </article>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Swords, label: 'Formato', value: 'Dupla eliminação' },
            { icon: ShieldCheck, label: 'Anti-cheat', value: 'Obrigatório' },
            { icon: Gamepad2, label: 'Partidas', value: '14 confrontos' },
            { icon: Users, label: 'Configuração', value: '5 contra 5' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="brand-card flex items-center gap-4 p-4">
              <div className="grid h-10 w-10 place-items-center bg-copa-cyan/10 text-copa-cyan"><Icon size={19} /></div>
              <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>
            </div>
          ))}
        </section>

        <section id="classificacao" className="tournament-panel">
          <header className="tournament-panel-header flex items-center justify-between px-5 py-4">
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">Resultado oficial</p><h2 className="mt-1 text-xl font-black uppercase">Classificação final</h2></div>
            <span className="hidden text-xs font-bold text-slate-400 sm:block">8 participantes</span>
          </header>
          <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
            {finalStandings.map((standing) => (
              <div key={standing.team.name} className="flex items-center gap-4 bg-white p-4">
                <span className="w-14 text-center text-lg font-black text-orange-600">{standing.place}</span>
                <TeamLogo team={standing.team} size={40} />
                <span className="font-black text-slate-900">{standing.team.name}</span>
              </div>
            ))}
          </div>
        </section>

        <div id="chaveamento" className="space-y-8">
          <BracketLane title="Chave superior" subtitle="7 partidas · todas MD1" rounds={upperBracket} />
          <BracketLane title="Chave inferior" subtitle="5 MD1 · final lower MD3" rounds={lowerBracket} />

          <section className="tournament-panel">
            <header className="tournament-panel-header flex items-center justify-between px-5 py-4">
              <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">Decisão do título</p><h2 className="mt-1 text-xl font-black uppercase">Grande final · MD3</h2></div>
              <Trophy className="text-orange-400" size={26} />
            </header>
            <div className="grid gap-8 bg-slate-100 p-6 lg:grid-cols-[1fr_340px] lg:items-center">
              <div className="flex items-center gap-5">
                <div className="grid h-14 w-14 place-items-center bg-orange-500 text-white"><Medal size={28} /></div>
                <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Resultado final</p><p className="mt-1 text-xl font-black text-slate-900">NOX CLAN campeã · Last AuAu vice</p><p className="mt-2 text-sm text-slate-500">Série encerrada em 2–0.</p></div>
              </div>
              <MatchCard match={grandFinal} />
            </div>
            <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
              <span>Placares e posições preservados conforme a chave oficial da FACEIT.</span>
              <a href={faceitTournamentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-orange-600 hover:text-orange-400">Ver torneio original <ExternalLink size={13} /></a>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
