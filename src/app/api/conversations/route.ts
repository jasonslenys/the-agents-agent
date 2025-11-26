import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createConversationSchema = z.object({
  widgetId: z.string(),
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { widgetId } = createConversationSchema.parse(body)

    // Find widget by public key
    const widget = await prisma.widget.findFirst({
      where: { 
        publicKey: widgetId,
        isActive: true 
      }
    })

    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found or inactive' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        tenantId: widget.tenantId,
        widgetId: widget.id,
      },
    })

    return NextResponse.json({ 
      success: true, 
      conversationId: conversation.id 
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  } catch (error) {
    console.error('Conversation creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
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