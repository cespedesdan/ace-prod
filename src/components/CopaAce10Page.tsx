import Image from 'next/image'
import {
  ArrowRight,
  CalendarDays,
  CircleDashed,
  Gamepad2,
  Shield,
  Swords,
  Trophy,
  Users,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { CopaAce10Faceit, type CopaAce10FaceitData } from '@/components/CopaAce10Faceit'
import { CopaAce10Schedule } from '@/components/CopaAce10Schedule'
import { IntentLink } from '@/components/IntentLink'

const TOTAL_TEAMS = 16
const SHOW_CONFIRMED_SLOTS_BADGE = false // Troque para true para exibir novamente.

async function getConfirmedTeams() {
  return prisma.registration.findMany({
    where: { tournament: 'Copa Ace 10', status: 'APPROVED' },
    orderBy: { updatedAt: 'asc' },
    take: TOTAL_TEAMS,
    select: { id: true, teamName: true, teamTag: true },
  })
}

async function getFaceitChampionship(): Promise<CopaAce10FaceitData | null> {
  const championship = await prisma.faceitChampionship.findUnique({
    where: { tournament: 'Copa Ace 10' },
    select: { name: true, faceitUrl: true, status: true, format: true, seedingStrategy: true, totalRounds: true, syncedAt: true, teamsJson: true, matchesJson: true, resultsJson: true },
  })
  if (!championship) return null
  try {
    const teams = JSON.parse(championship.teamsJson)
    const matches = JSON.parse(championship.matchesJson)
    const results = JSON.parse(championship.resultsJson)
    if (!Array.isArray(teams) || !Array.isArray(matches) || !Array.isArray(results)) return null
    return { ...championship, teams, matches, results }
  } catch {
    return null
  }
}

function ConfirmedTeamLogo({ id, name, size = 52 }: { id: string; name: string; size?: number }) {
  return (
    <span className="team-logo-surface relative block shrink-0 overflow-hidden" style={{ width: size, height: size }}>
      <Image src={`/api/copa-ace-10/teams/${id}/logo`} alt={`Logo ${name}`} fill sizes={`${size}px`} className="object-contain p-1" />
    </span>
  )
}

export default async function CopaAce10Page() {
  const [teams, faceitChampionship] = await Promise.all([getConfirmedTeams(), getFaceitChampionship()])
  const availableSlots = TOTAL_TEAMS - teams.length
  const slots = Array.from({ length: TOTAL_TEAMS }, (_, index) => teams[index] ?? null)

  return (
    <main className="tournament-page copa-ace-10-page" data-deferred-stylesheet="/copa-ace-10/deferred-v1.css">
      <section className="tournament-hero copa10-hero">
        <div className="copa10-hero-glow" aria-hidden="true" />
        <div className="tournament-container relative py-8 lg:py-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative z-10">
              <div className="copa10-logo-lockup">
                <Image src="/copa-ace-10/copa-ace-logo-10-cropped.png" alt="Copa ACE" width={583} height={235} />
              </div>
              <p className="tournament-kicker mt-7">10ª edição · inscrições abertas</p>
              <h1 className="mt-3 max-w-3xl text-5xl uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl xl:text-[5.4rem]">
                A maior Copa ACE <span>de todos os tempos</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[#d8d8d8]">
                A edição comemorativa reúne 16 equipes em uma disputa intensa de Counter-Strike 2: fase suíça MD1 e mata-mata MD3.
              </p>

              <div className="copa10-facts mt-7 grid grid-cols-2 gap-px sm:grid-cols-4">
                <div><strong>R$ 1.500</strong><span>Premiação</span></div>
                <div><strong>16</strong><span>Equipes</span></div>
                <div><strong>Suíço</strong><span>Fase inicial</span></div>
                <div><strong>20 AGO</strong><span>Início</span></div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {/* <Link href="/inscreva-se" className="tournament-button-primary">Inscreva seu time <ArrowRight size={16} /></Link> */}
                <a href="/Regulamento_Copa_Ace_10.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="copa10-button-secondary">
                  Ver regulamento
                  </a>
              </div>
            </div>

            <div className="copa10-coin-stage" aria-label="Moeda comemorativa da Copa ACE 10">
              <div className="copa10-coin-orbit" aria-hidden="true" />
              <picture>
                <source media="(max-width: 1023px)" srcSet="/copa-ace-10/moeda-10-mobile.webp" type="image/webp" />
                <Image
                  src="/copa-ace-10/moeda-10.webp"
                  alt="Moeda dourada da décima edição da Copa ACE"
                  width={1356}
                  height={1400}
                  sizes="45vw"
                  className="copa10-coin"
                />
              </picture>
              {SHOW_CONFIRMED_SLOTS_BADGE && (
                <div className="copa10-slots-badge">
                  <span>Vagas confirmadas</span>
                  <strong>{teams.length}<small>/{TOTAL_TEAMS}</small></strong>
                  <p>{availableSlots > 0 ? `${availableSlots} disponíveis` : 'Vagas preenchidas'}</p>
                </div>
              )}
            </div>
          </div>

          <nav className="tournament-tabs">
            <a href="#resumo" aria-current="true">Resumo</a>
            <a href="#equipes">Times</a>
            <a href="#formato">Formato</a>
            <a href="#cronograma">Cronograma</a>
            {faceitChampionship && <a href="#faceit">FACEIT</a>}
            {faceitChampionship && <a href="#partidas">Partidas</a>}
            <a href="#premiacao">Premiação</a>
            <a href="#inscricao">Inscrição</a>
          </nav>
        </div>
      </section>

      <div className="tournament-container space-y-8 py-10">
        <section id="resumo" className="grid gap-4 md:grid-cols-4">
          {[
            { value: '16', label: 'Equipes', detail: 'Vagas totais', icon: Users },
            { value: 'Suíço', label: 'Fase de grupos', detail: 'Pareamento por campanha', icon: Shield },
            { value: 'MD1', label: 'Partidas suíças', detail: 'Melhor de um mapa', icon: Gamepad2 },
            { value: 'MD3', label: 'Mata-mata', detail: 'Melhor de três mapas', icon: Trophy },
          ].map((item) => (
            <article key={item.label} className="tournament-stat-card">
              <div className="mb-4 flex items-start justify-between">
                <item.icon size={28} className="tournament-accent-text" />
                <span className="text-2xl font-black text-[#ffd276]">{item.value}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <h3 className="mt-1 text-sm uppercase">{item.detail}</h3>
            </article>
          ))}
        </section>

        <section id="premiacao" className="deferred-render copa10-prize-panel">
          <div>
            <p className="tournament-section-eyebrow">Premiação total</p>
            <h2>R$ 1.500</h2>
            <div className="copa10-prize-breakdown" aria-label="Distribuição da premiação">
              <span><strong>1º</strong> R$ 1.000,00</span>
              <span><strong>2º</strong> R$ 500,00</span>
            </div>
            <p>Uma edição histórica merece uma disputa à altura.</p>
          </div>
          <Trophy size={74} aria-hidden="true" />
        </section>

        <CopaAce10Schedule />

        {faceitChampionship && <CopaAce10Faceit championship={faceitChampionship} />}

        <section id="equipes" className="deferred-render">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><p className="tournament-section-eyebrow">Participantes</p><h2 className="tournament-section-title">Equipes confirmadas</h2></div>
            {/* Texto de atualização administrativa desativado. */}
          </div>
          <article className="tournament-panel">
            <header className="tournament-panel-header flex items-center justify-between px-4 py-3">
              <h3 className="uppercase tracking-wide">Copa ACE 10</h3>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{teams.length}/{TOTAL_TEAMS} confirmadas</span>
            </header>
            <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {slots.map((team, index) => team ? (
                <div key={team.id} className="flex min-h-24 items-center gap-4 bg-white p-4">
                  <ConfirmedTeamLogo id={team.id} name={team.teamName} />
                  <div className="min-w-0"><p className="truncate font-black text-slate-900">{team.teamName}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] tournament-accent-text">{team.teamTag}</p></div>
                </div>
              ) : (
                <div key={`slot-${index}`} className="flex min-h-24 items-center gap-4 bg-slate-50 p-4 text-slate-400">
                  <span className="grid h-[52px] w-[52px] shrink-0 place-items-center bg-slate-200"><CircleDashed size={20} /></span>
                  <div><p className="text-[10px] font-black uppercase tracking-[0.14em]">Vaga {index + 1}</p><p className="mt-1 text-sm font-bold">A definir</p></div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section id="formato" className="deferred-render tournament-panel">
          <header className="tournament-panel-header flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
            <div><p className="tournament-kicker">Formato oficial</p><h2 className="mt-1 text-xl uppercase">Do suíço à grande final</h2></div>
            <span className="text-xs font-bold text-slate-400">16 equipes · Counter-Strike 2</span>
          </header>
          <div className="grid gap-px bg-slate-200 md:grid-cols-2">
            {[
              { step: '1', eyebrow: 'Primeira fase', title: 'Sistema suíço · MD1', text: 'Adversários definidos rodada a rodada por campanhas equivalentes. Todas as partidas são disputadas em um mapa.' },
              { step: '2', eyebrow: 'Estágio final', title: 'Mata-mata · MD3', text: 'As equipes classificadas entram na chave eliminatória, com séries melhor de três mapas até a grande final.' },
            ].map((phase) => (
              <div key={phase.step} className="bg-white p-6">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center tournament-accent-bg text-sm font-black text-[#050403]">{phase.step}</span><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{phase.eyebrow}</p><h3 className="uppercase text-slate-900">{phase.title}</h3></div></div>
                <p className="mt-5 text-sm leading-relaxed text-slate-600">{phase.text}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-between gap-4 border-t border-slate-200 p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center tournament-accent-bg text-[#050403]"><Swords size={23} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Primeira rodada</p><p className="mt-1 font-black text-slate-900">Pareamentos e horários a definir</p></div></div>
            <IntentLink href="/schedule" className="inline-flex items-center gap-2 text-sm font-black tournament-accent-text">Consultar agenda <ArrowRight size={16} /></IntentLink>
          </div>
        </section>

        <section id="inscricao" className="deferred-render copa10-registration-panel">
          <div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center border border-[#d99a28]/50 text-[#ffd276]"><CalendarDays size={23} /></div><div><p className="tournament-section-eyebrow">Inscrições abertas</p><h2>Monte seu elenco para a Copa ACE 10</h2><p>5 titulares, até 2 reservas e 1 coach, com logo e comprovante de pagamento.</p></div></div>
          <IntentLink href="/inscreva-se" className="tournament-button-primary">Inscrever equipe <ArrowRight size={16} /></IntentLink>
        </section>
      </div>
    </main>
  )
}
