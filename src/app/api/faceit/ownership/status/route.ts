import { NextRequest, NextResponse } from 'next/server'
import { getFaceitOAuthCookieNames, verifyFaceitOwnershipProof } from '@/lib/faceit-ownership'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getFaceitOAuthCookieNames().ownership)?.value
  const proof = token ? verifyFaceitOwnershipProof(token) : null
  return NextResponse.json(
    { verified: Boolean(proof), teamId: proof?.teamId || null },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
