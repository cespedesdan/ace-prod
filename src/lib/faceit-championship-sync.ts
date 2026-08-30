import { randomUUID } from 'node:crypto'
import type { FaceitChampionship } from '@prisma/client'
import { FaceitApiError, getFaceitChampionship } from '@/lib/faceit'
import { prisma } from '@/lib/prisma'

export const FACEIT_AUTO_SYNC_LIVE_INTERVAL_MS = 5 * 60 * 1000
export const FACEIT_AUTO_SYNC_WATCHDOG_INTERVAL_MS = 24 * 60 * 60 * 1000
export const FACEIT_AUTO_SYNC_WAKE_AHEAD_MS = 30 * 60 * 1000
export const FACEIT_AUTO_SYNC_IMMINENT_AFTER_MS = 6 * 60 * 60 * 1000
export const FACEIT_AUTO_SYNC_FINAL_RECONCILIATION_MS = 60 * 60 * 1000
export const FACEIT_AUTO_SYNC_TERMINAL_WINDOW_MS = 48 * 60 * 60 * 1000
export const FACEIT_AUTO_SYNC_LEASE_MS = 6 * 60 * 1000

export const FACEIT_AUTO_SYNC_ACTIVE_INTERVAL_MS = FACEIT_AUTO_SYNC_LIVE_INTERVAL_MS
export const FACEIT_AUTO_SYNC_IDLE_INTERVAL_MS = FACEIT_AUTO_SYNC_WATCHDOG_INTERVAL_MS
export const FACEIT_AUTO_SYNC_TERMINAL_INTERVAL_MS = FACEIT_AUTO_SYNC_FINAL_RECONCILIATION_MS

const ACTIVE_STATUSES = new Set(['ongoing', 'started'])
const TERMINAL_STATUSES = new Set(['aborted', 'cancelled', 'canceled', 'finished'])
const LIVE_MATCH_STATUSES = new Set(['configuring', 'ongoing', 'ready', 'started'])
const TERMINAL_MATCH_STATUSES = new Set(['aborted', 'cancelled', 'canceled', 'finished'])
const RETRY_DELAYS_MS = [2 * 60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000, 30 * 60 * 1000, 60 * 60 * 1000]

export type FaceitSyncTrigger = 'manual' | 'automatic'

export class FaceitSyncInProgressError extends Error {
  constructor() {
    super('Uma sincronização deste campeonato já está em andamento.')
    this.name = 'FaceitSyncInProgressError'
  }
}

export class FaceitAutoSyncDisabledError extends Error {
  constructor() {
    super('A sincronização automática deste campeonato está desativada.')
    this.name = 'FaceitAutoSyncDisabledError'
  }
}

function normalizedStatus(status: string | null) {
  return status?.trim().toLowerCase() || ''
}

export function automaticSyncSchedule(
  status: string | null,
  now: Date,
  terminalStatusObservedAt: Date | null,
  timing: {
    startsAt: number | null
    matches: Array<{ status: string | null; scheduledAt: number | null }>
  } = { startsAt: null, matches: [] },
) {
  const normalized = normalizedStatus(status)
  if (TERMINAL_STATUSES.has(normalized)) {
    const observedAt = terminalStatusObservedAt || now
    const finalReconciliationAt = observedAt.getTime() + FACEIT_AUTO_SYNC_FINAL_RECONCILIATION_MS
    const nextAutoSyncAt = now.getTime() >= finalReconciliationAt
      ? null
      : new Date(finalReconciliationAt)
    return { nextAutoSyncAt, terminalStatusObservedAt: observedAt }
  }

  const nowMs = now.getTime()
  const watchdogAt = nowMs + FACEIT_AUTO_SYNC_WATCHDOG_INTERVAL_MS
  let scheduledWakeAt = watchdogAt

  for (const match of timing.matches) {
    const matchStatus = normalizedStatus(match.status)
    if (LIVE_MATCH_STATUSES.has(matchStatus)) {
      return {
        nextAutoSyncAt: new Date(nowMs + FACEIT_AUTO_SYNC_LIVE_INTERVAL_MS),
        terminalStatusObservedAt: null,
      }
    }

    const scheduledAt = match.scheduledAt
    if (scheduledAt === null || !Number.isFinite(scheduledAt) || TERMINAL_MATCH_STATUSES.has(matchStatus)) continue

    if (
      scheduledAt >= nowMs - FACEIT_AUTO_SYNC_IMMINENT_AFTER_MS
      && scheduledAt <= nowMs + FACEIT_AUTO_SYNC_WAKE_AHEAD_MS
    ) {
      return {
        nextAutoSyncAt: new Date(nowMs + FACEIT_AUTO_SYNC_LIVE_INTERVAL_MS),
        terminalStatusObservedAt: null,
      }
    }

    const wakeAt = scheduledAt - FACEIT_AUTO_SYNC_WAKE_AHEAD_MS
    if (wakeAt > nowMs) scheduledWakeAt = Math.min(scheduledWakeAt, wakeAt)
  }

  if (timing.startsAt !== null && Number.isFinite(timing.startsAt)) {
    const tournamentWakeAt = timing.startsAt - FACEIT_AUTO_SYNC_WAKE_AHEAD_MS
    if (timing.startsAt >= nowMs && tournamentWakeAt <= nowMs) {
      return {
        nextAutoSyncAt: new Date(nowMs + FACEIT_AUTO_SYNC_LIVE_INTERVAL_MS),
        terminalStatusObservedAt: null,
      }
    }
    if (tournamentWakeAt > nowMs) scheduledWakeAt = Math.min(scheduledWakeAt, tournamentWakeAt)
  }

  return {
    nextAutoSyncAt: new Date(scheduledWakeAt),
    terminalStatusObservedAt: null,
  }
}

export function automaticSyncRetryAt(
  status: string | null,
  failures: number,
  now: Date,
  terminalStatusObservedAt: Date | null = null,
) {
  if (
    TERMINAL_STATUSES.has(normalizedStatus(status))
    && terminalStatusObservedAt
    && now.getTime() - terminalStatusObservedAt.getTime() >= FACEIT_AUTO_SYNC_TERMINAL_WINDOW_MS
  ) {
    return null
  }

  const delayIndex = Math.min(Math.max(failures, 1) - 1, RETRY_DELAYS_MS.length - 1)
  const configuredDelay = RETRY_DELAYS_MS[delayIndex]
  const delay = ACTIVE_STATUSES.has(normalizedStatus(status))
    ? Math.min(configuredDelay, 15 * 60 * 1000)
    : configuredDelay
  return new Date(now.getTime() + delay)
}

function storedSyncError(error: unknown) {
  if (error instanceof FaceitApiError || error instanceof FaceitSyncInProgressError) {
    return error.message.slice(0, 500)
  }
  return 'Falha inesperada ao sincronizar o campeonato com a FACEIT.'
}

async function preserveWebhookWakeAfterSync(recordId: string, webhookGenerationAtStart: number, syncStartedAt: Date) {
  await prisma.faceitChampionship.updateMany({
    where: {
      id: recordId,
      autoSyncEnabled: true,
      webhookGeneration: { gt: webhookGenerationAtStart },
      OR: [
        { nextAutoSyncAt: null },
        { nextAutoSyncAt: { gt: syncStartedAt } },
      ],
    },
    data: { nextAutoSyncAt: syncStartedAt },
  })
}

async function claimSync(championship: FaceitChampionship, trigger: FaceitSyncTrigger, now: Date) {
  if (trigger === 'automatic' && !championship.autoSyncEnabled) {
    throw new FaceitAutoSyncDisabledError()
  }

  const leaseToken = randomUUID()
  const claimed = await prisma.faceitChampionship.updateMany({
    where: {
      id: championship.id,
      OR: [
        { autoSyncLeaseUntil: null },
        { autoSyncLeaseUntil: { lt: now } },
      ],
    },
    data: {
      autoSyncLeaseUntil: new Date(now.getTime() + FACEIT_AUTO_SYNC_LEASE_MS),
      autoSyncLeaseToken: leaseToken,
      ...(trigger === 'automatic' ? { lastAutoSyncAttemptAt: now } : {}),
    },
  })
  if (!claimed.count) throw new FaceitSyncInProgressError()
  return leaseToken
}

export async function syncFaceitChampionship({
  tournament,
  faceitUrl,
  trigger,
  now = new Date(),
}: {
  tournament: string
  faceitUrl: string
  trigger: FaceitSyncTrigger
  now?: Date
}) {
  const existing = await prisma.faceitChampionship.findUnique({ where: { tournament } })
  const leaseToken = existing ? await claimSync(existing, trigger, now) : null

  try {
    const snapshot = await getFaceitChampionship(faceitUrl)
    const schedule = automaticSyncSchedule(snapshot.status, now, existing?.terminalStatusObservedAt || null, {
      startsAt: snapshot.startsAt,
      matches: snapshot.matches,
    })
    const snapshotData = {
      championshipId: snapshot.championshipId,
      faceitUrl: snapshot.faceitUrl,
      name: snapshot.name,
      status: snapshot.status,
      gameId: snapshot.gameId,
      format: snapshot.format,
      seedingStrategy: snapshot.seedingStrategy,
      totalRounds: snapshot.totalRounds,
      startsAt: snapshot.startsAt ? new Date(snapshot.startsAt) : null,
      teamsJson: JSON.stringify(snapshot.teams),
      matchesJson: JSON.stringify(snapshot.matches),
      resultsJson: JSON.stringify(snapshot.results),
      syncedAt: now,
    }
    const automaticSuccessData = trigger === 'automatic'
      ? {
          lastAutoSyncAt: now,
          consecutiveAutoSyncFailures: 0,
          nextAutoSyncAt: schedule.nextAutoSyncAt,
          terminalStatusObservedAt: schedule.terminalStatusObservedAt,
        }
      : {}
    const manualScheduleData = trigger === 'manual' && (existing?.autoSyncEnabled ?? true)
      ? {
          nextAutoSyncAt: schedule.nextAutoSyncAt,
          terminalStatusObservedAt: schedule.terminalStatusObservedAt,
        }
      : {}

    if (!existing) {
      return await prisma.faceitChampionship.create({
        data: {
          tournament,
          ...snapshotData,
          autoSyncEnabled: true,
          nextAutoSyncAt: schedule.nextAutoSyncAt,
          terminalStatusObservedAt: schedule.terminalStatusObservedAt,
          ...(trigger === 'automatic'
            ? { lastAutoSyncAt: now, lastAutoSyncAttemptAt: now }
            : {}),
        },
      })
    }

    const updated = await prisma.faceitChampionship.updateMany({
      where: { id: existing.id, autoSyncLeaseToken: leaseToken },
      data: {
        ...snapshotData,
        ...automaticSuccessData,
        ...manualScheduleData,
        autoSyncLeaseUntil: null,
        autoSyncLeaseToken: null,
      },
    })
    if (!updated.count) throw new FaceitSyncInProgressError()
    await preserveWebhookWakeAfterSync(existing.id, existing.webhookGeneration, now)
    return prisma.faceitChampionship.findUniqueOrThrow({ where: { id: existing.id } })
  } catch (error) {
    if (existing) {
      const failures = existing.consecutiveAutoSyncFailures + 1
      await prisma.faceitChampionship.updateMany({
        where: { id: existing.id, autoSyncLeaseToken: leaseToken },
        data: {
          autoSyncLeaseUntil: null,
          autoSyncLeaseToken: null,
          ...(trigger === 'automatic'
            ? {
                lastAutoSyncFailureAt: now,
                lastAutoSyncError: storedSyncError(error),
                consecutiveAutoSyncFailures: failures,
                nextAutoSyncAt: automaticSyncRetryAt(
                  existing.status,
                  failures,
                  now,
                  existing.terminalStatusObservedAt,
                ),
              }
            : {}),
        },
      })
    }
    throw error
  }
}

export async function setFaceitAutoSync(tournament: string, enabled: boolean, now = new Date()) {
  return prisma.faceitChampionship.update({
    where: { tournament },
    data: {
      autoSyncEnabled: enabled,
      nextAutoSyncAt: enabled ? now : null,
    },
  })
}

export async function runDueFaceitChampionshipSyncs(now = new Date()) {
  const due = await prisma.faceitChampionship.findMany({
    where: {
      autoSyncEnabled: true,
      OR: [
        { nextAutoSyncAt: { lte: now } },
        { nextAutoSyncAt: null, lastAutoSyncAttemptAt: null },
      ],
    },
    orderBy: [{ nextAutoSyncAt: 'asc' }, { tournament: 'asc' }],
  })
  const results: Array<{ tournament: string; status: 'synced' | 'failed' | 'skipped'; error?: string }> = []

  for (const championship of due) {
    try {
      await syncFaceitChampionship({
        tournament: championship.tournament,
        faceitUrl: championship.faceitUrl,
        trigger: 'automatic',
        now: new Date(),
      })
      results.push({ tournament: championship.tournament, status: 'synced' })
    } catch (error) {
      if (error instanceof FaceitSyncInProgressError || error instanceof FaceitAutoSyncDisabledError) {
        results.push({ tournament: championship.tournament, status: 'skipped', error: error.message })
      } else {
        results.push({ tournament: championship.tournament, status: 'failed', error: storedSyncError(error) })
      }
    }
  }

  return results
}
