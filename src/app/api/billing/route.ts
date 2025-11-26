import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { PLANS, isSubscriptionActive, isTrialExpired } from '@/lib/stripe'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get tenant with billing info
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        trialEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        _count: {
          select: {
            leads: true,
            widgets: true,
            users: true,
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get leads created this billing period
    const periodStart = tenant.currentPeriodEnd
      ? new Date(new Date(tenant.currentPeriodEnd).getTime() - 30 * 24 * 60 * 60 * 1000)
      : new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)

    const leadsThisPeriod = await prisma.lead.count({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: periodStart,
        },
      },
    })

    // Get conversations this period
    const conversationsThisPeriod = await prisma.conversation.count({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: periodStart,
        },
      },
    })

    // Get plan details
    const planDetails = PLANS[tenant.plan as keyof typeof PLANS] || null

    // Check subscription state
    const isActive = isSubscriptionActive(tenant.subscriptionStatus)
    const trialExpired = isTrialExpired(tenant.trialEndsAt, tenant.subscriptionStatus)

    return NextResponse.json({
      billing: {
        plan: tenant.plan,
        planDetails,
        subscriptionStatus: tenant.subscriptionStatus,
        currentPeriodEnd: tenant.currentPeriodEnd,
        trialEndsAt: tenant.trialEndsAt,
        hasStripeAccount: !!tenant.stripeCustomerId,
        hasActiveSubscription: !!tenant.stripeSubscriptionId,
        isActive,
        trialExpired,
      },
      usage: {
        totalLeads: tenant._count.leads,
        leadsThisPeriod,
        conversationsThisPeriod,
        widgets: tenant._count.widgets,
        teamMembers: tenant._count.users,
      },
      plans: PLANS,
    })
  } catch (error) {
    console.error('Billing fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    )
  }
}
