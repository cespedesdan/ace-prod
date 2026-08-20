import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { copaAce8Teams } from '../src/data/copaAce8'
import { copaAce7Teams } from '../src/data/copaAce7'
import { tournamentArchives } from '../src/data/tournamentArchives'
import { buildFaceitSwissStandings, type FaceitChampionshipSnapshot } from '../src/lib/faceit'

const copa9 = tournamentArchives['copa-ace-9']
const copa8 = tournamentArchives['copa-ace-8']
const copa7 = tournamentArchives['copa-ace-7']
const clutch1 = tournamentArchives['ace-clutch']
const clutch2 = tournamentArchives['ace-clutch-2']

assert.equal(copa9.format, 'GROUP_ROUND_ROBIN_SINGLE_ELIMINATION')
assert.ok(copa9.playoffRounds.every((round) => round.matches.every((match) => match.bestOf === 3)))

assert.equal(copa7.format, 'GROUP_DOUBLE_ELIMINATION_SINGLE_ELIMINATION')
assert.equal(copa7.groupBrackets.length, 4)
assert.ok(copa7.groupBrackets.every((group) => group.upperRounds.flatMap((round) => round.matches).length === 3))
assert.ok(copa7.groupBrackets.every((group) => group.lowerRounds.flatMap((round) => round.matches).length === 2))
assert.ok(copa7.groupBrackets.every((group) => [...group.upperRounds, ...group.lowerRounds].every((round) => round.matches.every((match) => match.bestOf === 1))))
assert.ok(copa7.playoffRounds.every((round) => round.matches.every((match) => match.bestOf === 3)))
assert.ok(copa7.playoffRounds.slice(0, -1).every((round) => round.matches.every((match) => match.href?.includes('/cs2/room/'))))
assert.equal(copa7.playoffRounds.at(-1)?.matches[0]?.scoreA, 0)
assert.equal(copa7.playoffRounds.at(-1)?.matches[0]?.scoreB, 2)
assert.ok(Object.values(copaAce7Teams).every((team) => team.logo && existsSync(`public${team.logo}`)))

assert.equal(copa8.format, 'GROUP_ROUND_ROBIN_SINGLE_ELIMINATION')
assert.equal(copa8.groups.length, 4)
assert.ok(copa8.groups.every((group) => group.standings.length === 4))
assert.ok(copa8.playoffRounds.every((round) => round.matches.every((match) => match.bestOf === 3)))
assert.equal(copa8.playoffRounds.at(-1)?.matches[0]?.scoreA, 2)
assert.equal(copa8.playoffRounds.at(-1)?.matches[0]?.scoreB, 1)
assert.ok(Object.values(copaAce8Teams).every((team) => team.logo && existsSync(`public${team.logo}`)))

assert.equal(clutch1.format, 'SINGLE_ELIMINATION')
assert.equal(clutch1.rounds.at(-1)?.matches[0]?.bestOf, 3)

assert.equal(clutch2.format, 'DOUBLE_ELIMINATION')
assert.equal(clutch2.lowerRounds.at(-1)?.matches[0]?.bestOf, 3)
assert.equal(clutch2.grandFinal.bestOf, 3)

const swissTeams = [
  { teamId: 'a', name: 'Alpha' },
  { teamId: 'b', name: 'Bravo' },
] as FaceitChampionshipSnapshot['teams']
const swissMatches = [{
  matchId: '1', round: 1, group: null, bestOf: 1, scheduledAt: null, status: 'FINISHED', faceitUrl: null,
  winner: 'faction1', scores: { faction1: 1, faction2: 0 },
  teams: [
    { faction: 'faction1', teamId: 'a', name: 'Alpha', avatarUrl: null },
    { faction: 'faction2', teamId: 'b', name: 'Bravo', avatarUrl: null },
  ],
}] as FaceitChampionshipSnapshot['matches']
const swissStandings = buildFaceitSwissStandings(swissTeams, swissMatches)
assert.deepEqual(swissStandings.map(({ name, wins, losses, scoreBalance }) => ({ name, wins, losses, scoreBalance })), [
  { name: 'Alpha', wins: 1, losses: 0, scoreBalance: 1 },
  { name: 'Bravo', wins: 0, losses: 1, scoreBalance: -1 },
])

console.log('Tournament format checks passed.')
