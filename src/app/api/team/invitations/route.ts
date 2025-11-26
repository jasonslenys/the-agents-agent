import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Forbidden: Only owners can access team management' }, { status: 403 })
    }

    // Get pending invitations for this tenant
    const invitations = await prisma.teamInvitation.findMany({
      where: { 
        tenantId: user.tenantId,
        status: 'pending'
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}