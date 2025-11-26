import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  constructWebhookEvent,
  mapStripeStatus,
  getPlanFromPriceId,
} from '@/lib/stripe'
import Stripe from 'stripe'

// Disable body parsing - we need raw body for signature verification
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    const event = constructWebhookEvent(body, signature)

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const tenantId = session.metadata?.tenantId
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!tenantId) {
    console.error('No tenantId in checkout session metadata')
    return
  }

  // Update tenant with Stripe customer ID if not already set
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    },
  })

  console.log(`Checkout completed for tenant ${tenantId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  // Type assertion for invoice subscription property
  const invoiceAny = invoice as unknown as { subscription: string | { id: string } | null }
  const subscriptionId = typeof invoiceAny.subscription === 'string'
    ? invoiceAny.subscription
    : invoiceAny.subscription?.id

  if (!subscriptionId) {
    // One-time payment, not a subscription
    return
  }

  // Find tenant by Stripe customer ID
  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!tenant) {
    console.error(`No tenant found for customer ${customerId}`)
    return
  }

  // Payment succeeded, ensure subscription is active
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: 'active',
    },
  })

  console.log(`Payment succeeded for tenant ${tenant.id}`)
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata?.tenantId
  const customerId = subscription.customer as string

  // Find tenant by metadata or customer ID
  let tenant = tenantId
    ? await prisma.tenant.findUnique({ where: { id: tenantId } })
    : await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } })

  if (!tenant) {
    console.error(`No tenant found for subscription ${subscription.id}`)
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const planId = getPlanFromPriceId(priceId) || 'solo'
  const status = mapStripeStatus(subscription.status)

  // Type assertion for Stripe subscription properties
  const subAny = subscription as unknown as {
    current_period_end: number
    trial_end: number | null
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan: planId,
      subscriptionStatus: status,
      currentPeriodEnd: new Date(subAny.current_period_end * 1000),
      trialEndsAt: subAny.trial_end
        ? new Date(subAny.trial_end * 1000)
        : null,
    },
  })

  console.log(`Subscription created for tenant ${tenant.id}: ${planId} (${status})`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find tenant by subscription ID first, then customer ID
  let tenant = await prisma.tenant.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customerId },
    })
  }

  if (!tenant) {
    console.error(`No tenant found for subscription ${subscription.id}`)
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const planId = getPlanFromPriceId(priceId) || tenant.plan
  const status = mapStripeStatus(subscription.status)

  // Type assertion for Stripe subscription properties
  const subAny = subscription as unknown as {
    current_period_end: number
    trial_end: number | null
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan: planId,
      subscriptionStatus: status,
      currentPeriodEnd: new Date(subAny.current_period_end * 1000),
      trialEndsAt: subAny.trial_end
        ? new Date(subAny.trial_end * 1000)
        : null,
    },
  })

  console.log(`Subscription updated for tenant ${tenant.id}: ${planId} (${status})`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find tenant by subscription ID or customer ID
  let tenant = await prisma.tenant.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customerId },
    })
  }

  if (!tenant) {
    console.error(`No tenant found for deleted subscription ${subscription.id}`)
    return
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      stripePriceId: null,
    },
  })

  console.log(`Subscription canceled for tenant ${tenant.id}`)
}
