'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, X, Clock, CreditCard } from 'lucide-react'

interface BillingStatus {
  plan: string
  subscriptionStatus: string
  trialEndsAt: string | null
  isActive: boolean
  trialExpired: boolean
}

export default function BillingBanner() {
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBillingStatus()
  }, [])

  const loadBillingStatus = async () => {
    try {
      const response = await fetch('/api/billing')
      if (response.ok) {
        const data = await response.json()
        setBillingStatus(data.billing)
      }
    } catch (error) {
      console.error('Failed to load billing status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || dismissed || !billingStatus) {
    return null
  }

  // Don't show banner if subscription is active
  if (billingStatus.isActive && billingStatus.subscriptionStatus === 'active') {
    return null
  }

  // Calculate trial days remaining
  let trialDaysRemaining = 0
  if (billingStatus.trialEndsAt) {
    const trialEnd = new Date(billingStatus.trialEndsAt)
    const now = new Date()
    const diffTime = trialEnd.getTime() - now.getTime()
    trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Determine banner type and message
  let bannerType: 'warning' | 'danger' | 'info' = 'info'
  let message = ''
  let showDismiss = true

  if (billingStatus.subscriptionStatus === 'past_due') {
    bannerType = 'danger'
    message = 'Your payment is past due. Please update your payment method to avoid service interruption.'
    showDismiss = false
  } else if (billingStatus.trialExpired) {
    bannerType = 'danger'
    message = 'Your trial has expired. Subscribe now to continue using the widget.'
    showDismiss = false
  } else if (billingStatus.subscriptionStatus === 'canceled') {
    bannerType = 'danger'
    message = 'Your subscription has been canceled. Subscribe to restore widget functionality.'
    showDismiss = false
  } else if (billingStatus.subscriptionStatus === 'trialing') {
    if (trialDaysRemaining <= 3) {
      bannerType = 'warning'
      message = `Your trial ends in ${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'}. Subscribe now to continue uninterrupted.`
    } else if (trialDaysRemaining <= 7) {
      bannerType = 'info'
      message = `${trialDaysRemaining} days left in your trial. Explore our plans to continue after trial.`
    } else {
      // Don't show banner if more than 7 days left
      return null
    }
  } else {
    // Unknown status - don't show banner
    return null
  }

  const bannerStyles = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const iconStyles = {
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  }

  const Icon = bannerType === 'info' ? Clock : bannerType === 'warning' ? AlertTriangle : CreditCard

  return (
    <div className={`border-b ${bannerStyles[bannerType]}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${iconStyles[bannerType]}`} />
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/app/billing"
              className={`text-sm font-semibold underline hover:no-underline ${
                bannerType === 'danger' ? 'text-red-700' : bannerType === 'warning' ? 'text-yellow-700' : 'text-blue-700'
              }`}
            >
              {billingStatus.trialExpired || billingStatus.subscriptionStatus === 'canceled'
                ? 'Subscribe Now'
                : 'View Plans'}
            </Link>
            {showDismiss && (
              <button
                onClick={() => setDismissed(true)}
                className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-900 ${iconStyles[bannerType]}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
