import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { NextRequest } from 'next/server'
import { registrationClaimKey } from '../src/lib/registration-claim'
import { prisma } from '../src/lib/prisma'
import { consumeRateLimit, resetRateLimit } from '../src/lib/rate-limit'
import { readRequestBody, RequestBodyTooLargeError } from '../src/lib/request-body'
import { FaceitApiError, getFaceitChampionship, parseFaceitChampionshipId, parseFaceitTeamId } from '../src/lib/faceit'
import {
  createFaceitAuthorization,
  createFaceitOwnershipProof,
  exchangeFaceitAuthorizationCode,
  getFaceitOAuthCookieNames,
  getRegistrationReturnUrl,
  verifyFaceitOAuthState,
  verifyFaceitOwnershipProof,
} from '../src/lib/faceit-ownership'
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

    const oauthEnvironment = {
      cookieSecret: process.env.FACEIT_OAUTH_COOKIE_SECRET,
      clientId: process.env.FACEIT_OAUTH_CLIENT_ID,
      clientSecret: process.env.FACEIT_OAUTH_CLIENT_SECRET,
      redirectUri: process.env.FACEIT_OAUTH_REDIRECT_URI,
    }
    process.env.FACEIT_OAUTH_COOKIE_SECRET = 'test-faceit-cookie-secret-that-is-long-enough'
    process.env.FACEIT_OAUTH_CLIENT_ID = 'faceit-client-id'
    process.env.FACEIT_OAUTH_CLIENT_SECRET = 'faceit-client-secret'
    process.env.FACEIT_OAUTH_REDIRECT_URI = 'https://aceprodutora.com.br/api/faceit/ownership/callback'
    try {
      const authorization = createFaceitAuthorization(faceitTeamId)
      const authorizationUrl = new URL(authorization.authorizationUrl)
      assert.equal(authorizationUrl.origin, 'https://accounts.faceit.com')
      assert.equal(authorizationUrl.searchParams.get('response_type'), 'code')
      assert.equal(authorizationUrl.searchParams.get('code_challenge_method'), 'S256')
      assert.equal(authorizationUrl.searchParams.get('scope'), 'openid profile')
      assert.equal(
        authorizationUrl.searchParams.get('redirect_uri'),
        'https://aceprodutora.com.br/api/faceit/ownership/callback',
      )
      assert.equal(getRegistrationReturnUrl().origin, 'https://aceprodutora.com.br')
      assert.equal(getFaceitOAuthCookieNames(true).state, '__Host-ace-faceit-oauth-state')
      const state = authorizationUrl.searchParams.get('state') || ''
      assert.equal(verifyFaceitOAuthState(authorization.stateToken, `${state}-tampered`), null)
      const verifiedState = verifyFaceitOAuthState(authorization.stateToken, state)
      assert.equal(verifiedState?.teamId, faceitTeamId)
      assert.ok(verifiedState?.verifier)

      const proof = createFaceitOwnershipProof(faceitTeamId, 'LEADER-ID')
      assert.deepEqual(verifyFaceitOwnershipProof(proof), {
        kind: 'faceit-team-ownership',
        teamId: faceitTeamId,
        playerId: 'leader-id',
      })
      assert.equal(verifyFaceitOwnershipProof(`${proof}tampered`), null)

      const oauthFetch = globalThis.fetch
      globalThis.fetch = async (input, init) => {
        const url = String(input)
        if (url.endsWith('/oauth/token')) {
          assert.match(String(init?.headers && (init.headers as Record<string, string>).Authorization), /^Basic /)
          assert.match(String(init?.body), /code_verifier=/)
          return new Response(JSON.stringify({ access_token: 'access-token' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        assert.ok(url.endsWith('/resources/userinfo'))
        assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer access-token')
        return new Response(JSON.stringify({ sub: 'LEADER-ID' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      try {
        assert.equal(await exchangeFaceitAuthorizationCode('authorization-code', verifiedState?.verifier || ''), 'leader-id')
      } finally {
        globalThis.fetch = oauthFetch
      }

      const { GET: handleFaceitCallback } = await import('../src/app/api/faceit/ownership/callback/route')
      const stateCookieName = getFaceitOAuthCookieNames().state
      const deniedCallback = await handleFaceitCallback(new NextRequest(
        `https://aceprodutora.com.br/api/faceit/ownership/callback?error=access_denied&state=${encodeURIComponent(state)}`,
        { headers: { Cookie: `${stateCookieName}=${authorization.stateToken}` } },
      ))
      assert.equal(deniedCallback.status, 303)
      assert.equal(new URL(deniedCallback.headers.get('Location') || '').searchParams.get('faceit_error'), 'access_denied')
      assert.match(deniedCallback.headers.get('Set-Cookie') || '', /Max-Age=0/)

      const invalidStateCallback = await handleFaceitCallback(new NextRequest(
        'https://aceprodutora.com.br/api/faceit/ownership/callback?error=access_denied&state=attacker-state',
        { headers: { Cookie: `${stateCookieName}=${authorization.stateToken}` } },
      ))
      assert.equal(invalidStateCallback.status, 303)
      assert.equal(new URL(invalidStateCallback.headers.get('Location') || '').searchParams.get('faceit_error'), 'invalid_state')
      assert.equal(invalidStateCallback.headers.get('Set-Cookie'), null)

      const missingStateCallback = await handleFaceitCallback(new NextRequest(
        'https://aceprodutora.com.br/api/faceit/ownership/callback?error=access_denied',
        { headers: { Cookie: `${stateCookieName}=${authorization.stateToken}` } },
      ))
      assert.equal(missingStateCallback.status, 303)
      assert.equal(new URL(missingStateCallback.headers.get('Location') || '').searchParams.get('faceit_error'), 'invalid_callback')
      assert.equal(missingStateCallback.headers.get('Set-Cookie'), null)

      const caddyfile = await readFile(new URL('../deploy/Caddyfile', import.meta.url), 'utf8')
      assert.match(
        caddyfile,
        /www\.aceprodutora\.com\.br\s*\{\s*redir https:\/\/aceprodutora\.com\.br\{uri\} permanent\s*\}/,
      )
      assert.match(
        caddyfile,
        /aceprodutora\.com\.br\s*\{[\s\S]*reverse_proxy 127\.0\.0\.1:8001/,
      )
      assert.doesNotMatch(caddyfile, /aceprodutora\.com\.br,\s*www\.aceprodutora\.com\.br/)
    } finally {
      if (oauthEnvironment.cookieSecret === undefined) delete process.env.FACEIT_OAUTH_COOKIE_SECRET
      else process.env.FACEIT_OAUTH_COOKIE_SECRET = oauthEnvironment.cookieSecret
      if (oauthEnvironment.clientId === undefined) delete process.env.FACEIT_OAUTH_CLIENT_ID
      else process.env.FACEIT_OAUTH_CLIENT_ID = oauthEnvironment.clientId
      if (oauthEnvironment.clientSecret === undefined) delete process.env.FACEIT_OAUTH_CLIENT_SECRET
      else process.env.FACEIT_OAUTH_CLIENT_SECRET = oauthEnvironment.clientSecret
      if (oauthEnvironment.redirectUri === undefined) delete process.env.FACEIT_OAUTH_REDIRECT_URI
      else process.env.FACEIT_OAUTH_REDIRECT_URI = oauthEnvironment.redirectUri
    }

    const { POST: createRegistration } = await import('../src/app/api/registrations/route')
    const unverifiedRegistration = await createRegistration(new NextRequest('http://localhost/api/registrations', {
      method: 'POST',
      body: new Uint8Array(),
    }))
    assert.equal(unverifiedRegistration.status, 403)
    assert.match((await unverifiedRegistration.json() as { error: string }).error, /FACEIT/)

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
