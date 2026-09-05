import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { copaAce8Teams } from '../src/data/copaAce8'
import { copaAce7Teams } from '../src/data/copaAce7'
import { hallOfFameEditions } from '../src/data/hallOfFame'
import { tournamentArchives } from '../src/data/tournamentArchives'
import { buildFaceitSwissStandings, type FaceitChampionshipSnapshot } from '../src/lib/faceit'
import { buildSwissRounds } from '../src/components/CopaAce10Swiss'
import { buildPlayoffRounds } from '../src/components/CopaAce10Faceit'
import { organizeSchedule } from '../src/components/ScheduleList'

const copa9 = tournamentArchives['copa-ace-9']
const copa8 = tournamentArchives['copa-ace-8']
const copa7 = tournamentArchives['copa-ace-7']
const clutch1 = tournamentArchives['ace-clutch']
const clutch2 = tournamentArchives['ace-clutch-2']

function collectLogoPaths(value: unknown, paths = new Set<string>()) {
  if (!value || typeof value !== 'object') return paths
  if ('logo' in value && typeof value.logo === 'string') paths.add(value.logo)
  for (const child of Array.isArray(value) ? value : Object.values(value)) collectLogoPaths(child, paths)
  return paths
}

const archiveLogoPaths = collectLogoPaths(tournamentArchives)
for (const edition of hallOfFameEditions) archiveLogoPaths.add(edition.logo)
assert.ok(archiveLogoPaths.size >= 70)
assert.ok([...archiveLogoPaths].every((logo) => logo.endsWith('.webp') && existsSync(`public${logo}`)))

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

const swissStage = buildSwissRounds(swissMatches, swissTeams)
assert.deepEqual(swissStage.rounds.map(({ groups }) => groups.map(({ record }) => record)), [
  ['0-0'],
  ['1-0', '0-1'],
  ['2-0', '1-1', '0-2'],
  ['2-1', '1-2'],
  ['2-2'],
])
assert.equal(swissStage.rounds[0].groups[0].matches.length, 1)
assert.deepEqual(swissStage.campaigns.get('a'), { wins: 1, losses: 0 })

const playoffStage = buildPlayoffRounds([{ ...swissMatches[0], winner: null, status: 'SCHEDULED', scores: {}, bestOf: 3 }])
assert.deepEqual(playoffStage.map((round) => round.name), ['Quartas de final', 'Semifinais', 'Grande final'])
assert.deepEqual(playoffStage.map((round) => round.matches.length), [4, 2, 1])
assert.deepEqual(playoffStage[0].matches[0].scoreA, null)
assert.deepEqual(playoffStage[0].matches[0].scoreB, null)
assert.equal(playoffStage[0].matches[0].bestOf, 3)

const terminalMatches = [1, 2, 3].map((round) => ({ ...swissMatches[0], matchId: String(round), round }))
const cancelledTerminalMatch = {
  ...swissMatches[0], matchId: 'cancelled', round: 4, status: 'CANCELLED', scores: { faction1: 0, faction2: 0 },
}
const terminalMatchesWithCancellation = [...terminalMatches, cancelledTerminalMatch]
const terminalStandings = buildFaceitSwissStandings(swissTeams, terminalMatchesWithCancellation)
assert.deepEqual(terminalStandings.map(({ name, wins, losses }) => ({ name, wins, losses })), [
  { name: 'Alpha', wins: 3, losses: 0 },
  { name: 'Bravo', wins: 0, losses: 3 },
])
const terminalStage = buildSwissRounds(terminalMatchesWithCancellation, swissTeams)
assert.deepEqual(terminalStage.campaigns.get('a'), { wins: 3, losses: 0 })
assert.deepEqual(terminalStage.campaigns.get('b'), { wins: 0, losses: 3 })
assert.equal(terminalStage.rounds.flatMap(({ groups }) => groups.flatMap(({ matches }) => matches)).some(({ matchId }) => matchId === 'cancelled'), false)

const schedule = organizeSchedule([
  { ...swissMatches[0], matchId: 'today', winner: null, status: 'SCHEDULED', scheduledAt: Date.parse('2026-08-22T19:00:00-03:00') },
  { ...swissMatches[0], matchId: 'upcoming', winner: null, status: 'SCHEDULED', scheduledAt: Date.parse('2026-08-23T19:00:00-03:00') },
  { ...swissMatches[0], matchId: 'finished', status: 'FINISHED', scheduledAt: Date.parse('2026-08-21T19:00:00-03:00') },
], Date.parse('2026-08-22T12:00:00-03:00'))
assert.deepEqual(schedule.today.map(({ matchId }) => matchId), ['today'])
assert.deepEqual(schedule.upcoming.map(({ matchId }) => matchId), ['upcoming'])
assert.deepEqual(schedule.finished.map(({ matchId }) => matchId), ['finished'])

console.log('Tournament format checks passed.')
