import { NextRequest, NextResponse } from 'next/server'
import { adminCookieName, requireSameOrigin } from '@/lib/admin-request'

export async function POST(request: NextRequest) {
  const invalidOrigin = requireSameOrigin(request)
  if (invalidOrigin) return invalidOrigin

  const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(adminCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}
