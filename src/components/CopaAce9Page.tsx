import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, ExternalLink, Gamepad2, Medal, Trophy, Users } from 'lucide-react'
import { groups, playoffRounds, teams, type PlayoffMatch, type Team } from '@/data/copaAce9'

function TeamLogo({ team, size = 34 }: { team: Team; size?: number }) {
  if (!team.logo) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-sm bg-slate-700 font-black text-white"
        style={{ width: size, height: size, fontSize: Math.max(9, size * 0.28) }}
      >
        {team.shortName}
      </span>
    )
  }

  return (
    <span
      className={`team-logo-surface relative block shrink-0 overflow-hidden rounded-sm ${team.darkLogo ? 'team-logo-surface-dark' : ''}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={team.logo}
        alt={`Logo ${team.name}`}
        fill
        sizes={`${size}px`}
        className={`object-contain ${team.darkLogo ? 'p-1' : ''}`}
      />
    </span>
  )
}

function MatchCard({ match }: { match: PlayoffMatch }) {
  const aWon = match.scoreA > match.scoreB
  const bWon = match.scoreB > match.scoreA

  return (
    <article className="overflow-hidden border border-slate-300 bg-white shadow-sm">
      {match.label && (
        <div className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          {match.label}
        </div>
      )}
      <div className={`flex items-center gap-2 px-3 py-2.5 ${aWon ? 'bg-orange-50' : ''}`}>
        <TeamLogo team={match.teamA} size={25} />
        <span className={`min-w-0 flex-1 truncate text-sm ${aWon ? 'font-black text-slate-950' : 'font-semibold text-slate-600'}`}>
          {match.teamA.name}
        </span>
        <span className={`text-base font-black tabular-nums ${aWon ? 'text-orange-600' : 'text-slate-400'}`}>{match.scoreA}</span>
      </div>
      <div className={`flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 ${bWon ? 'bg-orange-50' : ''}`}>
        <TeamLogo team={match.teamB} size={25} />
        <span className={`min-w-0 flex-1 truncate text-sm ${bWon ? 'font-black text-slate-950' : 'font-semibold text-slate-600'}`}>
          {match.teamB.name}
        </span>
        <span className={`text-base font-black tabular-nums ${bWon ? 'text-orange-600' : 'text-slate-400'}`}>{match.scoreB}</span>
      </div>
    </article>
  )
}

export default function CopaAce9Page() {
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
                <span className="h-2 w-2 bg-orange-500" /> Arquivo oficial · 9ª edição
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl">Copa Ace 9</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
                Dezesseis equipes, quatro grupos e uma chave eliminatória. A campanha perfeita da GodNation terminou com o título diante da Lamba Esports.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-300">
                <span className="flex items-center gap-2"><CalendarDays size={16} className="text-orange-400" /> 7 de novembro de 2025</span>
                <span className="flex items-center gap-2"><Gamepad2 size={16} className="text-orange-400" /> Counter-Strike 2</span>
                <span className="flex items-center gap-2"><Users size={16} className="text-orange-400" /> 16 equipes</span>
              </div>
            </div>

            <div className="relative overflow-hidden border border-white/10 bg-white/5 p-5">
              <div className="absolute right-0 top-0 h-24 w-24 bg-orange-500/10 blur-2xl" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">Campeão</p>
              <div className="mt-3 flex items-center gap-5">
                <div className="grid h-24 w-24 place-items-center bg-white p-3 shadow-xl">
                  <TeamLogo team={teams.godNation} size={72} />
                </div>
                <div>
                  <Trophy className="mb-2 text-orange-400" size={24} />
                  <h2 className="text-2xl font-black">GodNation</h2>
                  <p className="mt-1 text-sm text-slate-400">3–0 nos playoffs</p>
                </div>
              </div>
            </div>
          </div>

          <nav className="tournament-tabs">
            <a href="#resumo" className="text-white hover:text-orange-400">Resumo</a>
            <a href="#grupos" className="hover:text-orange-400">Fase de grupos</a>
            <a href="#mata-mata" className="hover:text-orange-400">Mata-mata</a>
          </nav>
        </div>
      </section>

      <div className="tournament-container space-y-8 py-8">
        <section id="resumo" className="grid gap-4 md:grid-cols-4">
          {[
            { place: '1º', label: 'Campeão', team: teams.godNation, accent: 'border-orange-500' },
            { place: '2º', label: 'Vice-campeão', team: teams.lamba, accent: 'border-slate-400' },
            { place: '3–4º', label: 'Semifinalista', team: teams.saidera, accent: 'border-amber-600' },
            { place: '3–4º', label: 'Semifinalista', team: teams.choppinada, accent: 'border-slate-300' }
          ].map((item) => (
            <article key={item.team.name} className={`tournament-stat-card ${item.accent}`}>
              <div className="mb-4 flex items-start justify-between">
                <TeamLogo team={item.team} size={52} />
                <span className="text-2xl font-black text-slate-300">{item.place}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <h3 className="mt-1 font-black text-slate-900">{item.team.name}</h3>
            </article>
          ))}
        </section>

        <section id="grupos">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="tournament-section-eyebrow">Primeira fase</p>
              <h2 className="tournament-section-title">Fase de grupos</h2>
            </div>
            <span className="hidden text-xs font-bold text-slate-500 sm:block">Top 2 de cada grupo avançam</span>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {groups.map((group) => (
              <article key={group.name} className="tournament-panel">
                <header className="tournament-panel-header flex items-center justify-between px-4 py-3">
                  <h3 className="font-black uppercase tracking-wide">{group.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Classificação final</span>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                      <tr>
                        <th className="w-12 px-3 py-2 text-center">#</th>
                        <th className="px-3 py-2 text-left">Equipe</th>
                        <th className="px-3 py-2 text-center">V–D</th>
                        <th className="px-3 py-2 text-center">Vit.</th>
                        <th className="px-3 py-2 text-center">Saldo</th>
                        <th className="px-3 py-2 text-center">Rounds</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.standings.map((standing) => (
                        <tr key={standing.team.name} className={standing.qualified ? 'bg-orange-50/60' : ''}>
                          <td className="relative px-3 py-3 text-center font-black text-slate-500">
                            {standing.qualified && <span className="absolute inset-y-0 left-0 w-1 bg-orange-500" />}
                            {standing.position}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <TeamLogo team={standing.team} size={30} />
                              <span className="font-bold text-slate-800">{standing.team.name}</span>
                              {standing.qualified && <span className="ml-auto text-[9px] font-black uppercase text-orange-600">Classificado</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center font-bold tabular-nums text-slate-700">{standing.record}</td>
                          <td className="px-3 py-3 text-center tabular-nums text-slate-500">{standing.wins}</td>
                          <td className={`px-3 py-3 text-center font-bold tabular-nums ${standing.roundDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {standing.roundDiff > 0 ? '+' : ''}{standing.roundDiff}
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums text-slate-500">{standing.rounds}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="mata-mata" className="tournament-panel">
          <header className="tournament-panel-header flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">Estágio final</p>
              <h2 className="mt-1 text-xl font-black uppercase">Mata-mata</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">Eliminação simples · 8 equipes</span>
          </header>

          <div className="overflow-x-auto bg-slate-100 p-5 sm:p-7">
            <div className="grid min-w-[920px] grid-cols-3 gap-12">
              {playoffRounds.map((round, roundIndex) => (
                <div key={round.name} className="flex flex-col">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center bg-orange-500 text-xs font-black text-white">{roundIndex + 1}</span>
                    <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">{round.name}</h3>
                  </div>
                  <div className={`flex flex-1 flex-col justify-around ${roundIndex === 0 ? 'gap-4' : roundIndex === 1 ? 'gap-16 py-12' : 'py-36'}`}>
                    {round.matches.map((match) => (
                      <MatchCard key={`${match.teamA.name}-${match.teamB.name}`} match={match} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 border-t border-slate-200 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center bg-orange-500 text-white"><Medal size={24} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Resultado final</p>
                <p className="mt-1 font-black text-slate-900">GodNation campeã · Lamba Esports vice</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-bold">
              <a href="https://challonge.com/pt/CopaAce9/groups" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-orange-600">
                Dados dos grupos <ExternalLink size={13} />
              </a>
              <a href="https://challonge.com/pt/CopaAce9" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-orange-600">
                Chave original <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
