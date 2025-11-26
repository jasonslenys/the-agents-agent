import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { sendTeamInvitationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    }

    // Validate role
    if (!['owner', 'agent'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user is owner
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { tenant: true }
    })

    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: Only owners can invite team members' }, { status: 403 })
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        tenantId: user.tenantId
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 })
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        email: email,
        tenantId: user.tenantId,
        status: 'pending'
      }
    })

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already sent to this email' }, { status: 400 })
    }

    // Create invitation
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    const invitation = await prisma.teamInvitation.create({
      data: {
        email,
        role,
        tenantId: user.tenantId,
        invitedBy: session.id,
        expiresAt
      }
    })

    // Send invitation email
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/invite/${invitation.token}`
    
    try {
      await sendTeamInvitationEmail({
        to: email,
        inviterName: user.name,
        tenantName: user.tenant.name,
        role,
        inviteLink
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      invitationId: invitation.id 
    })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}