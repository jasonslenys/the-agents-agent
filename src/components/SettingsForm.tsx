'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  tenant: {
    id: string
    name: string
    averageCommission: number | null
    estimatedDealRate: number | null
    emailNotificationsEnabled: boolean | null
    additionalNotificationEmails: string | null
  }
}

interface SettingsFormProps {
  user: User
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isTestingEmail, setIsTestingEmail] = useState(false)
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    companyName: user.tenant.name,
    averageCommission: user.tenant.averageCommission || 5000,
    estimatedDealRate: (user.tenant.estimatedDealRate || 0.10) * 100, // Convert to percentage for display
    emailNotificationsEnabled: user.tenant.emailNotificationsEnabled || false,
    additionalNotificationEmails: user.tenant.additionalNotificationEmails || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Settings updated successfully!')
        router.refresh()
      } else {
        setError(data.error || 'Failed to update settings')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    setIsTestingEmail(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Test notification sent successfully! Check your email.')
      } else {
        setError(data.error || 'Failed to send test notification')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsTestingEmail(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Account Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Used for login and important notifications
          </p>
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
            Company/Agency Name
          </label>
          <input
            type="text"
            id="companyName"
            required
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics Settings</h3>
          <p className="text-sm text-gray-600 mb-6">
            Configure settings for revenue estimation and analytics calculations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="averageCommission" className="block text-sm font-medium text-gray-700">
                Average Commission ($)
              </label>
              <input
                type="number"
                id="averageCommission"
                min="0"
                step="100"
                value={formData.averageCommission}
                onChange={(e) => setFormData({ ...formData, averageCommission: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Average commission per deal for revenue estimation
              </p>
            </div>

            <div>
              <label htmlFor="estimatedDealRate" className="block text-sm font-medium text-gray-700">
                Estimated Deal Rate (%)
              </label>
              <input
                type="number"
                id="estimatedDealRate"
                min="0"
                max="100"
                step="0.5"
                value={formData.estimatedDealRate}
                onChange={(e) => setFormData({ ...formData, estimatedDealRate: parseFloat(e.target.value) || 0 })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Percentage of qualified leads that become deals
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
          <p className="text-sm text-gray-600 mb-6">
            Get notified when new qualified leads are created through your widgets.
          </p>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="emailNotifications"
                type="checkbox"
                checked={formData.emailNotificationsEnabled}
                onChange={(e) => setFormData({ ...formData, emailNotificationsEnabled: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-900">
                Email me when a new lead is created
              </label>
            </div>

            <div>
              <label htmlFor="additionalEmails" className="block text-sm font-medium text-gray-700">
                Additional notification emails (optional)
              </label>
              <input
                type="text"
                id="additionalEmails"
                value={formData.additionalNotificationEmails}
                onChange={(e) => setFormData({ ...formData, additionalNotificationEmails: e.target.value })}
                placeholder="email1@example.com, email2@example.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Comma-separated list of additional team members to notify
              </p>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Test Email Notifications</h4>
                <p className="text-sm text-gray-500">Send a test email to verify your configuration</p>
              </div>
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={isTestingEmail || !formData.emailNotificationsEnabled}
                className="px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingEmail ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Change Password</h4>
              <p className="text-sm text-gray-500">Update your account password</p>
            </div>
            <button
              type="button"
              onClick={() => {/* TODO: Implement password change modal */}}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Change Password
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Export Data</h4>
              <p className="text-sm text-gray-500">Download your leads and conversation data</p>
            </div>
            <button
              type="button"
              onClick={() => {/* TODO: Implement data export */}}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Download Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}