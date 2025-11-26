import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      widgetKey, 
      eventType, 
      sessionId, 
      userAgent, 
      referrer 
    } = body

    // Validate required fields
    if (!widgetKey || !eventType) {
      return NextResponse.json(
        { error: 'Widget key and event type are required' },
        { status: 400 }
      )
    }

    // Find widget by public key
    const widget = await prisma.widget.findFirst({
      where: { 
        publicKey: widgetKey,
        isActive: true 
      }
    })

    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found or inactive' },
        { status: 404 }
      )
    }

    // Create event record
    await prisma.widgetEvent.create({
      data: {
        eventType,
        sessionId,
        userAgent: userAgent || request.headers.get('user-agent'),
        referrer: referrer || request.headers.get('referer'),
        tenantId: widget.tenantId,
        widgetId: widget.id,
      },
    })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Analytics event error:', error)
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}