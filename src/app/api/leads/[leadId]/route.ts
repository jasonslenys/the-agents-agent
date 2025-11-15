import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z, ZodError } from 'zod'

const updateLeadSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  intent: z.string().optional(),
  qualificationScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await requireAuth()
    const { leadId } = await params
    const body = await request.json()
    
    const updates = updateLeadSchema.parse(body)
    
    // Verify lead belongs to the user's tenant
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: session.tenantId
      }
    })
    
    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    // Clean up the updates object - remove empty strings and convert them to null
    // Using explicit property mapping to prevent object injection
    const cleanUpdates: Partial<{
      name: string | null;
      email: string | null;
      phone: string | null;
      intent: string | null;
      qualificationScore: number | null;
      notes: string | null;
    }> = {}
    
    // Safely map only allowed fields
    const allowedFields = ['name', 'email', 'phone', 'intent', 'qualificationScore', 'notes'] as const
    
    for (const field of allowedFields) {
      if (field in updates) {
        const value = updates[field]
        if (value === '') {
          cleanUpdates[field] = null
        } else if (value !== undefined) {
          // Type-safe assignment based on field type
          if (field === 'qualificationScore' && typeof value === 'number') {
            cleanUpdates[field] = value
          } else if (typeof value === 'string') {
            cleanUpdates[field] = value
          }
        }
      }
    }
    
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: cleanUpdates,
      include: {
        widget: true,
        conversations: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json({ success: true, lead: updatedLead })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await requireAuth()
    const { leadId } = await params

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: session.tenantId
      },
      include: {
        widget: true,
        conversations: {
          orderBy: { createdAt: 'desc' },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ lead })
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Lead fetch error:', error)
    }
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}