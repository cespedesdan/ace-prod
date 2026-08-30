import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { FaceitApiError, getFaceitChampionship } from '../src/lib/faceit'
import {
  FACEIT_AUTO_SYNC_ACTIVE_INTERVAL_MS,
  FACEIT_AUTO_SYNC_TERMINAL_INTERVAL_MS,
  FACEIT_AUTO_SYNC_TERMINAL_WINDOW_MS,
  FaceitSyncInProgressError,
  automaticSyncRetryAt,
  automaticSyncSchedule,
  runDueFaceitChampionshipSyncs,
  setFaceitAutoSync,
  syncFaceitChampionship,
} from '../src/lib/faceit-championship-sync'
import { prisma } from '../src/lib/prisma'

const championshipId = randomUUID()
const teamId = randomUUID()
const matchId = randomUUID()
const tournament = `Faceit sync check ${randomUUID()}`
const faceitUrl = `https://www.faceit.com/pt/championship/${championshipId}/sync-check`
const originalFetch = global.fetch
const originalApiKey = process.env.FACEIT_API_KEY
const faceitStatus = 'ongoing'
let matchScore = 13
let paginatedMatches = false
let replaceLeaseDuringFetch = false

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function installSuccessfulFaceit() {
  global.fetch = async (input) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url)
    if (url.pathname.endsWith(`/championships/${championshipId}`)) {
      if (replaceLeaseDuringFetch) {
        replaceLeaseDuringFetch = false
        await prisma.faceitChampionship.update({
          where: { tournament },
          data: {
            autoSyncLeaseToken: 'newer-sync-owner',
            autoSyncLeaseUntil: new Date('2026-08-29T20:00:00.000Z'),
          },
        })
      }
      return jsonResponse({
        championship_id: championshipId,
        name: 'Copa Ace Sync Check',
        status: faceitStatus,
        game_id: 'cs2',
        type: 'swiss',
        seeding_strategy: 'swiss',
        total_rounds: 5,
        championship_start: 1_800_000_000,
        faceit_url: `https://www.faceit.com/pt/championship/${championshipId}`,
      })
    }
    if (url.pathname.endsWith('/subscriptions')) {
      return jsonResponse({
        items: url.searchParams.get('offset') === '0'
          ? [{
              status: 'accepted',
              group: 1,
              roster: [],
              substitutes: [],
              team: { team_id: teamId, name: 'Time de Teste' },
            }]
          : [],
      })
    }
    if (url.pathname.endsWith('/matches')) {
      if (paginatedMatches) {
        const offset = Number(url.searchParams.get('offset') || 0)
        const count = offset === 0 ? 100 : offset === 100 ? 1 : 0
        return jsonResponse({
          items: Array.from({ length: count }, (_, index) => ({
            match_id: `paginated-match-${offset + index}`,
            round: 1,
            status: 'scheduled',
            results: { score: {} },
            teams: {},
          })),
        })
      }
      return jsonResponse({
        items: url.searchParams.get('offset') === '0'
          ? [{
              match_id: matchId,
              round: 1,
              best_of: 1,
              status: 'finished',
              results: { winner: 'faction1', score: { faction1: matchScore, faction2: 8 } },
              teams: {
                faction1: { faction_id: teamId, name: 'Time de Teste' },
                faction2: { faction_id: randomUUID(), name: 'Adversário' },
              },
            }]
          : [],
      })
    }
    if (url.pathname.endsWith('/results')) return jsonResponse({ items: [] })
    return jsonResponse({}, 404)
  }
}

async function main() {
  process.env.FACEIT_API_KEY = 'faceit-sync-check-key'
  installSuccessfulFaceit()

  paginatedMatches = true
  const paginated = await getFaceitChampionship(faceitUrl)
  assert.equal(paginated.matches.length, 101)
  paginatedMatches = false

  const manualAt = new Date('2026-08-29T18:00:00.000Z')
  const manual = await syncFaceitChampionship({ tournament, faceitUrl, trigger: 'manual', now: manualAt })
  assert.equal(manual.lastAutoSyncAt, null)
  assert.equal(manual.lastAutoSyncAttemptAt, null)
  assert.equal(manual.autoSyncEnabled, true)
  assert.equal(manual.nextAutoSyncAt?.getTime(), manualAt.getTime() + FACEIT_AUTO_SYNC_ACTIVE_INTERVAL_MS)
  assert.equal(JSON.parse(manual.matchesJson)[0].scores.faction1, 13)

  matchScore = 14
  const automaticAt = new Date('2026-08-29T18:02:00.000Z')
  const automatic = await syncFaceitChampionship({ tournament, faceitUrl, trigger: 'automatic', now: automaticAt })
  assert.equal(automatic.lastAutoSyncAt?.getTime(), automaticAt.getTime())
  assert.equal(automatic.lastAutoSyncAttemptAt?.getTime(), automaticAt.getTime())
  assert.equal(automatic.consecutiveAutoSyncFailures, 0)
  assert.equal(JSON.parse(automatic.matchesJson)[0].scores.faction1, 14)

  global.fetch = async () => jsonResponse({}, 503)
  const failureAt = new Date('2026-08-29T18:04:00.000Z')
  await assert.rejects(
    syncFaceitChampionship({ tournament, faceitUrl, trigger: 'automatic', now: failureAt }),
    FaceitApiError,
  )
  const failed = await prisma.faceitChampionship.findUniqueOrThrow({ where: { tournament } })
  assert.equal(failed.syncedAt.getTime(), automaticAt.getTime())
  assert.equal(failed.lastAutoSyncAt?.getTime(), automaticAt.getTime())
  assert.equal(failed.lastAutoSyncFailureAt?.getTime(), failureAt.getTime())
  assert.match(failed.lastAutoSyncError || '', /FACEIT/)
  assert.equal(failed.consecutiveAutoSyncFailures, 1)
  assert.equal(JSON.parse(failed.matchesJson)[0].scores.faction1, 14)

  installSuccessfulFaceit()
  matchScore = 15
  const manualRecoveryAt = new Date('2026-08-29T18:05:00.000Z')
  const manualRecovery = await syncFaceitChampionship({ tournament, faceitUrl, trigger: 'manual', now: manualRecoveryAt })
  assert.equal(manualRecovery.syncedAt.getTime(), manualRecoveryAt.getTime())
  assert.equal(manualRecovery.lastAutoSyncAt?.getTime(), automaticAt.getTime())
  assert.equal(manualRecovery.lastAutoSyncFailureAt?.getTime(), failureAt.getTime())
  assert.equal(manualRecovery.consecutiveAutoSyncFailures, 1)

  const automaticRecoveryAt = new Date('2026-08-29T18:06:00.000Z')
  const recovered = await syncFaceitChampionship({ tournament, faceitUrl, trigger: 'automatic', now: automaticRecoveryAt })
  assert.equal(recovered.lastAutoSyncAt?.getTime(), automaticRecoveryAt.getTime())
  assert.equal(recovered.lastAutoSyncFailureAt?.getTime(), failureAt.getTime())
  assert.equal(recovered.consecutiveAutoSyncFailures, 0)

  await prisma.faceitChampionship.update({
    where: { tournament },
    data: { autoSyncLeaseUntil: new Date('2026-08-29T19:00:00.000Z') },
  })
  await assert.rejects(
    syncFaceitChampionship({
      tournament,
      faceitUrl,
      trigger: 'manual',
      now: new Date('2026-08-29T18:07:00.000Z'),
    }),
    FaceitSyncInProgressError,
  )
  await prisma.faceitChampionship.update({
    where: { tournament },
    data: { autoSyncLeaseUntil: null },
  })

  const disabled = await setFaceitAutoSync(tournament, false, new Date('2026-08-29T18:08:00.000Z'))
  assert.equal(disabled.autoSyncEnabled, false)
  assert.equal(disabled.nextAutoSyncAt, null)
  const enabledAt = new Date('2026-08-29T18:09:00.000Z')
  const enabled = await setFaceitAutoSync(tournament, true, enabledAt)
  assert.equal(enabled.autoSyncEnabled, true)
  assert.equal(enabled.nextAutoSyncAt?.getTime(), enabledAt.getTime())
  const dueResults = await runDueFaceitChampionshipSyncs(enabledAt)
  assert.deepEqual(dueResults, [{ tournament, status: 'synced' }])

  replaceLeaseDuringFetch = true
  await prisma.faceitChampionship.update({
    where: { tournament },
    data: { autoSyncLeaseToken: null, autoSyncLeaseUntil: null },
  })
  const snapshotBeforeLostLease = await prisma.faceitChampionship.findUniqueOrThrow({ where: { tournament } })
  await assert.rejects(
    syncFaceitChampionship({
      tournament,
      faceitUrl,
      trigger: 'manual',
      now: new Date('2026-08-29T18:10:00.000Z'),
    }),
    FaceitSyncInProgressError,
  )
  const lostLease = await prisma.faceitChampionship.findUniqueOrThrow({ where: { tournament } })
  assert.equal(lostLease.autoSyncLeaseToken, 'newer-sync-owner')
  assert.equal(lostLease.syncedAt.getTime(), snapshotBeforeLostLease.syncedAt.getTime())

  const terminalAt = new Date('2026-08-29T20:00:00.000Z')
  const terminal = automaticSyncSchedule('finished', terminalAt, null)
  assert.equal(terminal.terminalStatusObservedAt?.getTime(), terminalAt.getTime())
  assert.equal(terminal.nextAutoSyncAt?.getTime(), terminalAt.getTime() + FACEIT_AUTO_SYNC_TERMINAL_INTERVAL_MS)
  const terminalExpired = automaticSyncSchedule(
    'finished',
    new Date(terminalAt.getTime() + FACEIT_AUTO_SYNC_TERMINAL_WINDOW_MS),
    terminalAt,
  )
  assert.equal(terminalExpired.nextAutoSyncAt, null)
  assert.equal(
    automaticSyncRetryAt(
      'finished',
      3,
      new Date(terminalAt.getTime() + FACEIT_AUTO_SYNC_TERMINAL_WINDOW_MS),
      terminalAt,
    ),
    null,
  )

  console.info('FACEIT automatic sync checks passed.')
}

main()
  .finally(async () => {
    global.fetch = originalFetch
    if (originalApiKey === undefined) delete process.env.FACEIT_API_KEY
    else process.env.FACEIT_API_KEY = originalApiKey
    await prisma.faceitChampionship.deleteMany({ where: { tournament } })
    await prisma.$disconnect()
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
