import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createWidgetSchema = z.object({
  name: z.string().min(1),
  greetingText: z.string().min(1),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  position: z.string().default('bottom-right'),
  bubbleText: z.string().default('Chat with my AI assistant'),
  agentName: z.string().optional(),
  companyName: z.string().optional(),
  isActive: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { name, greetingText, primaryColor, position, bubbleText, agentName, companyName, isActive } = createWidgetSchema.parse(body)

    const widget = await prisma.widget.create({
      data: {
        name,
        greetingText,
        primaryColor,
        position,
        bubbleText,
        agentName,
        companyName,
        isActive,
        tenantId: session.tenantId,
      },
    })

    return NextResponse.json({ success: true, widget })
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Widget creation error:', error)
    }
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to create widget' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await requireAuth()

    const widgets = await prisma.widget.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            leads: true,
            conversations: true,
          }
        }
      }
    })

    return NextResponse.json({ widgets })
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Widget fetch error:', error)
    }
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch widgets' },
      { status: 500 }
    )
  }
}