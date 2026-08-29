import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import sharp from 'sharp'
import { POST as adminLogin } from '../src/app/api/admin/login/route'
import { POST as submitRegistration } from '../src/app/api/registrations/route'
import { POST as collectCspReport } from '../src/app/api/security/csp-report/route'
import { adminCookieName, requireSameOrigin } from '../src/lib/admin-request'
import { CSP_REPORT_MAX_BODY_BYTES, CSP_REPORT_RATE_LIMIT } from '../src/lib/csp-report'
import { registrationClaimKeys } from '../src/lib/registration-claim'
import { MAX_REGISTRATION_FILE_SIZE } from '../src/lib/registration-shared'
import { normalizeRegistrationImage, NormalizedImageTooLargeError } from '../src/lib/registration-upload'
import { prisma } from '../src/lib/prisma'
import { consumeRateLimit, resetRateLimit } from '../src/lib/rate-limit'
import { readRequestBody, RequestBodyTooLargeError } from '../src/lib/request-body'
import { FaceitApiError, getFaceitChampionship, parseFaceitChampionshipId, parseFaceitTeamId } from '../src/lib/faceit'
import { parseYouTubeVideoId } from '../src/lib/youtube'
import { privateJson } from '../src/lib/private-response'
import {
  ADMIN_LOGIN_ACCOUNT_RATE_LIMIT,
  ADMIN_LOGIN_SOURCE_RATE_LIMIT,
  adminLoginRateLimitIdentifiers,
} from '../src/lib/admin-login-rate-limit'
import {
  registrationTextLimitError,
  registrationTextLimits,
} from '../src/lib/registration-input'

const identifier = randomUUID()
const adminLoginProbeEmail = `missing-${identifier}@example.com`
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

function proxiedCspReportRequest(body: string, headers: Record<string, string> = {}) {
  return new NextRequest('http://127.0.0.1:8001/api/security/csp-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/csp-report',
      Origin: cspReportOrigin,
      'X-Forwarded-Host': 'aceprodutora.com.br',
      'X-Forwarded-Proto': 'https',
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
    assert.equal((await collectCspReport(proxiedCspReportRequest(legacyReport, {
      Origin: 'https://attacker.example',
      'Sec-Fetch-Site': 'cross-site',
    }))).status, 403)
    assert.equal((await collectCspReport(cspReportRequest(legacyReport, {
      'X-Forwarded-Host': 'aceprodutora.com.br',
    }))).status, 403)
    assert.equal((await collectCspReport(cspReportRequest(legacyReport, {
      'X-Forwarded-Proto': 'https',
    }))).status, 403)
    assert.equal((await collectCspReport(proxiedCspReportRequest(legacyReport, {
      'X-Forwarded-Host': 'aceprodutora.com.br, attacker.example',
    }))).status, 403)
    assert.equal((await collectCspReport(proxiedCspReportRequest(legacyReport, {
      'X-Forwarded-Host': 'aceprodutora.com.br/path',
    }))).status, 403)
    assert.equal((await collectCspReport(proxiedCspReportRequest(legacyReport, {
      'X-Forwarded-Proto': 'https, http',
    }))).status, 403)
    assert.equal((await collectCspReport(cspReportRequest(legacyReport, {
      'Content-Type': 'application/json',
    }))).status, 415)
    assert.equal((await collectCspReport(cspReportRequest('{}', {
      'Content-Length': String(CSP_REPORT_MAX_BODY_BYTES + 1),
    }))).status, 413)
    assert.equal((await collectCspReport(cspReportRequest('{'))).status, 400)

    assert.equal((await collectCspReport(cspReportRequest(legacyReport))).status, 204)
    assert.equal((await collectCspReport(proxiedCspReportRequest(legacyReport))).status, 204)
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

const adminLoginTestScopes = {
  account: `security-admin-account-${identifier}`,
  credential: `security-admin-credential-${identifier}`,
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

    const firstLoginSource = adminLoginRateLimitIdentifiers('admin@example.com', '192.0.2.1')
    const secondLoginSource = adminLoginRateLimitIdentifiers('admin@example.com', '192.0.2.2')
    assert.notEqual(firstLoginSource.credentialKey, secondLoginSource.credentialKey)
    assert.equal(
      adminLoginRateLimitIdentifiers('admin@example.com', null).credentialKey,
      'admin@example.com',
    )
    assert.equal(firstLoginSource.emailKey, secondLoginSource.emailKey)

    for (let attempt = 0; attempt < ADMIN_LOGIN_SOURCE_RATE_LIMIT.limit; attempt += 1) {
      assert.equal((await consumeRateLimit({
        scope: adminLoginTestScopes.credential,
        identifier: firstLoginSource.credentialKey,
        ...ADMIN_LOGIN_SOURCE_RATE_LIMIT,
      })).allowed, true)
    }
    assert.equal((await consumeRateLimit({
      scope: adminLoginTestScopes.credential,
      identifier: firstLoginSource.credentialKey,
      ...ADMIN_LOGIN_SOURCE_RATE_LIMIT,
    })).allowed, false)
    assert.equal((await consumeRateLimit({
      scope: adminLoginTestScopes.credential,
      identifier: secondLoginSource.credentialKey,
      ...ADMIN_LOGIN_SOURCE_RATE_LIMIT,
    })).allowed, true)

    for (let attempt = 0; attempt < ADMIN_LOGIN_ACCOUNT_RATE_LIMIT.limit; attempt += 1) {
      assert.equal((await consumeRateLimit({
        scope: adminLoginTestScopes.account,
        identifier: firstLoginSource.emailKey,
        ...ADMIN_LOGIN_ACCOUNT_RATE_LIMIT,
      })).allowed, true)
    }
    assert.equal((await consumeRateLimit({
      scope: adminLoginTestScopes.account,
      identifier: secondLoginSource.emailKey,
      ...ADMIN_LOGIN_ACCOUNT_RATE_LIMIT,
    })).allowed, false)

    assert.equal(adminCookieName('production'), '__Host-admin-token')
    assert.equal(adminCookieName('development'), 'admin-token')
    const validAdminRequest = new NextRequest('https://aceprodutora.com.br/api/admin/logout', {
      method: 'POST',
      headers: { Origin: 'https://aceprodutora.com.br' },
    })
    assert.equal(requireSameOrigin(validAdminRequest), null)
    const proxiedAdminRequest = new NextRequest('http://127.0.0.1:8001/api/admin/logout', {
      method: 'POST',
      headers: {
        Origin: 'https://aceprodutora.com.br',
        'X-Forwarded-Host': 'aceprodutora.com.br',
        'X-Forwarded-Proto': 'https',
      },
    })
    assert.equal(requireSameOrigin(proxiedAdminRequest), null)
    assert.equal(
      requireSameOrigin(new NextRequest(validAdminRequest.url, {
        method: 'POST',
        headers: { Origin: 'https://attacker.example' },
      }))?.status,
      403,
    )
    assert.equal(requireSameOrigin(new NextRequest(validAdminRequest.url, { method: 'POST' }))?.status, 403)
    assert.equal(
      requireSameOrigin(new NextRequest(proxiedAdminRequest.url, {
        method: 'POST',
        headers: {
          Origin: 'https://attacker.example',
          'X-Forwarded-Host': 'aceprodutora.com.br',
          'X-Forwarded-Proto': 'https',
        },
      }))?.status,
      403,
    )

    const invalidLogin = await adminLogin(new NextRequest('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { Origin: 'http://localhost', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminLoginProbeEmail, password: 'invalid-password' }),
    }))
    assert.equal(invalidLogin.status, 401)
    assert.equal(
      requireSameOrigin(new NextRequest(proxiedAdminRequest.url, {
        method: 'POST',
        headers: {
          Origin: 'https://aceprodutora.com.br',
          'X-Forwarded-Host': 'aceprodutora.com.br, attacker.example',
          'X-Forwarded-Proto': 'https',
        },
      }))?.status,
      403,
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

    const originalRegistrationState = process.env.REGISTRATIONS_OPEN
    delete process.env.REGISTRATIONS_OPEN
    try {
      const closedResponse = await submitRegistration(
        new NextRequest('http://localhost/api/registrations', { method: 'POST' }),
      )
      assert.equal(closedResponse.status, 410)
      assert.deepEqual(await closedResponse.json(), {
        success: false,
        error: 'As inscrições estão encerradas.',
      })
    } finally {
      if (originalRegistrationState === undefined) delete process.env.REGISTRATIONS_OPEN
      else process.env.REGISTRATIONS_OPEN = originalRegistrationState
    }

    const validRegistrationText = {
      teamFaceitUrl: 'x'.repeat(registrationTextLimits.teamFaceitUrl),
      representativeEmail: 'x'.repeat(registrationTextLimits.representativeEmail),
      representativePhone: 'x'.repeat(registrationTextLimits.representativePhone),
      discoverySource: 'x'.repeat(registrationTextLimits.discoverySource),
    }
    assert.equal(registrationTextLimitError(validRegistrationText), null)
    for (const field of Object.keys(registrationTextLimits) as Array<keyof typeof registrationTextLimits>) {
      assert.ok(
        registrationTextLimitError({
          ...validRegistrationText,
          [field]: validRegistrationText[field] + 'x',
        }),
      )
    }

    assert.equal(privateJson({ ok: true }).headers.get('Cache-Control'), 'private, no-store')

    const faceitClaimId = randomUUID()
    const alternateFaceitClaimId = randomUUID()
    const claims = registrationClaimKeys('Copa Ace 10', faceitClaimId, 'Security Test Team')
    assert.deepEqual(claims, {
      claimKey: `copa ace 10:${faceitClaimId}`,
      teamNameClaimKey: 'copa ace 10:name:security test team',
    })
    assert.deepEqual(registrationClaimKeys('Copa Ace 10', null, 'Legacy Team'), {
      claimKey: 'copa ace 10:name:legacy team',
      teamNameClaimKey: 'copa ace 10:name:legacy team',
    })
    const registrationData = ({
      status,
      faceitTeamId = faceitClaimId,
      teamName = 'Security Test Team',
      activeClaims,
    }: {
      status: 'PENDING' | 'REJECTED'
      faceitTeamId?: string
      teamName?: string
      activeClaims: ReturnType<typeof registrationClaimKeys> | null
    }) => {
      const id = randomUUID()
      claimTestIds.push(id)
      return {
        id,
        protocol: 'SECURITY-' + id,
        tournament: 'Copa Ace 10',
        claimKey: activeClaims?.claimKey ?? null,
        teamNameClaimKey: activeClaims?.teamNameClaimKey ?? null,
        teamFaceitUrl: 'https://www.faceit.com/pt/teams/' + faceitTeamId,
        faceitTeamId,
        teamName,
        teamNameNormalized: teamName.toLocaleLowerCase('pt-BR'),
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
    const rejectedRegistration = registrationData({ status: 'REJECTED', activeClaims: null })
    await prisma.registration.create({ data: rejectedRegistration })
    await prisma.registration.create({ data: registrationData({ status: 'REJECTED', activeClaims: null }) })
    await prisma.registration.create({ data: registrationData({ status: 'PENDING', activeClaims: claims }) })
    await assert.rejects(
      prisma.registration.create({
        data: registrationData({
          status: 'PENDING',
          faceitTeamId: faceitClaimId,
          teamName: 'Different Security Team',
          activeClaims: registrationClaimKeys('Copa Ace 10', faceitClaimId, 'Different Security Team'),
        }),
      }),
      (error: unknown) => error instanceof Error && 'code' in error && error.code === 'P2002',
    )
    await assert.rejects(
      prisma.registration.update({
        where: { id: rejectedRegistration.id },
        data: { status: 'PENDING', ...claims },
      }),
      (error: unknown) => error instanceof Error && 'code' in error && error.code === 'P2002',
    )
    await assert.rejects(
      prisma.registration.create({
        data: registrationData({
          status: 'PENDING',
          faceitTeamId: alternateFaceitClaimId,
          activeClaims: registrationClaimKeys('Copa Ace 10', alternateFaceitClaimId, 'Security Test Team'),
        }),
      }),
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
    await resetRateLimit(adminLoginTestScopes.account, 'admin@example.com')
    await resetRateLimit(adminLoginTestScopes.credential, 'admin@example.com:192.0.2.1')
    await resetRateLimit(adminLoginTestScopes.credential, 'admin@example.com:192.0.2.2')
    await resetRateLimit('admin-login-credential', adminLoginProbeEmail)
    await resetRateLimit('admin-login-account', adminLoginProbeEmail)
    await resetRateLimit('security-check', identifier)
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
