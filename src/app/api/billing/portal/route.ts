import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { stripe, createBillingPortalSession } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Billing is not configured' },
        { status: 503 }
      )
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only owners can manage billing
    if (session.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only account owners can manage billing' },
        { status: 403 }
      )
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    if (!tenant.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe to a plan first.' },
        { status: 400 }
      )
    }

    // Create billing portal session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const portalSession = await createBillingPortalSession(
      tenant.stripeCustomerId,
      `${appUrl}/app/billing`
    )

    if (!portalSession) {
      return NextResponse.json(
        { error: 'Failed to create billing portal session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: portalSession.url,
    })
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: 'Failed to access billing portal' },
      { status: 500 }
    )
  }
}
