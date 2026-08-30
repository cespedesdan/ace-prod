import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { POST as receiveFaceitWebhook } from '../src/app/api/webhooks/faceit/route'
import {
  FACEIT_AUTO_SYNC_FINAL_RECONCILIATION_MS,
  FACEIT_AUTO_SYNC_IMMINENT_AFTER_MS,
  FACEIT_AUTO_SYNC_LIVE_INTERVAL_MS,
  FACEIT_AUTO_SYNC_WATCHDOG_INTERVAL_MS,
  FACEIT_AUTO_SYNC_WAKE_AHEAD_MS,
  automaticSyncRetryAt,
  automaticSyncSchedule,
} from '../src/lib/faceit-championship-sync'
import {
  FACEIT_WEBHOOK_MAX_BODY_BYTES,
  isFaceitWebhookSecretValid,
  parseFaceitWebhookWakeSignal,
  wakeFaceitChampionshipForWebhook,
} from '../src/lib/faceit-webhook'
import { prisma } from '../src/lib/prisma'

const testRun = randomUUID()
const tournamentPrefix = `Faceit webhook check ${testRun}`
const now = new Date('2026-08-30T18:00:00.000Z')
const minute = 60 * 1000
const hour = 60 * minute
const day = 24 * hour
const webhookEndpoint = 'https://aceprodutora.com.br/api/webhooks/faceit'
const webhookSecret = 'faceit-webhook-secret-with-32-bytes'

function assertTime(actual: Date | null, expected: number | Date) {
  assert.equal(actual?.getTime(), typeof expected === 'number' ? expected : expected.getTime())
}

function matches(...items: Array<{ status: string | null; scheduledAt: number | null }>) {
  return items
}

async function checkAuthentication() {
  const configured = webhookSecret

  assert.equal(isFaceitWebhookSecretValid(configured, configured), true)
  assert.equal(isFaceitWebhookSecretValid('faceit-webhook-secret-with-32-bytez', configured), false)
  assert.equal(isFaceitWebhookSecretValid('short', configured), false)
  assert.equal(isFaceitWebhookSecretValid(`${configured}-longer`, configured), false)
  assert.equal(isFaceitWebhookSecretValid('', configured), false)
  assert.equal(isFaceitWebhookSecretValid(null, configured), false)
  assert.equal(isFaceitWebhookSecretValid(['unexpected-header-shape'], configured), false)
  assert.equal(isFaceitWebhookSecretValid(configured, undefined), false)
  assert.equal(isFaceitWebhookSecretValid(configured, ''), false)
}

function checkPayloadAllowlist() {
  const championshipId = randomUUID()
  const matchId = randomUUID()
  const allowedMatchEvents = [
    'match_object_created',
    'match_status_configuring',
    'match_status_ready',
    'match_status_finished',
    'match_status_aborted',
    'match_status_cancelled',
  ]
  const allowedTournamentEvents = [
    'tournament_object_updated',
    'tournament_status_started',
    'tournament_status_finished',
    'tournament_status_cancelled',
  ]

  for (const event of allowedMatchEvents) {
    assert.deepEqual(
      parseFaceitWebhookWakeSignal({
        event,
        payload: {
          id: matchId,
          entity: { id: championshipId, type: 'championship' },
          status: 'finished',
          nextAutoSyncAt: '2099-01-01T00:00:00.000Z',
          teams: [{ name: 'This data must never be persisted' }],
        },
      }),
      { event, entityId: championshipId }
    )
  }

  for (const event of allowedTournamentEvents) {
    assert.deepEqual(parseFaceitWebhookWakeSignal({ event, payload: { id: championshipId } }), {
      event,
      entityId: championshipId,
    })
  }

  for (const event of [
    'hub_created',
    'match_demo_ready',
    'tournament_object_created',
    'tournament_object_removed',
    'tournament_status_checkin',
    'tournament_status_seeding',
    'MATCH_STATUS_READY',
    'unknown_event',
  ]) {
    assert.equal(parseFaceitWebhookWakeSignal({ event, payload: { id: championshipId } }), null)
  }

  assert.deepEqual(
    parseFaceitWebhookWakeSignal({
      event: 'match_status_ready',
      payload: { id: matchId },
    }),
    { event: 'match_status_ready', entityId: null }
  )
  assert.deepEqual(
    parseFaceitWebhookWakeSignal({
      event: 'match_status_ready',
      payload: {
        id: matchId,
        entity: { id: championshipId, type: 'tournament' },
      },
    }),
    { event: 'match_status_ready', entityId: null }
  )
  assert.deepEqual(
    parseFaceitWebhookWakeSignal({
      event: 'match_status_ready',
      payload: {
        id: matchId,
        entity: { id: '../admin', type: 'championship' },
      },
    }),
    { event: 'match_status_ready', entityId: null }
  )
  assert.equal(parseFaceitWebhookWakeSignal(null), null)
  assert.equal(parseFaceitWebhookWakeSignal([]), null)
  assert.equal(parseFaceitWebhookWakeSignal({ event: 'match_status_ready' }), null)
  assert.deepEqual(
    parseFaceitWebhookWakeSignal({
      event: 'match_status_ready',
      payload: { id: matchId, entity: { id: '', type: 'championship' } },
    }),
    { event: 'match_status_ready', entityId: null }
  )
  assert.deepEqual(
    parseFaceitWebhookWakeSignal({
      event: 'match_status_ready',
      payload: { id: matchId, entity: { id: 123, type: 'championship' } },
    }),
    { event: 'match_status_ready', entityId: null }
  )
}

function webhookRequest(body: string, secret: string | null = webhookSecret, headers: Record<string, string> = {}) {
  return new NextRequest(webhookEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret === null ? {} : { 'X-Faceit-Webhook-Secret': secret }),
      ...headers,
    },
    body,
  })
}

async function createChampionship({
  suffix,
  championshipId = randomUUID(),
  status = 'ongoing',
  autoSyncEnabled = true,
  nextAutoSyncAt = new Date(now.getTime() + day),
}: {
  suffix: string
  championshipId?: string
  status?: string
  autoSyncEnabled?: boolean
  nextAutoSyncAt?: Date | null
}) {
  return prisma.faceitChampionship.create({
    data: {
      tournament: `${tournamentPrefix} ${suffix}`,
      championshipId,
      faceitUrl: `https://www.faceit.com/pt/championship/${championshipId}/webhook-check`,
      name: `Webhook check ${suffix}`,
      status,
      teamsJson: '[]',
      matchesJson: '[]',
      resultsJson: '[]',
      syncedAt: new Date(now.getTime() - hour),
      autoSyncEnabled,
      nextAutoSyncAt,
      terminalStatusObservedAt: status === 'finished' ? new Date(now.getTime() - hour) : null,
    },
  })
}

async function checkWakeUpIsSafeAndIdempotent() {
  const enabled = await createChampionship({ suffix: 'enabled' })
  const earlierDue = new Date(now.getTime() - minute)
  const earlier = await createChampionship({
    suffix: 'earlier',
    nextAutoSyncAt: earlierDue,
  })
  const disabledDue = new Date(now.getTime() + day)
  const disabled = await createChampionship({
    suffix: 'disabled',
    autoSyncEnabled: false,
    nextAutoSyncAt: disabledDue,
  })
  const terminal = await createChampionship({
    suffix: 'terminal',
    status: 'finished',
    nextAutoSyncAt: null,
  })

  await wakeFaceitChampionshipForWebhook({
    championshipId: enabled.championshipId,
    now,
  })
  await wakeFaceitChampionshipForWebhook({
    championshipId: enabled.championshipId,
    now,
  })
  assertTime(
    (
      await prisma.faceitChampionship.findUniqueOrThrow({
        where: { id: enabled.id },
      })
    ).nextAutoSyncAt,
    now
  )

  const newerReceiptAt = new Date(now.getTime() + minute)
  await wakeFaceitChampionshipForWebhook({
    championshipId: enabled.championshipId,
    event: 'match_status_finished',
    now: newerReceiptAt,
  })
  await wakeFaceitChampionshipForWebhook({
    championshipId: enabled.championshipId,
    event: 'match_status_ready',
    now,
  })
  const afterReorderedReceipts = await prisma.faceitChampionship.findUniqueOrThrow({ where: { id: enabled.id } })
  assertTime(afterReorderedReceipts.lastWebhookReceivedAt, newerReceiptAt)
  assert.equal(afterReorderedReceipts.lastWebhookEvent, 'match_status_finished')
  assert.equal(afterReorderedReceipts.webhookGeneration, 4)

  await wakeFaceitChampionshipForWebhook({
    championshipId: earlier.championshipId,
    now,
  })
  assertTime(
    (
      await prisma.faceitChampionship.findUniqueOrThrow({
        where: { id: earlier.id },
      })
    ).nextAutoSyncAt,
    earlierDue
  )

  await wakeFaceitChampionshipForWebhook({
    championshipId: disabled.championshipId,
    event: 'match_status_ready',
    now,
  })
  const disabledAfter = await prisma.faceitChampionship.findUniqueOrThrow({ where: { id: disabled.id } })
  assertTime(disabledAfter.nextAutoSyncAt, disabledDue)
  assertTime(disabledAfter.lastWebhookReceivedAt, now)
  assert.equal(disabledAfter.lastWebhookEvent, 'match_status_ready')
  assert.equal(disabledAfter.webhookGeneration, 1)

  await wakeFaceitChampionshipForWebhook({
    championshipId: terminal.championshipId,
    event: 'tournament_status_finished',
    now,
  })
  const terminalAfter = await prisma.faceitChampionship.findUniqueOrThrow({ where: { id: terminal.id } })
  assert.equal(terminalAfter.nextAutoSyncAt, null)
  assertTime(terminalAfter.lastWebhookReceivedAt, now)
  assert.equal(terminalAfter.lastWebhookEvent, 'tournament_status_finished')
  assert.equal(terminalAfter.webhookGeneration, 1)

  await wakeFaceitChampionshipForWebhook({ championshipId: randomUUID(), now })
}

async function checkWebhookRoute() {
  const originalSecret = process.env.FACEIT_WEBHOOK_SECRET
  const originalFetch = global.fetch
  const linked = await createChampionship({ suffix: 'route-linked' })
  const unrelated = await createChampionship({ suffix: 'route-unrelated' })
  const disabled = await createChampionship({ suffix: 'route-disabled', autoSyncEnabled: false })
  const terminal = await createChampionship({ suffix: 'route-terminal', status: 'finished', nextAutoSyncAt: null })
  const eventFor = (id: string) => JSON.stringify({
    event: 'match_status_ready',
    payload: {
      id: randomUUID(),
      entity: { id, type: 'championship' },
      status: 'finished',
      name: 'Attacker-controlled replacement',
      matches: [],
      teams: [],
      nextAutoSyncAt: '2099-01-01T00:00:00.000Z',
    },
  })
  const event = eventFor(linked.championshipId)
  const linkedBefore = await prisma.faceitChampionship.findUniqueOrThrow({
    where: { id: linked.id },
  })
  const unrelatedBefore = await prisma.faceitChampionship.findUniqueOrThrow({
    where: { id: unrelated.id },
  })

  try {
    delete process.env.FACEIT_WEBHOOK_SECRET
    assert.equal((await receiveFaceitWebhook(webhookRequest(event))).status, 503)

    process.env.FACEIT_WEBHOOK_SECRET = webhookSecret
    assert.equal((await receiveFaceitWebhook(webhookRequest(event, null))).status, 401)
    assert.equal((await receiveFaceitWebhook(webhookRequest(event, `${webhookSecret}-wrong`))).status, 401)
    assert.equal((await receiveFaceitWebhook(webhookRequest('{'))).status, 400)
    assert.equal(
      (await receiveFaceitWebhook(webhookRequest(event, webhookSecret, { 'Content-Type': 'text/plain' }))).status,
      415
    )
    assert.equal(
      (
        await receiveFaceitWebhook(
          webhookRequest('{}', webhookSecret, {
            'Content-Length': String(FACEIT_WEBHOOK_MAX_BODY_BYTES + 1),
          })
        )
      ).status,
      413
    )
    assert.equal(
      (await receiveFaceitWebhook(webhookRequest('x'.repeat(FACEIT_WEBHOOK_MAX_BODY_BYTES + 1)))).status,
      413
    )

    let externalRequests = 0
    global.fetch = async () => {
      externalRequests += 1
      throw new Error('A webhook wake-up must not fetch or synchronize inline.')
    }
    const acceptedAfter = Date.now()
    const accepted = await receiveFaceitWebhook(webhookRequest(event))
    const acceptedBefore = Date.now()
    assert.equal(accepted.status, 202)
    assert.equal(externalRequests, 0)

    const linkedAfter = await prisma.faceitChampionship.findUniqueOrThrow({
      where: { id: linked.id },
    })
    assert.ok(linkedAfter.nextAutoSyncAt)
    assert.ok(linkedAfter.nextAutoSyncAt.getTime() >= acceptedAfter)
    assert.ok(linkedAfter.nextAutoSyncAt.getTime() <= acceptedBefore)
    assert.equal(linkedAfter.name, linkedBefore.name)
    assert.equal(linkedAfter.status, linkedBefore.status)
    assert.equal(linkedAfter.teamsJson, linkedBefore.teamsJson)
    assert.equal(linkedAfter.matchesJson, linkedBefore.matchesJson)
    assert.equal(linkedAfter.resultsJson, linkedBefore.resultsJson)
    assertTime(linkedAfter.syncedAt, linkedBefore.syncedAt)
    assert.ok(linkedAfter.lastWebhookReceivedAt)
    assert.equal(linkedAfter.lastWebhookEvent, 'match_status_ready')

    const unrelatedAfter = await prisma.faceitChampionship.findUniqueOrThrow({
      where: { id: unrelated.id },
    })
    assertTime(unrelatedAfter.nextAutoSyncAt, unrelatedBefore.nextAutoSyncAt as Date)
    assertTime(unrelatedAfter.syncedAt, unrelatedBefore.syncedAt)

    const unknown = JSON.stringify({
      event: 'tournament_object_updated',
      payload: { id: randomUUID() },
    })
    assert.equal((await receiveFaceitWebhook(webhookRequest(unknown))).status, 204)

    assert.equal((await receiveFaceitWebhook(webhookRequest(eventFor(disabled.championshipId)))).status, 202)
    const disabledAfter = await prisma.faceitChampionship.findUniqueOrThrow({ where: { id: disabled.id } })
    assert.equal(disabledAfter.autoSyncEnabled, false)
    assert.ok(disabledAfter.lastWebhookReceivedAt)

    assert.equal((await receiveFaceitWebhook(webhookRequest(eventFor(terminal.championshipId)))).status, 202)
    const terminalAfter = await prisma.faceitChampionship.findUniqueOrThrow({ where: { id: terminal.id } })
    assert.equal(terminalAfter.nextAutoSyncAt, null)
    assert.ok(terminalAfter.lastWebhookReceivedAt)
  } finally {
    global.fetch = originalFetch
    if (originalSecret === undefined) delete process.env.FACEIT_WEBHOOK_SECRET
    else process.env.FACEIT_WEBHOOK_SECRET = originalSecret
  }
}

function checkAdaptiveSchedule() {
  const watchdog = automaticSyncSchedule('ongoing', now, null, {
    startsAt: null,
    matches: [],
  })
  assertTime(watchdog.nextAutoSyncAt, now.getTime() + FACEIT_AUTO_SYNC_WATCHDOG_INTERVAL_MS)
  assert.equal(FACEIT_AUTO_SYNC_WATCHDOG_INTERVAL_MS, day)

  const distantStart = now.getTime() + 10 * day
  const distant = automaticSyncSchedule('scheduled', now, null, {
    startsAt: distantStart,
    matches: [],
  })
  assertTime(distant.nextAutoSyncAt, now.getTime() + day)

  const tournamentStart = now.getTime() + 8 * hour
  const beforeTournament = automaticSyncSchedule('scheduled', now, null, {
    startsAt: tournamentStart,
    matches: [],
  })
  assertTime(beforeTournament.nextAutoSyncAt, tournamentStart - FACEIT_AUTO_SYNC_WAKE_AHEAD_MS)
  assert.equal(FACEIT_AUTO_SYNC_WAKE_AHEAD_MS, 30 * minute)

  const matchStart = now.getTime() + 4 * hour
  const beforeMatch = automaticSyncSchedule('ongoing', now, null, {
    startsAt: now.getTime() - day,
    matches: matches({ status: 'scheduled', scheduledAt: matchStart }),
  })
  assertTime(beforeMatch.nextAutoSyncAt, matchStart - FACEIT_AUTO_SYNC_WAKE_AHEAD_MS)

  const live = automaticSyncSchedule('ongoing', now, null, {
    startsAt: now.getTime() - day,
    matches: matches({ status: 'ongoing', scheduledAt: now.getTime() - hour }),
  })
  assertTime(live.nextAutoSyncAt, now.getTime() + FACEIT_AUTO_SYNC_LIVE_INTERVAL_MS)
  assert.equal(FACEIT_AUTO_SYNC_LIVE_INTERVAL_MS, 5 * minute)

  const imminent = automaticSyncSchedule('ongoing', now, null, {
    startsAt: now.getTime() - day,
    matches: matches({
      status: 'scheduled',
      scheduledAt: now.getTime() + 20 * minute,
    }),
  })
  assertTime(imminent.nextAutoSyncAt, now.getTime() + FACEIT_AUTO_SYNC_LIVE_INTERVAL_MS)

  const overdueWithinBound = automaticSyncSchedule('ongoing', now, null, {
    startsAt: now.getTime() - day,
    matches: matches({
      status: 'scheduled',
      scheduledAt: now.getTime() - 5 * hour,
    }),
  })
  assertTime(overdueWithinBound.nextAutoSyncAt, now.getTime() + FACEIT_AUTO_SYNC_LIVE_INTERVAL_MS)

  const staleSchedule = automaticSyncSchedule('ongoing', now, null, {
    startsAt: now.getTime() - day,
    matches: matches({
      status: 'scheduled',
      scheduledAt: now.getTime() - FACEIT_AUTO_SYNC_IMMINENT_AFTER_MS - 1,
    }),
  })
  assertTime(staleSchedule.nextAutoSyncAt, now.getTime() + FACEIT_AUTO_SYNC_WATCHDOG_INTERVAL_MS)
  assert.equal(FACEIT_AUTO_SYNC_IMMINENT_AFTER_MS, 6 * hour)

  const firstTerminal = automaticSyncSchedule('finished', now, null, {
    startsAt: null,
    matches: [],
  })
  assertTime(firstTerminal.nextAutoSyncAt, now.getTime() + FACEIT_AUTO_SYNC_FINAL_RECONCILIATION_MS)
  assertTime(firstTerminal.terminalStatusObservedAt, now)
  assert.equal(FACEIT_AUTO_SYNC_FINAL_RECONCILIATION_MS, hour)

  const reconciled = automaticSyncSchedule(
    'finished',
    new Date(now.getTime() + FACEIT_AUTO_SYNC_FINAL_RECONCILIATION_MS),
    now,
    { startsAt: null, matches: [] }
  )
  assert.equal(reconciled.nextAutoSyncAt, null)
  assertTime(reconciled.terminalStatusObservedAt, now)

  assertTime(automaticSyncRetryAt('ongoing', 1, now), now.getTime() + 2 * minute)
  assertTime(automaticSyncRetryAt('ongoing', 2, now), now.getTime() + 5 * minute)
  assertTime(automaticSyncRetryAt('scheduled', 3, now), now.getTime() + 15 * minute)
  assertTime(automaticSyncRetryAt('scheduled', 4, now), now.getTime() + 30 * minute)
  assertTime(automaticSyncRetryAt('scheduled', 5, now), now.getTime() + hour)
  assertTime(automaticSyncRetryAt('scheduled', 20, now), now.getTime() + hour)
}

async function main() {
  await checkAuthentication()
  checkPayloadAllowlist()
  await checkWakeUpIsSafeAndIdempotent()
  await checkWebhookRoute()
  checkAdaptiveSchedule()
  console.info('FACEIT webhook and adaptive schedule checks passed.')
}

main()
  .finally(async () => {
    await prisma.faceitChampionship.deleteMany({
      where: { tournament: { startsWith: tournamentPrefix } },
    })
    await prisma.$disconnect()
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
