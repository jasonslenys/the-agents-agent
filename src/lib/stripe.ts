import Stripe from 'stripe'

// Initialize Stripe with the secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  console.warn('STRIPE_SECRET_KEY is not set. Billing features will be disabled.')
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      typescript: true,
    })
  : null

// Plan configuration - price IDs come from environment variables
export const PLANS = {
  solo: {
    id: 'solo',
    name: 'Solo Agent',
    description: 'Perfect for individual agents',
    priceId: process.env.STRIPE_PRICE_SOLO || '',
    price: 29,
    interval: 'month' as const,
    features: [
      '1 chat widget',
      'Unlimited conversations',
      'Lead qualification',
      'Email notifications',
      'Basic analytics',
    ],
    limits: {
      widgets: 1,
      teamMembers: 1,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    description: 'For small teams and partnerships',
    priceId: process.env.STRIPE_PRICE_TEAM || '',
    price: 79,
    interval: 'month' as const,
    features: [
      '5 chat widgets',
      'Unlimited conversations',
      'Lead qualification',
      'Email notifications',
      'Advanced analytics',
      'Team management (up to 5)',
      'Lead assignment',
    ],
    limits: {
      widgets: 5,
      teamMembers: 5,
    },
  },
  brokerage: {
    id: 'brokerage',
    name: 'Brokerage',
    description: 'For brokerages and large teams',
    priceId: process.env.STRIPE_PRICE_BROKERAGE || '',
    price: 199,
    interval: 'month' as const,
    features: [
      'Unlimited widgets',
      'Unlimited conversations',
      'Lead qualification',
      'Email notifications',
      'Advanced analytics',
      'Unlimited team members',
      'Lead assignment',
      'Priority support',
      'Custom branding',
    ],
    limits: {
      widgets: -1, // unlimited
      teamMembers: -1, // unlimited
    },
  },
} as const

export type PlanId = keyof typeof PLANS
export type Plan = (typeof PLANS)[PlanId]

export const TRIAL_DAYS = 14

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'

export interface BillingInfo {
  plan: string
  subscriptionStatus: SubscriptionStatus
  currentPeriodEnd: Date | null
  trialEndsAt: Date | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

// Helper to check if billing is active (can use features)
export function isSubscriptionActive(status: string | null): boolean {
  return status === 'active' || status === 'trialing'
}

// Helper to check if trial has expired
export function isTrialExpired(trialEndsAt: Date | null, subscriptionStatus: string | null): boolean {
  if (subscriptionStatus === 'active') return false
  if (!trialEndsAt) return true
  return new Date() > new Date(trialEndsAt)
}

// Helper to get plan limits
export function getPlanLimits(planId: string): { widgets: number; teamMembers: number } {
  const plan = PLANS[planId as PlanId]
  if (plan) {
    return plan.limits
  }
  // Trial gets solo limits
  return PLANS.solo.limits
}

// Create a Stripe customer for a tenant
export async function createStripeCustomer(
  email: string,
  name: string,
  tenantId: string
): Promise<Stripe.Customer | null> {
  if (!stripe) return null

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      tenantId,
    },
  })

  return customer
}

// Create a checkout session for a plan
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  tenantId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) return null

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tenantId,
    },
    subscription_data: {
      metadata: {
        tenantId,
      },
    },
  })

  return session
}

// Create a billing portal session
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session | null> {
  if (!stripe) return null

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

// Get subscription details
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  if (!stripe) return null

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch {
    return null
  }
}

// Cancel a subscription
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription | null> {
  if (!stripe) return null

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  })

  return subscription
}

// Verify webhook signature
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe) return null

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return null
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return null
  }
}

// Map Stripe subscription status to our status
export function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    case 'unpaid':
    case 'incomplete':
      return 'unpaid'
    default:
      return 'canceled'
  }
}

// Get plan ID from price ID
export function getPlanFromPriceId(priceId: string): PlanId | null {
  for (const [planId, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) {
      return planId as PlanId
    }
  }
  return null
}
