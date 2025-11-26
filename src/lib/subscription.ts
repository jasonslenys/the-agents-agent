import { prisma } from './prisma'
import { isSubscriptionActive, isTrialExpired } from './stripe'

export interface SubscriptionCheck {
  isActive: boolean
  canUseWidget: boolean
  reason: string | null
  plan: string
  status: string
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
}

// Check if a tenant has an active subscription
export async function checkTenantSubscription(tenantId: string): Promise<SubscriptionCheck> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
    },
  })

  if (!tenant) {
    return {
      isActive: false,
      canUseWidget: false,
      reason: 'Tenant not found',
      plan: 'none',
      status: 'none',
      trialEndsAt: null,
      currentPeriodEnd: null,
    }
  }

  const isActive = isSubscriptionActive(tenant.subscriptionStatus)
  const trialExpired = isTrialExpired(tenant.trialEndsAt, tenant.subscriptionStatus)

  // Determine if widget can be used
  let canUseWidget = false
  let reason: string | null = null

  if (isActive) {
    canUseWidget = true
  } else if (tenant.subscriptionStatus === 'trialing' && !trialExpired) {
    canUseWidget = true
  } else if (tenant.subscriptionStatus === 'past_due') {
    // Give a grace period for past due accounts
    canUseWidget = false
    reason = 'Payment past due. Please update your payment method.'
  } else if (trialExpired) {
    canUseWidget = false
    reason = 'Trial expired. Please subscribe to continue.'
  } else {
    canUseWidget = false
    reason = 'Subscription inactive. Please subscribe to continue.'
  }

  return {
    isActive,
    canUseWidget,
    reason,
    plan: tenant.plan,
    status: tenant.subscriptionStatus,
    trialEndsAt: tenant.trialEndsAt,
    currentPeriodEnd: tenant.currentPeriodEnd,
  }
}

// Check subscription by widget public key (for widget endpoint)
export async function checkWidgetSubscription(publicKey: string): Promise<SubscriptionCheck & { widgetActive: boolean }> {
  const widget = await prisma.widget.findUnique({
    where: { publicKey },
    select: {
      isActive: true,
      tenant: {
        select: {
          id: true,
          plan: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
        },
      },
    },
  })

  if (!widget) {
    return {
      isActive: false,
      canUseWidget: false,
      widgetActive: false,
      reason: 'Widget not found',
      plan: 'none',
      status: 'none',
      trialEndsAt: null,
      currentPeriodEnd: null,
    }
  }

  const tenant = widget.tenant
  const isActive = isSubscriptionActive(tenant.subscriptionStatus)
  const trialExpired = isTrialExpired(tenant.trialEndsAt, tenant.subscriptionStatus)

  let canUseWidget = false
  let reason: string | null = null

  if (!widget.isActive) {
    canUseWidget = false
    reason = 'Widget is disabled'
  } else if (isActive) {
    canUseWidget = true
  } else if (tenant.subscriptionStatus === 'trialing' && !trialExpired) {
    canUseWidget = true
  } else if (trialExpired) {
    canUseWidget = false
    reason = 'Service temporarily unavailable'
  } else {
    canUseWidget = false
    reason = 'Service temporarily unavailable'
  }

  return {
    isActive,
    canUseWidget,
    widgetActive: widget.isActive,
    reason,
    plan: tenant.plan,
    status: tenant.subscriptionStatus,
    trialEndsAt: tenant.trialEndsAt,
    currentPeriodEnd: tenant.currentPeriodEnd,
  }
}

// Get days remaining in trial
export function getTrialDaysRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0
  const now = new Date()
  const trialEnd = new Date(trialEndsAt)
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}
