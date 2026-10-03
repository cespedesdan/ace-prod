import type { FaceitChampionshipSnapshot } from '@/lib/faceit'
import { faceitMatchWinnerTeamId } from '@/lib/faceit'
import { faceitBracketRounds } from '@/lib/faceit-public'
import { buildDoubleEliminationBracket } from '@/lib/double-elimination-bracket'
import { BracketLane, MatchCard } from './TournamentFormatPage'

const cardWidth = 250
const columnWidth = 310
const rowHeight = 170

export function FaceitDoubleEliminationBracket({ matches }: { matches: FaceitChampionshipSnapshot['matches'] }) {
  const bracket = buildDoubleEliminationBracket(matches)
  const upperColumns = bracket.columns.filter((column) => column.lane === 'upper')
  const lowerColumns = bracket.columns.filter((column) => column.lane === 'lower')
  const upperHeight = upperColumns[0].nodes.length * rowHeight
  const lowerHeight = lowerColumns[0].nodes.length * rowHeight
  const lowerTop = upperHeight + 105
  const height = lowerTop + lowerHeight + 60
  const finalColumn = Math.max(upperColumns.length, lowerColumns.length)
  const width = (finalColumn + 1) * columnWidth
  const positions = new Map(bracket.columns.flatMap((column) => {
    const x = (column.lane === 'final' ? finalColumn : column.round - 1) * columnWidth + 20
    const areaHeight = column.lane === 'lower' ? lowerHeight : upperHeight
    const top = column.lane === 'lower' ? lowerTop : 55
    return column.nodes.map((node) => [node.id, { x, y: column.lane === 'final' ? (upperHeight + lowerTop) / 2 - 55 + node.slot * rowHeight : top + areaHeight * (node.slot + 0.5) / column.nodes.length - 60 }] as const)
  }))
  const futureEntrants = (id: string) => bracket.edges.filter((edge) => edge.to === id).map((edge) => {
    const source = bracket.columns.flatMap((column) => column.nodes).find((node) => node.id === edge.from)!
    const winner = source.match && faceitMatchWinnerTeamId(source.match)
    const team = winner && source.match?.teams.find((entrant) => edge.outcome === 'winner' ? entrant.teamId === winner : entrant.teamId !== winner)
    const origin = bracket.columns.find((column) => column.lane === source.lane && column.round === source.round)!.title
    return team ? { name: team.name, shortName: team.name.slice(0, 3), logo: team.avatarUrl || undefined }
      : { name: `${edge.outcome === 'winner' ? 'Vencedor' : 'Derrotado'} ${origin}`, shortName: '?' }
  })
  return (
    <div className="space-y-5">
      <section className="tournament-panel double-bracket">
        <header className="tournament-panel-header px-5 py-4">
          <p className="tournament-kicker">Dupla eliminação</p>
          <h2 className="mt-1 text-xl font-black uppercase">Chaveamento</h2>
          <p className="mt-2 text-sm text-slate-300">Vencedores avançam; a primeira derrota leva à chave inferior. A segunda elimina.</p>
        </header>
        <p className="px-5 pt-4 text-xs text-slate-300">Linha contínua: avanço confirmado · Tracejada: caminho futuro ou descida para a lower. No celular, deslize o quadro para os lados.</p>
        <div className="double-bracket-scroll" tabIndex={0} role="region" aria-label="Chaveamento de dupla eliminação, com rolagem horizontal">
          <div className="double-bracket-board" style={{ width, height }}>
            <svg width={width} height={height} aria-hidden="true" className="double-bracket-lines">
              <defs><marker id="double-bracket-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6" /></marker></defs>
              {bracket.edges.map((edge) => {
                const from = positions.get(edge.from)!
                const to = positions.get(edge.to)!
                const startX = from.x + cardWidth
                const endX = to.x
                const bendX = edge.outcome === 'loser' ? startX + 12 : (startX + endX) / 2
                return <path key={`${edge.from}-${edge.to}-${edge.outcome}`} d={`M ${startX} ${from.y + 60} H ${bendX} V ${to.y + 60} H ${endX}`}
                  markerEnd="url(#double-bracket-arrow)" className={edge.outcome === 'loser' ? 'double-bracket-drop' : ''} strokeDasharray={edge.pending || edge.outcome === 'loser' ? '5 5' : undefined} />
              })}
            </svg>
            <h3 className="double-bracket-lane" style={{ top: 5 }}>Chave superior</h3>
            <h3 className="double-bracket-lane" style={{ top: lowerTop - 45 }}>Chave inferior</h3>
            {bracket.columns.map((column) => {
              const position = positions.get(column.nodes[0].id)!
              return <h4 key={`${column.lane}-${column.round}`} className="double-bracket-round" style={{ left: position.x, top: column.lane === 'lower' ? lowerTop - 15 : 35 }}>{column.title}</h4>
            })}
            {bracket.columns.flatMap((column) => column.nodes.map((node) => {
              const position = positions.get(node.id)!
              const entrants = futureEntrants(node.id)
              const match = node.match ? faceitBracketRounds([node.match])[0].matches[0] : {
                label: 'Confronto a definir', teamA: entrants[0] || { name: 'A definir', shortName: '?' }, teamB: entrants[1] || { name: 'A definir', shortName: '?' }, scoreA: null, scoreB: null,
              }
              return <div key={node.id} className="double-bracket-node" style={{ left: position.x, top: position.y, width: cardWidth }}
                aria-label={`${column.title}, confronto ${node.slot + 1}`}><MatchCard match={match} /></div>
            }))}
          </div>
        </div>
      </section>
      {bracket.unplaced.length > 0 && <BracketLane title="Confrontos aguardando posição na chave" eyebrow="Partidas oficiais FACEIT" subtitle="Resultados preservados" rounds={faceitBracketRounds(bracket.unplaced)} />}
    </div>
  )
}
