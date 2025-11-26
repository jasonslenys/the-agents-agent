import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { sendTestNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Get app base URL for email links
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                      (request.headers.get('origin') || 'http://localhost:3000')

    await sendTestNotification(email, appBaseUrl)

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully'
    })

  } catch (error) {
    console.error('Test notification error:', error)
    
    // Handle specific email errors
    if (error instanceof Error && error.message.includes('SMTP')) {
      return NextResponse.json(
        { error: 'Email configuration error. Please check your SMTP settings.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send test notification. Please check your email configuration.' },
      { status: 500 }
    )
  }
}