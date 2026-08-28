import type { ReactNode } from 'react'
import Image from 'next/image'
import { CalendarDays, ChevronLeft, ExternalLink, Gamepad2, Medal, ShieldCheck, Swords, Trophy, Users } from 'lucide-react'
import { IntentLink } from './IntentLink'
import type {
  ArchiveMatch,
  ArchiveRound,
  ArchiveTeam,
  DoubleEliminationArchive,
  GroupDoubleEliminationArchive,
  GroupRoundRobinArchive,
  SingleEliminationArchive,
  TournamentArchive,
} from '@/data/tournamentArchives'

function TeamLogo({ team, size = 34 }: { team: ArchiveTeam; size?: number }) {
  if (!team.logo) {
    return (
      <span className="grid shrink-0 place-items-center rounded-sm bg-slate-700 font-black text-white" style={{ width: size, height: size, fontSize: Math.max(9, size * 0.26) }}>
        {team.shortName}
      </span>
    )
  }

  return (
    <span className={`${team.darkLogo ? 'team-logo-surface-dark' : 'team-logo-surface'} relative block shrink-0 overflow-hidden rounded-sm`} style={{ width: size, height: size }}>
      <Image src={team.logo} alt={`Logo ${team.name}`} fill sizes={`${size}px`} quality={60} className="object-contain p-1" />
    </span>
  )
}

function MatchCard({ match }: { match: ArchiveMatch }) {
  const aWon = match.scoreA > match.scoreB
  const bWon = match.scoreB > match.scoreA
  const card = (
    <article className="overflow-hidden border border-slate-300 bg-white shadow-sm">
      {(match.label || match.bestOf) && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
          <span>{match.label || 'Confronto'}</span>
          {match.bestOf && <span className="inline-flex items-center gap-1">MD{match.bestOf}{match.href && <ExternalLink size={10} />}</span>}
        </div>
      )}
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
  )

  return match.href
    ? <a href={match.href} target="_blank" rel="noreferrer" className="block transition hover:-translate-y-0.5">{card}</a>
    : card
}

function TournamentShell({ data, tabs, children }: { data: TournamentArchive; tabs: Array<{ href: string; label: string }>; children: ReactNode }) {
  return (
    <main className="tournament-page">
      <section className="tournament-hero">
        <div className="tournament-container py-6">
          <IntentLink href="/hall-of-fame" className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-slate-300 transition hover:text-white">
            <ChevronLeft size={16} /> Hall da Fama
          </IntentLink>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="tournament-kicker mb-3 flex items-center gap-2"><span className="h-2 w-2 bg-orange-500" /> Arquivo oficial · {data.edition}</div>
              <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl">{data.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">{data.description}</p>
              <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-300">
                <span className="flex items-center gap-2"><CalendarDays size={16} className="text-orange-400" /> {data.date}</span>
                <span className="flex items-center gap-2"><Gamepad2 size={16} className="text-orange-400" /> Counter-Strike 2</span>
                <span className="flex items-center gap-2"><Users size={16} className="text-orange-400" /> {data.teamCount} equipes</span>
              </div>
            </div>

            <div className="relative overflow-hidden border border-white/10 bg-white/5 p-5">
              <div className="absolute right-0 top-0 h-24 w-24 bg-orange-500/10 blur-2xl" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">{data.championLabel}</p>
              <div className="mt-3 flex items-center gap-5">
                <div className="grid h-24 w-24 place-items-center bg-white p-3 shadow-xl"><TeamLogo team={data.champion} size={72} /></div>
                <div><Trophy className="mb-2 text-orange-400" size={24} /><h2 className="text-2xl font-black">{data.champion.name}</h2><p className="mt-1 text-sm text-slate-400">{data.championRun}</p></div>
              </div>
            </div>
          </div>

          <nav className="tournament-tabs">
            {tabs.map((tab, index) => <a key={tab.href} href={tab.href} className={`${index === 0 ? 'text-white ' : ''}hover:text-orange-400`}>{tab.label}</a>)}
          </nav>
        </div>
      </section>

      <div className="tournament-container space-y-8 py-8">{children}</div>
    </main>
  )
}

function Summary({ data }: { data: TournamentArchive }) {
  return (
    <section id="resumo" className="grid gap-4 md:grid-cols-4">
      {data.summary.map((item) => (
        <article key={`${item.place}-${item.team.name}`} className="tournament-stat-card">
          <div className="mb-4 flex items-start justify-between"><TeamLogo team={item.team} size={52} /><span className="text-2xl font-black text-slate-300">{item.place}</span></div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
          <h3 className="mt-1 font-black text-slate-900">{item.team.name}</h3>
        </article>
      ))}
    </section>
  )
}

function Facts({ data }: { data: TournamentArchive }) {
  if (!data.facts) return null
  const icons = [Swords, ShieldCheck, Gamepad2, Users]
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {data.facts.map(({ label, value }, index) => {
        const Icon = icons[index] || Gamepad2
        return (
          <div key={label} className="brand-card flex items-center gap-4 p-4">
            <div className="grid h-10 w-10 place-items-center bg-copa-cyan/10 text-copa-cyan"><Icon size={19} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>
          </div>
        )
      })}
    </section>
  )
}

function FinalStandings({ standings, teamCount }: { standings: Array<{ place: string; team: ArchiveTeam }>; teamCount: number }) {
  return (
    <section id="classificacao" className="deferred-render tournament-panel">
      <header className="tournament-panel-header flex items-center justify-between px-5 py-4">
        <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">Resultado oficial</p><h2 className="mt-1 text-xl font-black uppercase">Classificação final</h2></div>
        <span className="hidden text-xs font-bold text-slate-400 sm:block">{teamCount} participantes</span>
      </header>
      <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
        {standings.map((standing) => (
          <div key={`${standing.place}-${standing.team.name}`} className="flex items-center gap-4 bg-white p-4">
            <span className="w-16 text-center text-base font-black text-orange-600">{standing.place}</span>
            <TeamLogo team={standing.team} size={40} />
            <span className="font-black text-slate-900">{standing.team.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function SourceLinks({ data }: { data: TournamentArchive }) {
  return data.sourceLinks.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-400">{link.label} <ExternalLink size={13} /></a>)
}

function ResultFooter({ data }: { data: TournamentArchive }) {
  return (
    <div className="grid gap-5 border-t border-slate-200 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center bg-orange-500 text-white"><Medal size={24} /></div>
        <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Resultado final</p><p className="mt-1 font-black text-slate-900">{data.resultText}</p></div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs font-bold">
        <SourceLinks data={data} />
      </div>
    </div>
  )
}

function BracketLane({ title, eyebrow, subtitle, rounds, footer }: { title: string; eyebrow: string; subtitle: string; rounds: ArchiveRound[]; footer?: ReactNode }) {
  const columns = rounds.length >= 4 ? 'min-w-[1240px] grid-cols-4' : rounds.length === 3 ? 'min-w-[920px] grid-cols-3' : 'min-w-[620px] grid-cols-2'
  return (
    <section className="deferred-render tournament-panel">
      <header className="tournament-panel-header flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center">
        <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">{eyebrow}</p><h2 className="mt-1 text-xl font-black uppercase">{title}</h2></div>
        <span className="text-xs font-bold text-slate-400">{subtitle}</span>
      </header>
      <div className="overflow-x-auto bg-slate-100 p-5 sm:p-7">
        <div className={`grid gap-10 ${columns}`}>
          {rounds.map((round, roundIndex) => (
            <div key={round.name} className="flex flex-col">
              <div className="mb-4 flex items-center gap-2"><span className="grid h-6 w-6 place-items-center bg-orange-500 text-xs font-black text-white">{roundIndex + 1}</span><h3 className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">{round.name}</h3></div>
              <div className="flex flex-1 flex-col justify-around gap-5">{round.matches.map((match, matchIndex) => <MatchCard key={`${round.name}-${match.label || matchIndex}`} match={match} />)}</div>
            </div>
          ))}
        </div>
      </div>
      {footer}
    </section>
  )
}

export function GroupRoundRobinTournamentPage({ data }: { data: GroupRoundRobinArchive }) {
  return (
    <TournamentShell data={data} tabs={[{ href: '#resumo', label: 'Resumo' }, { href: '#grupos', label: 'Fase de grupos' }, { href: '#mata-mata', label: 'Mata-mata' }]}>
      <Summary data={data} />
      <section id="grupos" className="deferred-render">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="tournament-section-eyebrow">Primeira fase</p><h2 className="tournament-section-title">Fase de grupos</h2></div><span className="hidden text-xs font-bold text-slate-500 sm:block">{data.groupSubtitle}</span></div>
        <div className="grid gap-5 xl:grid-cols-2">
          {data.groups.map((group) => (
            <article key={group.name} className="tournament-panel">
              <header className="tournament-panel-header flex items-center justify-between px-4 py-3"><h3 className="font-black uppercase tracking-wide">{group.name}</h3><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Classificação final</span></header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500"><tr><th className="w-12 px-3 py-2 text-center">#</th><th className="px-3 py-2 text-left">Equipe</th><th className="px-3 py-2 text-center">Campanha</th><th className="px-3 py-2 text-center">Vit.</th><th className="px-3 py-2 text-center">Saldo</th><th className="px-3 py-2 text-center">Rounds</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {group.standings.map((standing) => (
                      <tr key={standing.team.name} className={standing.qualified ? 'bg-orange-50/60' : ''}>
                        <td className="relative px-3 py-3 text-center font-black text-slate-500">{standing.qualified && <span className="absolute inset-y-0 left-0 w-1 bg-orange-500" />}{standing.position}</td>
                        <td className="px-3 py-3"><div className="flex items-center gap-3"><TeamLogo team={standing.team} size={30} /><span className="font-bold text-slate-800">{standing.team.name}</span>{standing.qualified && <span className="ml-auto text-[9px] font-black uppercase text-orange-600">Classificado</span>}</div></td>
                        <td className="px-3 py-3 text-center font-bold tabular-nums text-slate-700">{standing.record}</td><td className="px-3 py-3 text-center tabular-nums text-slate-500">{standing.wins}</td>
                        <td className={`px-3 py-3 text-center font-bold tabular-nums ${standing.roundDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{standing.roundDiff > 0 ? '+' : ''}{standing.roundDiff}</td><td className="px-3 py-3 text-center tabular-nums text-slate-500">{standing.rounds ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div id="mata-mata"><BracketLane title="Mata-mata" eyebrow="Estágio final" subtitle={data.playoffSubtitle} rounds={data.playoffRounds} footer={<ResultFooter data={data} />} /></div>
    </TournamentShell>
  )
}

export function GroupDoubleEliminationTournamentPage({ data }: { data: GroupDoubleEliminationArchive }) {
  return (
    <TournamentShell data={data} tabs={[{ href: '#resumo', label: 'Resumo' }, { href: '#grupos', label: 'Fase de grupos' }, { href: '#mata-mata', label: 'Mata-mata' }]}>
      <Summary data={data} />
      <section id="grupos" className="deferred-render" style={{ containIntrinsicSize: 'auto 4590px' }}>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="tournament-section-eyebrow">Primeira fase</p><h2 className="tournament-section-title">Fase de grupos</h2></div>
          <span className="hidden text-xs font-bold text-slate-500 sm:block">{data.groupSubtitle}</span>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {data.groupBrackets.map((group) => (
            <article key={group.name} className="tournament-panel">
              <header className="tournament-panel-header flex items-center justify-between px-4 py-3">
                <h3 className="font-black uppercase tracking-wide">{group.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">2 classificados</span>
              </header>
              <div className="space-y-5 bg-slate-100 p-4 sm:p-5">
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Chave superior</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {group.upperRounds.map((round) => (
                      <div key={round.name}>
                        <h4 className="mb-2 text-xs font-black uppercase tracking-[0.1em] text-slate-500">{round.name}</h4>
                        <div className="space-y-3">{round.matches.map((match, index) => <MatchCard key={`${round.name}-${index}`} match={match} />)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-5">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">Chave inferior</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {group.lowerRounds.map((round) => (
                      <div key={round.name}>
                        <h4 className="mb-2 text-xs font-black uppercase tracking-[0.1em] text-slate-500">{round.name}</h4>
                        <div className="space-y-3">{round.matches.map((match, index) => <MatchCard key={`${round.name}-${index}`} match={match} />)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">Classificados</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.qualifiers.map((team, index) => (
                      <div key={team.name} className="flex items-center gap-3 border border-slate-200 bg-white p-3">
                        <span className="text-xs font-black text-orange-600">{index + 1}º</span><TeamLogo team={team} size={32} /><span className="min-w-0 truncate text-sm font-black text-slate-900">{team.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div id="mata-mata"><BracketLane title="Mata-mata" eyebrow="Estágio final" subtitle={data.playoffSubtitle} rounds={data.playoffRounds} footer={<ResultFooter data={data} />} /></div>
    </TournamentShell>
  )
}

export function SingleEliminationTournamentPage({ data }: { data: SingleEliminationArchive }) {
  return (
    <TournamentShell data={data} tabs={[{ href: '#resumo', label: 'Resumo' }, { href: '#classificacao', label: 'Classificação' }, { href: '#chaveamento', label: 'Chaveamento' }]}>
      <Summary data={data} /><Facts data={data} /><FinalStandings standings={data.standings} teamCount={data.teamCount} />
      <div id="chaveamento"><BracketLane title="Chave eliminatória" eyebrow="Estágio único" subtitle={data.bracketSubtitle} rounds={data.rounds} footer={<ResultFooter data={data} />} /></div>
    </TournamentShell>
  )
}

export function DoubleEliminationTournamentPage({ data }: { data: DoubleEliminationArchive }) {
  return (
    <TournamentShell data={data} tabs={[{ href: '#resumo', label: 'Resumo' }, { href: '#classificacao', label: 'Classificação' }, { href: '#chaveamento', label: 'Chaveamento' }]}>
      <Summary data={data} /><Facts data={data} /><FinalStandings standings={data.standings} teamCount={data.teamCount} />
      <div id="chaveamento" className="space-y-8">
        <BracketLane title="Chave superior" eyebrow="Dupla eliminação" subtitle={data.upperSubtitle} rounds={data.upperRounds} />
        <BracketLane title="Chave inferior" eyebrow="Dupla eliminação" subtitle={data.lowerSubtitle} rounds={data.lowerRounds} />
        <section className="deferred-render tournament-panel">
          <header className="tournament-panel-header flex items-center justify-between px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">Decisão do título</p><h2 className="mt-1 text-xl font-black uppercase">Grande final · MD3</h2></div><Trophy className="text-orange-400" size={26} /></header>
          <div className="grid gap-8 bg-slate-100 p-6 lg:grid-cols-[1fr_340px] lg:items-center"><div className="flex items-center gap-5"><div className="grid h-14 w-14 place-items-center bg-orange-500 text-white"><Medal size={28} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Resultado final</p><p className="mt-1 text-xl font-black text-slate-900">{data.resultText}</p></div></div><MatchCard match={data.grandFinal} /></div>
          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center"><span>Placares e posições preservados conforme a chave oficial.</span><div className="flex flex-wrap gap-3 font-bold"><SourceLinks data={data} /></div></div>
        </section>
      </div>
    </TournamentShell>
  )
}
