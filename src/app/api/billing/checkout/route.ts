import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import {
  stripe,
  createStripeCustomer,
  createCheckoutSession,
  PLANS,
  PlanId,
} from '@/lib/stripe'

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

    const body = await request.json()
    const { planId } = body

    // Validate plan
    if (!planId || !PLANS[planId as PlanId]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const plan = PLANS[planId as PlanId]
    if (!plan.priceId) {
      return NextResponse.json(
        { error: 'Plan pricing is not configured' },
        { status: 503 }
      )
    }

    // Get tenant with user info
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: {
        users: {
          where: { role: 'owner' },
          take: 1,
        },
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Create or get Stripe customer
    let stripeCustomerId = tenant.stripeCustomerId

    if (!stripeCustomerId) {
      const ownerUser = tenant.users[0]
      const customer = await createStripeCustomer(
        ownerUser?.email || session.email,
        tenant.name,
        tenant.id
      )

      if (!customer) {
        return NextResponse.json(
          { error: 'Failed to create billing account' },
          { status: 500 }
        )
      }

      stripeCustomerId = customer.id

      // Update tenant with Stripe customer ID
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId },
      })
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const checkoutSession = await createCheckoutSession(
      stripeCustomerId,
      plan.priceId,
      tenant.id,
      `${appUrl}/app/billing?success=true`,
      `${appUrl}/app/billing?canceled=true`
    )

    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
