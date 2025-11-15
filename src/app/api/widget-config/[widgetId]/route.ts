import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  try {
    const { widgetId } = await params

    const widget = await prisma.widget.findFirst({
      where: { 
        publicKey: widgetId,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        greetingText: true,
        primaryColor: true,
        tenantId: true,
      }
    })

    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found or inactive' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      config: {
        id: widget.id,
        name: widget.name,
        greetingText: widget.greetingText,
        primaryColor: widget.primaryColor,
      }
    })
  } catch (error) {
    console.error('Widget config error:', error)
    return NextResponse.json(
      { error: 'Failed to load widget configuration' },
      { status: 500 }
    )
  }
}