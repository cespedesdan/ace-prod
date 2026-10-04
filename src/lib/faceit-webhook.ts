import { createHash, timingSafeEqual } from 'node:crypto'
import { prisma } from '@/lib/prisma'

export const FACEIT_WEBHOOK_MAX_BODY_BYTES = 64 * 1024

const CHAMPIONSHIP_ID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const MATCH_EVENTS = new Set([
  'match_object_created',
  'match_status_aborted',
  'match_status_cancelled',
  'match_status_configuring',
  'match_status_finished',
  'match_status_ready',
])
const TOURNAMENT_EVENTS = new Set([
  'tournament_object_updated',
  'tournament_status_cancelled',
  'tournament_status_finished',
  'tournament_status_started',
])
const TERMINAL_STATUSES = new Set(['aborted', 'cancelled', 'canceled', 'finished'])

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function championshipId(value: unknown) {
  return typeof value === 'string' && CHAMPIONSHIP_ID_PATTERN.test(value) ? value.toLowerCase() : null
}

export function isFaceitWebhookSecretValid(provided: unknown, configured: unknown) {
  if (typeof provided !== 'string' || typeof configured !== 'string') return false
  const configuredBytes = Buffer.byteLength(configured)
  if (configuredBytes < 32 || configuredBytes > 256 || Buffer.byteLength(provided) > 256) return false

  const providedDigest = createHash('sha256').update(provided).digest()
  const configuredDigest = createHash('sha256').update(configured).digest()
  return timingSafeEqual(providedDigest, configuredDigest)
}

export function parseFaceitWebhookWakeSignal(value: unknown) {
  const envelope = record(value)
  const payload = record(envelope?.payload)
  const event = typeof envelope?.event === 'string' ? envelope.event : null
  if (!event || !payload) return null

  let entityId: string | null = null
  if (MATCH_EVENTS.has(event)) {
    const entity = record(payload.entity)
    entityId = entity?.type === 'championship' ? championshipId(entity.id) : null
  } else if (TOURNAMENT_EVENTS.has(event)) {
    const entity = record(payload.entity)
    entityId = entity?.type === 'championship' ? championshipId(entity.id) : championshipId(payload.id)
  } else {
    return null
  }

  return { event, entityId }
}

export async function wakeFaceitChampionshipForWebhook({
  championshipId: id,
  event,
  digest,
  now = new Date(),
}: {
  championshipId: string
  event?: string
  digest?: string
  now?: Date
}) {
  if (!CHAMPIONSHIP_ID_PATTERN.test(id)) return { matched: false, queued: false }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await prisma.faceitChampionship.findUnique({
      where: { championshipId: id.toLowerCase() },
    })
    if (!current) return { matched: false, queued: false }

    // Coalesce retransmissions, but allow a fresh signal after ten minutes.
    if (digest && current.lastWebhookDigest === digest && current.lastWebhookReceivedAt
      && now.getTime() - current.lastWebhookReceivedAt.getTime() < 10 * 60 * 1000) {
      return { matched: true, queued: false }
    }
    const queued = current.autoSyncEnabled
    const nextAutoSyncAt = queued
      ? current.nextAutoSyncAt && current.nextAutoSyncAt < now
        ? current.nextAutoSyncAt
        : now
      : current.nextAutoSyncAt
    const preserveNewerReceipt = current.lastWebhookReceivedAt && current.lastWebhookReceivedAt > now
    const updated = await prisma.faceitChampionship.updateMany({
      where: {
        id: current.id,
        autoSyncEnabled: current.autoSyncEnabled,
        status: current.status,
        nextAutoSyncAt: current.nextAutoSyncAt,
        webhookGeneration: current.webhookGeneration,
      },
      data: {
        nextAutoSyncAt,
        webhookGeneration: { increment: 1 },
        lastWebhookReceivedAt: preserveNewerReceipt ? current.lastWebhookReceivedAt : now,
        ...(!preserveNewerReceipt && event ? { lastWebhookEvent: event } : {}),
        ...(!preserveNewerReceipt && digest ? { lastWebhookDigest: digest } : {}),
      },
    })
    if (updated.count) return { matched: true, queued }
  }

  throw new Error('Could not record FACEIT webhook wake-up after concurrent updates.')
}

export async function wakeFaceitChampionshipsFromSignal(signal: { event: string; entityId: string | null }, payload: unknown) {
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  if (signal.entityId) {
    return wakeFaceitChampionshipForWebhook({ championshipId: signal.entityId, event: signal.event, digest })
  }

  // An authenticated event without an entity ID only requests official snapshots;
  // its scores, names and dates are never trusted. Finished archives are excluded.
  const candidates = await prisma.faceitChampionship.findMany({
    where: { autoSyncEnabled: true, OR: [{ status: null }, { status: { notIn: [...TERMINAL_STATUSES] } }] },
    select: { championshipId: true },
    take: 51,
  })
  // ponytail: bounded fallback; require an explicit provider ID above 50 active links.
  if (candidates.length > 50) throw new Error('Too many active FACEIT links for fallback wake-up.')
  for (const candidate of candidates) {
    await wakeFaceitChampionshipForWebhook({ championshipId: candidate.championshipId, event: signal.event, digest })
  }
  return { matched: candidates.length > 0, queued: candidates.length > 0 }
}
