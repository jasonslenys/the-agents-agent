import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { name, password } = await request.json()

    if (!name?.trim() || !password) {
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    // Find the invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { tenant: true }
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

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          name: name.trim(),
          passwordHash,
          role: invitation.role,
          tenantId: invitation.tenantId
        }
      })

      // Update invitation status
      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' }
      })

      return newUser
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully',
      userId: result.id 
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}