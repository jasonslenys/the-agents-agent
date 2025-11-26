import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is owner
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { role: true, tenantId: true }
    })

    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: Only owners can cancel invitations' }, { status: 403 })
    }

    // Find and delete the invitation
    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: id,
        tenantId: user.tenantId
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    await prisma.teamInvitation.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true, message: 'Invitation cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}