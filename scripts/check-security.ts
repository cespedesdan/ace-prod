import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { normalizeRegistrationImage, NormalizedImageTooLargeError } from '../src/lib/registration-upload'
import { MAX_REGISTRATION_FILE_SIZE } from '../src/lib/registration-shared'
import { registrationClaimKey } from '../src/lib/registration-claim'
import { prisma } from '../src/lib/prisma'
import { consumeRateLimit, resetRateLimit } from '../src/lib/rate-limit'
import { readRequestBody, RequestBodyTooLargeError } from '../src/lib/request-body'
import { FaceitApiError, getFaceitChampionship, parseFaceitChampionshipId, parseFaceitTeamId } from '../src/lib/faceit'
import { parseYouTubeVideoId } from '../src/lib/youtube'

const identifier = randomUUID()
const claimTestIds: string[] = []

async function main() {
  try {
    const options = { scope: 'security-check', identifier, limit: 3, windowMs: 60_000, blockMs: 60_000 }
    assert.equal((await consumeRateLimit(options)).allowed, true)
    assert.equal((await consumeRateLimit(options)).allowed, true)
    assert.equal((await consumeRateLimit(options)).allowed, true)
    const blocked = await consumeRateLimit(options)
    assert.equal(blocked.allowed, false)
    assert.ok(blocked.retryAfterSeconds > 0)

    const usersBefore = await prisma.user.count()
    const injectedLookup = await prisma.user.findUnique({ where: { email: "' OR 1=1 --" } })
    assert.equal(injectedLookup, null)
    assert.equal(await prisma.user.count(), usersBefore)

    const oversizedRequest = new Request('http://localhost/security-check', {
      method: 'POST',
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('1234'))
          controller.close()
        },
      }),
      duplex: 'half',
    } as RequestInit & { duplex: 'half' })
    await assert.rejects(
      readRequestBody(oversizedRequest, 3),
      (error) => error instanceof RequestBodyTooLargeError,
    )

    const sourceImage = await sharp({
      create: { width: 2, height: 2, channels: 4, background: '#ff0000' },
    }).png().toBuffer()
    const normalizedImage = await normalizeRegistrationImage(
      Buffer.concat([sourceImage, Buffer.from('untrusted-trailer')]),
      'png',
    )
    assert.equal((await sharp(normalizedImage).metadata()).format, 'png')
    assert.equal(normalizedImage.includes(Buffer.from('untrusted-trailer')), false)

    const noisyPixels = randomBytes(4_500 * 4_500 * 3)
    const expandingImage = await sharp(noisyPixels, {
      raw: { width: 4_500, height: 4_500, channels: 3 },
    }).jpeg({ quality: 45 }).toBuffer()
    assert.ok(expandingImage.length < MAX_REGISTRATION_FILE_SIZE)
    await assert.rejects(
      normalizeRegistrationImage(expandingImage, 'jpg'),
      (error) => error instanceof NormalizedImageTooLargeError,
    )

    const redFrame = Buffer.alloc(2 * 2 * 3)
    const blueFrame = Buffer.alloc(2 * 2 * 3)
    for (let offset = 0; offset < redFrame.length; offset += 3) {
      redFrame[offset] = 255
      blueFrame[offset + 2] = 255
    }
    const animatedGif = await sharp(Buffer.concat([redFrame, blueFrame]), {
      raw: { width: 2, height: 4, channels: 3, pageHeight: 2 },
    }).gif({ loop: 0, delay: [100, 100] }).toBuffer()
    const animatedWebp = await sharp(animatedGif, { animated: true }).webp().toBuffer()
    await assert.rejects(
      normalizeRegistrationImage(animatedWebp, 'webp'),
      /Animated images are not supported/,
    )

    const oversizedPixelImage = await sharp({
      create: { width: 5_001, height: 5_000, channels: 3, background: '#ff0000' },
    }).jpeg({ quality: 10 }).toBuffer()
    await assert.rejects(
      normalizeRegistrationImage(oversizedPixelImage, 'jpg'),
      /Input image exceeds pixel limit/,
    )

    const faceitClaimId = randomUUID()
    const claimKey = registrationClaimKey('Copa Ace 10', faceitClaimId)
    assert.equal(registrationClaimKey('Copa Ace 10', null, 'Legacy Team'), 'copa ace 10:name:legacy team')
    const registrationData = (status: 'PENDING' | 'REJECTED', activeClaimKey: string | null) => {
      const id = randomUUID()
      claimTestIds.push(id)
      return {
        id,
        protocol: 'SECURITY-' + id,
        tournament: 'Copa Ace 10',
        claimKey: activeClaimKey,
        teamFaceitUrl: 'https://www.faceit.com/pt/teams/' + faceitClaimId,
        faceitTeamId: faceitClaimId,
        teamName: 'Security Test Team',
        teamNameNormalized: 'security test team',
        teamTag: 'SEC',
        representativeName: 'Security Test',
        representativeEmail: 'security@example.invalid',
        representativePhone: '11999999999',
        discoverySource: 'security-test',
        logoPath: id + '/logo.png',
        logoOriginalName: 'logo.png',
        paymentProofPath: id + '/proof.png',
        paymentProofOriginalName: 'proof.png',
        status,
      }
    }
    await prisma.registration.create({ data: registrationData('REJECTED', null) })
    await prisma.registration.create({ data: registrationData('REJECTED', null) })
    await prisma.registration.create({ data: registrationData('PENDING', claimKey) })
    await assert.rejects(
      prisma.registration.create({ data: registrationData('PENDING', claimKey) }),
      (error: unknown) => error instanceof Error && 'code' in error && error.code === 'P2002',
    )

    const faceitTeamId = '6204037c-30e6-408b-8aaa-dd8219860b4b'
    assert.equal(parseFaceitTeamId(`https://www.faceit.com/pt/teams/${faceitTeamId}/ace`), faceitTeamId)
    assert.throws(
      () => parseFaceitTeamId(`https://faceit.com.example/pt/teams/${faceitTeamId}`),
      (error) => error instanceof FaceitApiError,
    )
    assert.equal(parseFaceitChampionshipId(`https://www.faceit.com/pt/championship/${faceitTeamId}/copa-ace-10`), faceitTeamId)
    assert.throws(
      () => parseFaceitChampionshipId(`https://faceit.com.example/pt/championship/${faceitTeamId}`),
      (error) => error instanceof FaceitApiError,
    )

    const youtubeVideoId = 'M7lc1UVf-VE'
    assert.equal(parseYouTubeVideoId(`https://www.youtube.com/watch?v=${youtubeVideoId}`), youtubeVideoId)
    assert.equal(parseYouTubeVideoId(`https://youtu.be/${youtubeVideoId}`), youtubeVideoId)
    assert.equal(parseYouTubeVideoId(`https://www.youtube.com/live/${youtubeVideoId}`), youtubeVideoId)
    assert.equal(parseYouTubeVideoId(`https://youtube.com.example/watch?v=${youtubeVideoId}`), null)

    const originalFetch = globalThis.fetch
    const originalApiKey = process.env.FACEIT_API_KEY
    process.env.FACEIT_API_KEY = 'test-key'
    globalThis.fetch = async (input) => {
      const url = String(input)
      const body = url.includes('/matches?') ? {
        end: 1,
        items: [{
          match_id: 'match-1', round: 1, group: 1, best_of: 1, scheduled_at: 1_787_200_000, status: 'SCHEDULED',
          teams: { faction1: { faction_id: 'team-1', name: 'Time Um' }, faction2: { faction_id: 'team-2', name: 'Time Dois' } },
          results: { score: { faction1: 0, faction2: 0 }, winner: null },
        }],
      } : url.includes('/results?') ? { end: 0, items: [] }
        : url.includes('/subscriptions?') ? { end: 1, items: [{ status: 'ACCEPTED', group: 1, coach: 'coach-1', roster: [], substitutes: [], team: { team_id: 'team-1', name: 'Time Um' } }] }
          : { championship_id: faceitTeamId, name: 'Copa Ace 10', status: 'ongoing', game_id: 'cs2', type: 'swiss', seeding_strategy: 'swiss', total_rounds: 5, championship_start: 1_787_200_000_000 }
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    try {
      const snapshot = await getFaceitChampionship(`https://www.faceit.com/pt/championship/${faceitTeamId}/copa-ace-10`)
      assert.equal(snapshot.startsAt, 1_787_200_000_000)
      assert.equal(snapshot.format, 'swiss')
      assert.equal(snapshot.totalRounds, 5)
      assert.equal(snapshot.teams[0]?.coachPlayerId, 'coach-1')
      assert.equal(snapshot.matches[0]?.scheduledAt, 1_787_200_000_000)
      assert.equal(snapshot.matches[0]?.teams[0]?.faction, 'faction1')
      assert.equal(snapshot.matches[0]?.scores.faction1, 0)
    } finally {
      globalThis.fetch = originalFetch
      if (originalApiKey === undefined) delete process.env.FACEIT_API_KEY
      else process.env.FACEIT_API_KEY = originalApiKey
    }

    console.log('Security checks passed.')
  } finally {
    await prisma.registration.deleteMany({ where: { id: { in: claimTestIds } } })
    await resetRateLimit('security-check', identifier)
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
