import type { FaceitChampionshipSnapshot } from '@/lib/faceit'
import { faceitMatchWinnerTeamId } from '@/lib/faceit'
import { faceitDoubleElimination } from '@/lib/faceit-public'

type Match = FaceitChampionshipSnapshot['matches'][number]
type Lane = 'upper' | 'lower' | 'final'
export type BracketNode = { id: string; lane: Lane; round: number; slot: number; match?: Match }

export function buildDoubleEliminationBracket(matches: Match[]) {
  const lanes = faceitDoubleElimination(matches)
  const teamCount = new Set(matches.flatMap((match) => match.teams.map((team) => team.teamId))).size
  const size = 2 ** Math.ceil(Math.log2(Math.max(4, teamCount)))
  const upperRoundCount = Math.log2(size)
  const lowerRoundCount = 2 * (upperRoundCount - 1)
  const columns: Array<{ lane: Lane; round: number; title: string; nodes: BracketNode[] }> = []
  const assigned = new Set<string>()
  const add = (lane: Lane, round: number, count: number, title: string, available: Match[]) => {
    const ordered = [...available].sort((a, b) => a.matchId.localeCompare(b.matchId))
    const nodes = Array.from({ length: Math.max(count, ordered.length) }, (_, slot) => {
      const match = ordered[slot]
      if (match) assigned.add(match.matchId)
      return { id: `${lane}-${round}-${slot}`, lane, round, slot, match }
    })
    columns.push({ lane, round, title, nodes })
  }
  for (let round = 1; round <= upperRoundCount; round++) {
    add('upper', round, size / 2 ** round,
      round === upperRoundCount ? 'Final upper' : round === upperRoundCount - 1 ? 'Semifinais upper' : `Upper · rodada ${round}`,
      lanes[0].matches.filter((match) => match.round === round))
  }
  for (let round = 1; round <= lowerRoundCount; round++) {
    add('lower', round, size / 2 ** (Math.ceil(round / 2) + 1),
      round === lowerRoundCount ? 'Final lower' : `Lower · rodada ${round}`,
      lanes[1].matches.filter((match) => match.round === round))
  }
  add('final', 1, 1, 'Grande final', lanes[2].matches)

  // Place predecessors together by actual team progression, never by match time.
  for (const lane of ['upper', 'lower'] as const) {
    const rounds = columns.filter((column) => column.lane === lane)
    for (let index = rounds.length - 2; index >= 0; index--) {
      const target = rounds[index + 1]
      rounds[index].nodes.sort((a, b) => {
        const destination = (node: BracketNode) => {
          const winner = node.match && faceitMatchWinnerTeamId(node.match)
          const slot = winner ? target.nodes.findIndex((next) => next.match?.teams.some((team) => team.teamId === winner)) : -1
          return slot < 0 ? Number.MAX_SAFE_INTEGER : slot
        }
        return destination(a) - destination(b) || a.id.localeCompare(b.id)
      })
      rounds[index].nodes.forEach((node, slot) => { node.slot = slot })
    }
  }

  const nodes = columns.flatMap((column) => column.nodes)
  const edges: Array<{ from: string; to: string; outcome: 'winner' | 'loser'; pending: boolean }> = []
  for (const node of nodes) {
    if (!node.match) continue
    const winner = faceitMatchWinnerTeamId(node.match)
    if (!winner) continue
    for (const team of node.match.teams) {
      const outcome = team.teamId === winner ? 'winner' : 'loser'
      if (outcome === 'loser' && node.lane !== 'upper') continue
      const destination = nodes.find((next) => next.match && next.id !== node.id
        && (outcome === 'loser' ? next.lane === 'lower' : next.lane === 'final' || (next.lane === node.lane && next.round === node.round + 1))
        && next.match.teams.some((entrant) => entrant.teamId === team.teamId)
        && (outcome !== 'loser' || next.round === (node.round === 1 ? 1 : 2 * node.round - 2)))
      if (destination) edges.push({ from: node.id, to: destination.id, outcome, pending: false })
    }
  }
  // Standard winner paths reserve future slots; loser drops need verified entrants.
  for (const column of columns) {
    const next = columns.find((target) => target.lane === column.lane && target.round === column.round + 1)
      ?? (column.lane !== 'final' ? columns.find((target) => target.lane === 'final') : undefined)
    if (!next) continue
    for (const node of column.nodes) {
      if (edges.some((edge) => edge.from === node.id && edge.outcome === 'winner')) continue
      const target = next.nodes[next.nodes.length < column.nodes.length ? Math.floor(node.slot / 2) : node.slot]
      if (target && (!node.match || !target.match)) edges.push({ from: node.id, to: target.id, outcome: 'winner', pending: true })
    }
  }
  // The loser of the upper final always enters the single lower-final slot.
  const upperFinal = columns.find((column) => column.lane === 'upper' && column.round === upperRoundCount)!
  const lowerFinal = columns.find((column) => column.lane === 'lower' && column.round === lowerRoundCount)!
  for (const node of upperFinal.nodes) {
    const target = lowerFinal.nodes[0]
    if (!target.match && !edges.some((edge) => edge.from === node.id && edge.outcome === 'loser')) {
      edges.push({ from: node.id, to: target.id, outcome: 'loser', pending: true })
    }
  }
  return { size, columns, edges, unplaced: matches.filter((match) => !assigned.has(match.matchId)) }
}
