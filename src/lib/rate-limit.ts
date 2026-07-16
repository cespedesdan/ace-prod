import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

type RateLimitOptions = {
  scope: string
  identifier: string
  limit: number
  windowMs: number
  blockMs: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

const TRUST_PROXY = process.env.TRUST_PROXY === 'true'
const CLEANUP_INTERVAL_MS = 60 * 60_000
const RETENTION_MS = 7 * 24 * 60 * 60_000
const rateLimitGlobal = globalThis as typeof globalThis & { lastRateLimitCleanup?: number }

function keyFor(scope: string, identifier: string) {
  return createHash('sha256').update(`${scope}:${identifier.trim().toLowerCase()}`).digest('hex')
}

export function getClientIp(request: NextRequest) {
  if (!TRUST_PROXY) return null

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const candidate = request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || forwarded
  if (!candidate || !isIP(candidate)) return null
  return candidate
}

async function cleanupExpiredRateLimits(now: Date) {
  const lastCleanup = rateLimitGlobal.lastRateLimitCleanup || 0
  if (now.getTime() - lastCleanup < CLEANUP_INTERVAL_MS) return

  rateLimitGlobal.lastRateLimitCleanup = now.getTime()
  await prisma.rateLimit.deleteMany({
    where: {
      updatedAt: { lt: new Date(now.getTime() - RETENTION_MS) },
      OR: [{ blockedUntil: null }, { blockedUntil: { lt: now } }],
    },
  }).catch(() => undefined)
}

export async function consumeRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const key = keyFor(options.scope, options.identifier)
  const now = new Date()
  await cleanupExpiredRateLimits(now)

  return prisma.$transaction(async (tx) => {
    const current = await tx.rateLimit.findUnique({ where: { key } })
    if (current?.blockedUntil && current.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((current.blockedUntil.getTime() - now.getTime()) / 1000)),
      }
    }

    const windowExpired = !current ||
      current.windowStartedAt.getTime() + options.windowMs <= now.getTime() ||
      Boolean(current.blockedUntil)

    if (windowExpired) {
      await tx.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStartedAt: now },
        update: { count: 1, windowStartedAt: now, blockedUntil: null },
      })
      return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 }
    }

    const count = current.count + 1
    const allowed = count <= options.limit
    const blockedUntil = allowed ? null : new Date(now.getTime() + options.blockMs)
    await tx.rateLimit.update({ where: { key }, data: { count, blockedUntil } })

    return {
      allowed,
      remaining: Math.max(0, options.limit - count),
      retryAfterSeconds: blockedUntil ? Math.ceil(options.blockMs / 1000) : 0,
    }
  })
}

export async function resetRateLimit(scope: string, identifier: string) {
  await prisma.rateLimit.deleteMany({ where: { key: keyFor(scope, identifier) } })
}
