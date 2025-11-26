'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Users,
  MessageSquare,
  BarChart3,
  Clock,
} from 'lucide-react'

interface PlanDetails {
  id: string
  name: string
  description: string
  price: number
  interval: string
  features: string[]
  limits: {
    widgets: number
    teamMembers: number
  }
}

interface BillingData {
  billing: {
    plan: string
    planDetails: PlanDetails | null
    subscriptionStatus: string
    currentPeriodEnd: string | null
    trialEndsAt: string | null
    hasStripeAccount: boolean
    hasActiveSubscription: boolean
    isActive: boolean
    trialExpired: boolean
  }
  usage: {
    totalLeads: number
    leadsThisPeriod: number
    conversationsThisPeriod: number
    widgets: number
    teamMembers: number
  }
  plans: Record<string, PlanDetails>
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    // Check for success/cancel from Stripe redirect
    if (searchParams.get('success') === 'true') {
      setMessage({ type: 'success', text: 'Subscription updated successfully!' })
    } else if (searchParams.get('canceled') === 'true') {
      setMessage({ type: 'error', text: 'Checkout was canceled.' })
    }

    loadBillingData()
  }, [searchParams])

  const loadBillingData = async () => {
    try {
      const response = await fetch('/api/billing')
      if (response.ok) {
        const data = await response.json()
        setBillingData(data)
      }
    } catch (error) {
      console.error('Failed to load billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(planId)
    setMessage(null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start checkout' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start checkout' })
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleManageBilling = async () => {
    setPortalLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to open billing portal' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to open billing portal' })
    } finally {
      setPortalLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      canceled: 'bg-red-100 text-red-800',
      unpaid: 'bg-red-100 text-red-800',
    }

    const labels: Record<string, string> = {
      active: 'Active',
      trialing: 'Trial',
      past_due: 'Past Due',
      canceled: 'Canceled',
      unpaid: 'Unpaid',
    }

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6 h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!billingData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            Failed to load billing information. Please try again.
          </div>
        </div>
      </div>
    )
  }

  const { billing, usage, plans } = billingData

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          {billing.hasStripeAccount && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Manage Billing
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Current Plan Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Plan</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {billing.planDetails?.name || billing.plan}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              {getStatusBadge(billing.subscriptionStatus)}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">
                {billing.subscriptionStatus === 'trialing' ? 'Trial Ends' : 'Renews On'}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {billing.subscriptionStatus === 'trialing' && billing.trialEndsAt
                  ? new Date(billing.trialEndsAt).toLocaleDateString()
                  : billing.currentPeriodEnd
                  ? new Date(billing.currentPeriodEnd).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Monthly Price</p>
              <p className="text-lg font-semibold text-gray-900">
                {billing.planDetails ? `$${billing.planDetails.price}` : 'Free Trial'}
              </p>
            </div>
          </div>

          {!billing.isActive && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Action Required</p>
                <p className="text-sm text-yellow-700">
                  {billing.trialExpired
                    ? 'Your trial has expired. Please select a plan to continue using the widget.'
                    : 'Your subscription is inactive. Please update your payment method to restore access.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Usage Statistics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage This Period</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{usage.leadsThisPeriod}</p>
                <p className="text-sm text-gray-500">New Leads</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{usage.conversationsThisPeriod}</p>
                <p className="text-sm text-gray-500">Conversations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{usage.widgets}</p>
                <p className="text-sm text-gray-500">Active Widgets</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{usage.totalLeads}</p>
                <p className="text-sm text-gray-500">Total Leads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(plans).map(([planId, plan]) => {
            const isCurrentPlan = billing.plan === planId
            const isPopular = planId === 'team'

            return (
              <div
                key={planId}
                className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                  isPopular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {isPopular && (
                  <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/{plan.interval}</span>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckout(planId)}
                        disabled={checkoutLoading === planId}
                        className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
                          isPopular
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        } disabled:opacity-50`}
                      >
                        {checkoutLoading === planId ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            {billing.hasActiveSubscription ? 'Change Plan' : 'Subscribe'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Can I change plans at any time?</h3>
              <p className="text-gray-600 text-sm mt-1">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">What happens when my trial ends?</h3>
              <p className="text-gray-600 text-sm mt-1">
                When your 14-day trial ends, your widget will pause until you select a plan. All your data is preserved.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">How do I cancel my subscription?</h3>
              <p className="text-gray-600 text-sm mt-1">
                Click &quot;Manage Billing&quot; to access the customer portal where you can cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
