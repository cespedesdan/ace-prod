import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { POST as collectCspReport } from '../src/app/api/security/csp-report/route'
import { CSP_REPORT_MAX_BODY_BYTES, CSP_REPORT_RATE_LIMIT } from '../src/lib/csp-report'
import { registrationClaimKey } from '../src/lib/registration-claim'
import { prisma } from '../src/lib/prisma'
import { consumeRateLimit, resetRateLimit } from '../src/lib/rate-limit'
import { readRequestBody, RequestBodyTooLargeError } from '../src/lib/request-body'
import { FaceitApiError, getFaceitChampionship, parseFaceitChampionshipId, parseFaceitTeamId } from '../src/lib/faceit'
import { parseYouTubeVideoId } from '../src/lib/youtube'

const identifier = randomUUID()
const claimTestIds: string[] = []
const cspReportOrigin = 'https://aceprodutora.com.br'
const cspReportEndpoint = `${cspReportOrigin}/api/security/csp-report`

function cspReportRequest(body: string, headers: Record<string, string> = {}) {
  return new NextRequest(cspReportEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/csp-report',
      Origin: cspReportOrigin,
      'Sec-Fetch-Site': 'same-origin',
      ...headers,
    },
    body,
  })
}

async function checkCspReportCollector() {
  const legacyReport = JSON.stringify({
    'csp-report': {
      'document-uri': `${cspReportOrigin}/admin?token=private#fragment`,
      'effective-directive': 'script-src-elem',
      'blocked-uri': 'https://attacker.example/payload.js?token=private',
      'source-file': `${cspReportOrigin}/_next/static/chunk.js?token=private`,
      'status-code': 200,
      'line-number': 42,
      'column-number': 7,
      sample: 'private',
    },
  })
  const reportingApiReport = JSON.stringify([{
    type: 'csp-violation',
    url: `${cspReportOrigin}/ignored?token=private`,
    user_agent: 'private',
    body: {
      documentURL: `${cspReportOrigin}/schedule?token=private`,
      effectiveDirective: 'img-src',
      blockedURL: 'data:image/png;base64,private',
      disposition: 'report',
    },
  }])
  const capturedLogs: unknown[][] = []
  const originalInfo = console.info
  console.info = (...args: unknown[]) => capturedLogs.push(args)

  try {
    assert.equal((await collectCspReport(cspReportRequest(legacyReport, {
      Origin: 'https://attacker.example',
      'Sec-Fetch-Site': 'cross-site',
    }))).status, 403)
    assert.equal((await collectCspReport(cspReportRequest(legacyReport, {
      'Content-Type': 'application/json',
    }))).status, 415)
    assert.equal((await collectCspReport(cspReportRequest('{}', {
      'Content-Length': String(CSP_REPORT_MAX_BODY_BYTES + 1),
    }))).status, 413)
    assert.equal((await collectCspReport(cspReportRequest('{'))).status, 400)

    assert.equal((await collectCspReport(cspReportRequest(legacyReport))).status, 204)
    assert.equal((await collectCspReport(new NextRequest(
      'http://127.0.0.1:8001/api/security/csp-report',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/csp-report',
          Origin: cspReportOrigin,
          Host: 'aceprodutora.com.br',
          'X-Forwarded-Proto': 'https',
          'Sec-Fetch-Site': 'same-origin',
        },
        body: legacyReport,
      },
    ))).status, 204)
    assert.equal((await collectCspReport(cspReportRequest(reportingApiReport, {
      'Content-Type': 'application/reports+json',
    }))).status, 204)
    assert.equal(capturedLogs.length, 3)
    assert.deepEqual(capturedLogs[0], ['CSP violation report', {
      documentPath: '/admin',
      effectiveDirective: 'script-src-elem',
      blockedLocation: 'https://attacker.example',
      sourceOrigin: 'self',
      disposition: 'unknown',
      statusCode: 200,
      lineNumber: 42,
      columnNumber: 7,
    }])
    assert.doesNotMatch(JSON.stringify(capturedLogs), /private|fragment/)

    const capabilityPathReport = legacyReport.replace(
      '/admin?token=private#fragment',
      '/reset/capability-secret?token=private#fragment',
    )
    assert.equal((await collectCspReport(cspReportRequest(capabilityPathReport))).status, 204)
    assert.equal((capturedLogs[3]?.[1] as { documentPath?: unknown }).documentPath, '/other')
    assert.doesNotMatch(JSON.stringify(capturedLogs), /capability-secret/)

    const crossOriginDocument = legacyReport.replace(
      `${cspReportOrigin}/admin?token=private#fragment`,
      'https://attacker.example/private',
    )
    assert.equal((await collectCspReport(cspReportRequest(crossOriginDocument))).status, 400)

    const reportingBatch = JSON.stringify(Array.from(
      { length: 10 },
      () => JSON.parse(reportingApiReport)[0],
    ))
    assert.equal((await collectCspReport(cspReportRequest(reportingBatch, {
      'Content-Type': 'application/reports+json',
    }))).status, 204)
    assert.equal(capturedLogs.length, 4 + 5)

    await resetRateLimit('csp-report-source', 'unresolved-source')
    for (let report = 0; report < CSP_REPORT_RATE_LIMIT.limit; report += 1) {
      assert.equal((await collectCspReport(cspReportRequest(legacyReport))).status, 204)
    }
    const limitedResponse = await collectCspReport(cspReportRequest(legacyReport))
    assert.equal(limitedResponse.status, 429)
    assert.ok(Number(limitedResponse.headers.get('Retry-After')) > 0)
  } finally {
    console.info = originalInfo
    await resetRateLimit('csp-report-source', 'unresolved-source')
  }
}

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
    await checkCspReportCollector()

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
