import { NextRequest, NextResponse } from 'next/server'
import { createUser, generateToken } from '@/lib/auth'
import { createSessionCookie } from '@/lib/session'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  company: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, company } = signupSchema.parse(body)

    const user = await createUser(email, password, name, company)
    const token = generateToken(user)
    const sessionCookie = createSessionCookie(token)

    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    })

    response.cookies.set(sessionCookie)

    return response
  } catch (error: unknown) {
    // Always log errors for debugging (Vercel logs will capture this)
    console.error('Signup error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      code: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    })

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      // Prisma connection errors
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: 'Database connection failed. Please try again later.' },
          { status: 503 }
        )
      }
      // Prisma schema/migration errors
      if (error.message.includes('does not exist') || error.message.includes('column')) {
        return NextResponse.json(
          { error: 'Database schema error. Please contact support.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}