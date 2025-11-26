import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params

    // Find the invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: { name: true }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation has already been used' }, { status: 410 })
    }

    // Get inviter name
    const inviter = await prisma.user.findUnique({
      where: { id: invitation.invitedBy },
      select: { name: true }
    })

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      tenantName: invitation.tenant.name,
      inviterName: inviter?.name || 'Unknown',
      expiresAt: invitation.expiresAt
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}