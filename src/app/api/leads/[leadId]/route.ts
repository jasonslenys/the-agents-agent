import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissions, routePermissions, PermissionContext } from '@/lib/permissions'
import { z } from 'zod'

const leadUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  intent: z.string().optional(),
  qualificationScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  assignedUserId: z.string().optional().or(z.literal(''))
})

async function handleLeadUpdate(
  request: NextRequest, 
  context: PermissionContext,
  { params }: { params: Promise<{ leadId: string }> }
): Promise<NextResponse> {
  try {
    const { leadId } = await params
    const body = await request.json()
    const validatedData = leadUpdateSchema.parse(body)

    // Check if lead exists and belongs to the tenant
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: context.user.tenantId
      }
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // If assigning to someone, verify that user exists and belongs to same tenant
    if (validatedData.assignedUserId && validatedData.assignedUserId !== '') {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: validatedData.assignedUserId,
          tenantId: context.user.tenantId
        }
      })

      if (!assignedUser) {
        return NextResponse.json(
          { error: 'Assigned user not found or not in same organization' },
          { status: 400 }
        )
      }

      // Only owners can assign leads
      if (context.user.role !== 'owner') {
        return NextResponse.json(
          { error: 'Only owners can assign leads' },
          { status: 403 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name || null
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null
    if (validatedData.intent !== undefined) updateData.intent = validatedData.intent || null
    if (validatedData.qualificationScore !== undefined) updateData.qualificationScore = validatedData.qualificationScore
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null
    if (validatedData.assignedUserId !== undefined) {
      updateData.assignedUserId = validatedData.assignedUserId || null
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      lead: updatedLead
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Lead update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ leadId: string }> }) {
  return withPermissions(
    request,
    routePermissions.leads,
    (req, permContext) => handleLeadUpdate(req, permContext, context)
  )
}
