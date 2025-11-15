import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/session'

export async function POST() {
  const response = NextResponse.json({ success: true })
  const sessionCookie = clearSessionCookie()
  response.cookies.set(sessionCookie)
  return response
}