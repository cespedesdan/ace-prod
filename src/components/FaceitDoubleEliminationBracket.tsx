import type { FaceitChampionshipSnapshot } from '@/lib/faceit'
import { faceitMatchWinnerTeamId } from '@/lib/faceit'
import { faceitBracketRounds } from '@/lib/faceit-public'
import { buildDoubleEliminationBracket, type BracketNode } from '@/lib/double-elimination-bracket'
import type { ArchiveMatch, ArchiveRound } from '@/data/tournamentArchives'
import { BracketLane, MatchCard } from './TournamentFormatPage'

export function FaceitDoubleEliminationBracket({ matches }: { matches: FaceitChampionshipSnapshot['matches'] }) {
  const bracket = buildDoubleEliminationBracket(matches)
  const futureEntrants = (id: string) => bracket.edges.filter((edge) => edge.to === id).map((edge) => {
    const source = bracket.columns.flatMap((column) => column.nodes).find((node) => node.id === edge.from)!
    const winner = source.match && faceitMatchWinnerTeamId(source.match)
    const team = winner && source.match?.teams.find((entrant) => edge.outcome === 'winner' ? entrant.teamId === winner : entrant.teamId !== winner)
    const origin = bracket.columns.find((column) => column.lane === source.lane && column.round === source.round)!.title
    return team ? { name: team.name, shortName: team.name.slice(0, 3), logo: team.avatarUrl || undefined }
      : { name: `${edge.outcome === 'winner' ? 'Vencedor' : 'Derrotado'} ${origin}`, shortName: '?' }
  })
  const matchFor = (node: BracketNode): ArchiveMatch => {
    if (node.match) return faceitBracketRounds([node.match])[0].matches[0]
    const entrants = futureEntrants(node.id)
    return {
      label: 'Confronto a definir',
      teamA: entrants[0] || { name: 'A definir', shortName: '?' },
      teamB: entrants[1] || { name: 'A definir', shortName: '?' },
      scoreA: null, scoreB: null,
    }
  }
  const roundsFor = (lane: 'upper' | 'lower'): ArchiveRound[] => bracket.columns
    .filter((column) => column.lane === lane)
    .map((column) => ({ name: column.title, matches: column.nodes.map(matchFor) }))
  const finals = bracket.columns.filter((column) => column.lane === 'final').flatMap((column) => column.nodes)
  return (
    <div className="faceit-double-bracket space-y-8">
      <BracketLane title="Chave superior" eyebrow="Dupla eliminação"
        subtitle="Vencedores avançam; a primeira derrota leva à chave inferior." rounds={roundsFor('upper')} />
      <BracketLane title="Chave inferior" eyebrow="Dupla eliminação"
        subtitle="A segunda derrota elimina a equipe." rounds={roundsFor('lower')} />
      <section className="tournament-panel">
        <header className="tournament-panel-header px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">Decisão do título</p>
          <h2 className="mt-1 text-xl font-black uppercase">Grande final</h2>
        </header>
        <div className="grid gap-8 bg-slate-100 p-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <p className="text-sm text-slate-600">O vencedor da chave superior enfrenta o vencedor da chave inferior.</p>
          <div className="space-y-5">{finals.map((node) => <MatchCard key={node.id} match={matchFor(node)} />)}</div>
        </div>
      </section>
      {bracket.unplaced.length > 0 && <BracketLane title="Confrontos aguardando posição na chave" eyebrow="Partidas oficiais FACEIT" subtitle="Resultados preservados" rounds={faceitBracketRounds(bracket.unplaced)} />}
    </div>
  )
}
