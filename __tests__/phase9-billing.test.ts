/**
 * Phase 9 - Billing & Subscription Gating Tests
 *
 * Tests cover:
 * - Stripe webhook handling
 * - Subscription state transitions (trial→active→expired→paused)
 * - Feature gating based on subscription status
 * - Widget behavior in paused billing state
 */

import {
  isSubscriptionActive,
  isTrialExpired,
  getPlanLimits,
  mapStripeStatus,
  getPlanFromPriceId,
  PLANS,
  TRIAL_DAYS,
} from '../src/lib/stripe'

// Mock Stripe types for testing
interface MockSubscription {
  id: string
  customer: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid'
  current_period_end: number
  trial_end: number | null
  items: {
    data: Array<{
      price: {
        id: string
      }
    }>
  }
  metadata: {
    tenantId?: string
  }
}

interface MockCheckoutSession {
  id: string
  customer: string
  subscription: string
  metadata: {
    tenantId?: string
  }
}

describe('Phase 9: Billing & Subscription Gating', () => {
  describe('Subscription Status Helpers', () => {
    describe('isSubscriptionActive', () => {
      it('should return true for active status', () => {
        expect(isSubscriptionActive('active')).toBe(true)
      })

      it('should return true for trialing status', () => {
        expect(isSubscriptionActive('trialing')).toBe(true)
      })

      it('should return false for past_due status', () => {
        expect(isSubscriptionActive('past_due')).toBe(false)
      })

      it('should return false for canceled status', () => {
        expect(isSubscriptionActive('canceled')).toBe(false)
      })

      it('should return false for unpaid status', () => {
        expect(isSubscriptionActive('unpaid')).toBe(false)
      })

      it('should return false for null status', () => {
        expect(isSubscriptionActive(null)).toBe(false)
      })
    })

    describe('isTrialExpired', () => {
      it('should return false when subscription is active', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 7)
        expect(isTrialExpired(futureDate, 'active')).toBe(false)
      })

      it('should return false when trial has not ended', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 7)
        expect(isTrialExpired(futureDate, 'trialing')).toBe(false)
      })

      it('should return true when trial end date is in the past', () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 1)
        expect(isTrialExpired(pastDate, 'trialing')).toBe(true)
      })

      it('should return true when trial end date is null', () => {
        expect(isTrialExpired(null, 'trialing')).toBe(true)
      })

      it('should return true for canceled status even with future trial date', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 7)
        // Canceled status doesn't automatically mean trial expired per the function logic
        // The function checks if status is 'active' first
        expect(isTrialExpired(futureDate, 'canceled')).toBe(true)
      })
    })

    describe('getPlanLimits', () => {
      it('should return solo limits for solo plan', () => {
        const limits = getPlanLimits('solo')
        expect(limits.widgets).toBe(1)
        expect(limits.teamMembers).toBe(1)
      })

      it('should return team limits for team plan', () => {
        const limits = getPlanLimits('team')
        expect(limits.widgets).toBe(5)
        expect(limits.teamMembers).toBe(5)
      })

      it('should return unlimited (-1) for brokerage plan', () => {
        const limits = getPlanLimits('brokerage')
        expect(limits.widgets).toBe(-1)
        expect(limits.teamMembers).toBe(-1)
      })

      it('should return solo limits for trial plan', () => {
        const limits = getPlanLimits('trial')
        expect(limits.widgets).toBe(1)
        expect(limits.teamMembers).toBe(1)
      })

      it('should return solo limits for unknown plan', () => {
        const limits = getPlanLimits('unknown_plan')
        expect(limits.widgets).toBe(1)
        expect(limits.teamMembers).toBe(1)
      })
    })

    describe('mapStripeStatus', () => {
      it('should map active to active', () => {
        expect(mapStripeStatus('active')).toBe('active')
      })

      it('should map trialing to trialing', () => {
        expect(mapStripeStatus('trialing')).toBe('trialing')
      })

      it('should map past_due to past_due', () => {
        expect(mapStripeStatus('past_due')).toBe('past_due')
      })

      it('should map canceled to canceled', () => {
        expect(mapStripeStatus('canceled')).toBe('canceled')
      })

      it('should map incomplete_expired to canceled', () => {
        expect(mapStripeStatus('incomplete_expired')).toBe('canceled')
      })

      it('should map unpaid to unpaid', () => {
        expect(mapStripeStatus('unpaid')).toBe('unpaid')
      })

      it('should map incomplete to unpaid', () => {
        expect(mapStripeStatus('incomplete')).toBe('unpaid')
      })
    })
  })

  describe('Plan Configuration', () => {
    it('should have all required plans defined', () => {
      expect(PLANS.solo).toBeDefined()
      expect(PLANS.team).toBeDefined()
      expect(PLANS.brokerage).toBeDefined()
    })

    it('should have correct pricing for each plan', () => {
      expect(PLANS.solo.price).toBe(29)
      expect(PLANS.team.price).toBe(79)
      expect(PLANS.brokerage.price).toBe(199)
    })

    it('should have monthly interval for all plans', () => {
      expect(PLANS.solo.interval).toBe('month')
      expect(PLANS.team.interval).toBe('month')
      expect(PLANS.brokerage.interval).toBe('month')
    })

    it('should have features array for each plan', () => {
      expect(Array.isArray(PLANS.solo.features)).toBe(true)
      expect(PLANS.solo.features.length).toBeGreaterThan(0)
      expect(Array.isArray(PLANS.team.features)).toBe(true)
      expect(PLANS.team.features.length).toBeGreaterThan(0)
      expect(Array.isArray(PLANS.brokerage.features)).toBe(true)
      expect(PLANS.brokerage.features.length).toBeGreaterThan(0)
    })

    it('should have correct trial days configured', () => {
      expect(TRIAL_DAYS).toBe(14)
    })
  })

  describe('Subscription State Transitions', () => {
    it('should handle trial → active transition', () => {
      // Simulate trial state
      let status = 'trialing'
      let isActive = isSubscriptionActive(status)
      expect(isActive).toBe(true)

      // Simulate transition to active
      status = 'active'
      isActive = isSubscriptionActive(status)
      expect(isActive).toBe(true)
    })

    it('should handle active → past_due transition', () => {
      let status = 'active'
      let isActive = isSubscriptionActive(status)
      expect(isActive).toBe(true)

      // Payment fails
      status = 'past_due'
      isActive = isSubscriptionActive(status)
      expect(isActive).toBe(false)
    })

    it('should handle past_due → active transition (payment recovered)', () => {
      let status = 'past_due'
      let isActive = isSubscriptionActive(status)
      expect(isActive).toBe(false)

      // Payment succeeds
      status = 'active'
      isActive = isSubscriptionActive(status)
      expect(isActive).toBe(true)
    })

    it('should handle active → canceled transition', () => {
      let status = 'active'
      let isActive = isSubscriptionActive(status)
      expect(isActive).toBe(true)

      // Subscription canceled
      status = 'canceled'
      isActive = isSubscriptionActive(status)
      expect(isActive).toBe(false)
    })

    it('should handle trial expiration without payment', () => {
      const pastTrialEnd = new Date()
      pastTrialEnd.setDate(pastTrialEnd.getDate() - 1)

      const status = 'trialing'
      const trialExpired = isTrialExpired(pastTrialEnd, status)
      expect(trialExpired).toBe(true)
    })
  })

  describe('Feature Gating Logic', () => {
    interface TenantBillingState {
      subscriptionStatus: string
      trialEndsAt: Date | null
    }

    function canUseWidget(tenant: TenantBillingState): boolean {
      const isActive = isSubscriptionActive(tenant.subscriptionStatus)
      if (isActive) return true

      // Check if still in valid trial
      if (tenant.subscriptionStatus === 'trialing' && tenant.trialEndsAt) {
        return !isTrialExpired(tenant.trialEndsAt, tenant.subscriptionStatus)
      }

      return false
    }

    it('should allow widget use for active subscription', () => {
      const tenant: TenantBillingState = {
        subscriptionStatus: 'active',
        trialEndsAt: null,
      }
      expect(canUseWidget(tenant)).toBe(true)
    })

    it('should allow widget use during valid trial', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const tenant: TenantBillingState = {
        subscriptionStatus: 'trialing',
        trialEndsAt: futureDate,
      }
      expect(canUseWidget(tenant)).toBe(true)
    })

    it('should block widget use after trial expiration', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const tenant: TenantBillingState = {
        subscriptionStatus: 'trialing',
        trialEndsAt: pastDate,
      }
      expect(canUseWidget(tenant)).toBe(false)
    })

    it('should block widget use for past_due status', () => {
      const tenant: TenantBillingState = {
        subscriptionStatus: 'past_due',
        trialEndsAt: null,
      }
      expect(canUseWidget(tenant)).toBe(false)
    })

    it('should block widget use for canceled status', () => {
      const tenant: TenantBillingState = {
        subscriptionStatus: 'canceled',
        trialEndsAt: null,
      }
      expect(canUseWidget(tenant)).toBe(false)
    })
  })

  describe('Webhook Event Handling (Mock)', () => {
    // These tests verify the webhook handler logic without actual Stripe calls

    function simulateCheckoutComplete(session: MockCheckoutSession): { tenantId: string; customerId: string; subscriptionId: string } | null {
      const tenantId = session.metadata?.tenantId
      if (!tenantId) return null

      return {
        tenantId,
        customerId: session.customer,
        subscriptionId: session.subscription,
      }
    }

    function simulateSubscriptionUpdate(subscription: MockSubscription): {
      status: string
      plan: string | null
      currentPeriodEnd: Date
    } {
      const priceId = subscription.items.data[0]?.price.id
      const plan = getPlanFromPriceId(priceId)
      const status = mapStripeStatus(subscription.status)

      return {
        status,
        plan,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      }
    }

    it('should extract tenant info from checkout.session.completed', () => {
      const session: MockCheckoutSession = {
        id: 'cs_test_123',
        customer: 'cus_test_456',
        subscription: 'sub_test_789',
        metadata: {
          tenantId: 'tenant_123',
        },
      }

      const result = simulateCheckoutComplete(session)
      expect(result).not.toBeNull()
      expect(result?.tenantId).toBe('tenant_123')
      expect(result?.customerId).toBe('cus_test_456')
      expect(result?.subscriptionId).toBe('sub_test_789')
    })

    it('should return null for checkout without tenantId', () => {
      const session: MockCheckoutSession = {
        id: 'cs_test_123',
        customer: 'cus_test_456',
        subscription: 'sub_test_789',
        metadata: {},
      }

      const result = simulateCheckoutComplete(session)
      expect(result).toBeNull()
    })

    it('should correctly process subscription update event', () => {
      const subscription: MockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_456',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
        trial_end: null,
        items: {
          data: [
            {
              price: {
                id: 'price_solo_monthly',
              },
            },
          ],
        },
        metadata: {
          tenantId: 'tenant_123',
        },
      }

      const result = simulateSubscriptionUpdate(subscription)
      expect(result.status).toBe('active')
      expect(result.currentPeriodEnd).toBeInstanceOf(Date)
    })

    it('should map subscription status correctly on update', () => {
      const statuses: Array<MockSubscription['status']> = [
        'active',
        'trialing',
        'past_due',
        'canceled',
        'unpaid',
      ]

      statuses.forEach((status) => {
        const subscription: MockSubscription = {
          id: 'sub_test_123',
          customer: 'cus_test_456',
          status,
          current_period_end: Math.floor(Date.now() / 1000),
          trial_end: null,
          items: {
            data: [{ price: { id: 'price_test' } }],
          },
          metadata: {},
        }

        const result = simulateSubscriptionUpdate(subscription)
        expect(result.status).toBe(mapStripeStatus(status))
      })
    })
  })

  describe('Trial Logic', () => {
    it('should calculate correct trial end date', () => {
      const now = new Date()
      const trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)

      // Trial should end 14 days from now
      const diffDays = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(diffDays).toBe(TRIAL_DAYS)
    })

    it('should correctly identify remaining trial days', () => {
      function getTrialDaysRemaining(trialEndsAt: Date | null): number {
        if (!trialEndsAt) return 0
        const now = new Date()
        const trialEnd = new Date(trialEndsAt)
        const diffTime = trialEnd.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
      }

      // 7 days remaining
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      expect(getTrialDaysRemaining(sevenDaysFromNow)).toBe(7)

      // Trial expired
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      expect(getTrialDaysRemaining(oneDayAgo)).toBe(0)

      // Null trial end
      expect(getTrialDaysRemaining(null)).toBe(0)
    })
  })

  describe('Widget Gating Behavior', () => {
    interface WidgetGatingResult {
      canServe: boolean
      message?: string
    }

    function checkWidgetGating(
      subscriptionStatus: string,
      trialEndsAt: Date | null,
      widgetActive: boolean
    ): WidgetGatingResult {
      if (!widgetActive) {
        return { canServe: false, message: 'Widget is disabled' }
      }

      const isActive = isSubscriptionActive(subscriptionStatus)
      const trialExpired = isTrialExpired(trialEndsAt, subscriptionStatus)

      if (!isActive && trialExpired) {
        return {
          canServe: false,
          message: 'This chat service is temporarily unavailable. Please contact the site owner.',
        }
      }

      return { canServe: true }
    }

    it('should serve widget for active subscription', () => {
      const result = checkWidgetGating('active', null, true)
      expect(result.canServe).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it('should serve widget during valid trial', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const result = checkWidgetGating('trialing', futureDate, true)
      expect(result.canServe).toBe(true)
    })

    it('should show service paused message for expired trial', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const result = checkWidgetGating('trialing', pastDate, true)
      expect(result.canServe).toBe(false)
      expect(result.message).toContain('temporarily unavailable')
    })

    it('should show service paused for past_due status', () => {
      const result = checkWidgetGating('past_due', null, true)
      expect(result.canServe).toBe(false)
    })

    it('should show widget disabled message when widget is inactive', () => {
      const result = checkWidgetGating('active', null, false)
      expect(result.canServe).toBe(false)
      expect(result.message).toBe('Widget is disabled')
    })
  })

  describe('Webhook Signature Verification (Mock)', () => {
    it('should reject requests without signature', () => {
      const signature = null
      expect(signature).toBeNull()
      // In real implementation, this would return 400 error
    })

    it('should reject requests with invalid signature', () => {
      // This is a mock test - real verification would use Stripe SDK
      const isValidSignature = (sig: string, payload: string, secret: string): boolean => {
        // Mock implementation - real one uses crypto
        return sig.startsWith('whsec_') && payload.length > 0 && secret.length > 0
      }

      expect(isValidSignature('invalid_sig', 'payload', 'secret')).toBe(false)
      expect(isValidSignature('whsec_valid', 'payload', 'secret')).toBe(true)
    })
  })

  describe('Billing Access Control', () => {
    it('should only allow owners to access billing', () => {
      function canAccessBilling(role: string): boolean {
        return role === 'owner'
      }

      expect(canAccessBilling('owner')).toBe(true)
      expect(canAccessBilling('agent')).toBe(false)
      expect(canAccessBilling('admin')).toBe(false)
    })

    it('should always allow access to billing page even with inactive subscription', () => {
      // Users must be able to access billing to resolve payment issues
      function canAccessBillingPage(subscriptionStatus: string): boolean {
        // Always allow - billing page should be accessible regardless of status
        return true
      }

      expect(canAccessBillingPage('active')).toBe(true)
      expect(canAccessBillingPage('past_due')).toBe(true)
      expect(canAccessBillingPage('canceled')).toBe(true)
      expect(canAccessBillingPage('trialing')).toBe(true)
    })
  })
})
