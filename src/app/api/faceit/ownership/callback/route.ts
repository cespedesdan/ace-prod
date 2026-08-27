import { NextRequest, NextResponse } from 'next/server'
import { FaceitApiError, getFaceitTeam } from '@/lib/faceit'
import {
  createFaceitOwnershipProof,
  exchangeFaceitAuthorizationCode,
  FaceitOAuthError,
  FACEIT_OWNERSHIP_TTL_SECONDS,
  getFaceitCookieOptions,
  getFaceitOAuthCookieNames,
  getRegistrationReturnUrl,
  verifyFaceitOAuthState,
} from '@/lib/faceit-ownership'

export const runtime = 'nodejs'

function redirectWithError(error: string) {
  return NextResponse.redirect(getRegistrationReturnUrl(error), 303)
}

function safeErrorResponse(error: string) {
  try {
    return redirectWithError(error)
  } catch {
    return NextResponse.json({ error: 'A autenticação FACEIT ainda não está configurada.' }, { status: 503 })
  }
}

export async function GET(request: NextRequest) {
  const cookieNames = getFaceitOAuthCookieNames()
  const stateToken = request.cookies.get(cookieNames.state)?.value
  const returnedState = request.nextUrl.searchParams.get('state') || ''
  const code = request.nextUrl.searchParams.get('code') || ''
  const providerError = request.nextUrl.searchParams.get('error')

  let response: NextResponse
  try {
    if (providerError) {
      response = redirectWithError('access_denied')
    } else if (!stateToken || !returnedState || returnedState.length > 256 || !code || code.length > 2048) {
      response = redirectWithError('invalid_callback')
    } else {
      const state = verifyFaceitOAuthState(stateToken, returnedState)
      if (!state) {
        response = redirectWithError('invalid_state')
      } else {
        const playerId = await exchangeFaceitAuthorizationCode(code, state.verifier)
        const team = await getFaceitTeam(`https://www.faceit.com/pt/teams/${state.teamId}`)
        const leader = team.members.find((member) => member.isLeader)
        if (!leader || leader.playerId.toLowerCase() !== playerId) {
          response = redirectWithError('not_team_leader')
        } else {
          const returnUrl = getRegistrationReturnUrl()
          returnUrl.searchParams.set('faceit_verified', team.teamId)
          response = NextResponse.redirect(returnUrl, 303)
          response.cookies.set(
            cookieNames.ownership,
            createFaceitOwnershipProof(team.teamId, playerId),
            getFaceitCookieOptions(FACEIT_OWNERSHIP_TTL_SECONDS),
          )
        }
      }
    }
  } catch (error) {
    if (error instanceof FaceitApiError || error instanceof FaceitOAuthError) {
      response = safeErrorResponse(error.status === 503 ? 'temporarily_unavailable' : 'authentication_failed')
    } else {
      console.error('FACEIT ownership callback error:', error)
      response = safeErrorResponse('authentication_failed')
    }
  }

  response.cookies.set(cookieNames.state, '', getFaceitCookieOptions(0))
  return response
}
