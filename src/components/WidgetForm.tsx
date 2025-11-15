'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface WidgetFormProps {
  initialData?: {
    id?: string
    name: string
    greetingText: string
    primaryColor: string
    position: string
    bubbleText: string
    agentName?: string
    companyName?: string
    isActive: boolean
  }
}

export default function WidgetForm({ initialData }: WidgetFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    greetingText: initialData?.greetingText || 'Hello! How can I help you with your real estate needs today?',
    primaryColor: initialData?.primaryColor || '#0ea5e9',
    position: initialData?.position || 'bottom-right',
    bubbleText: initialData?.bubbleText || 'Chat with my AI assistant',
    agentName: initialData?.agentName || '',
    companyName: initialData?.companyName || '',
    isActive: initialData?.isActive ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const url = initialData?.id ? `/api/widgets/${initialData.id}` : '/api/widgets'
      const method = initialData?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/app/widgets')
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Widget Name
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Homepage Chat Widget"
          />
          <p className="mt-1 text-sm text-gray-500">
            A descriptive name to help you identify this widget
          </p>
        </div>

        <div>
          <label htmlFor="greetingText" className="block text-sm font-medium text-gray-700">
            Greeting Message
          </label>
          <textarea
            id="greetingText"
            required
            value={formData.greetingText}
            onChange={(e) => setFormData({ ...formData, greetingText: e.target.value })}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Hello! How can I help you with your real estate needs today?"
          />
          <p className="mt-1 text-sm text-gray-500">
            The first message visitors will see when they open the chat
          </p>
        </div>

        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
            Widget Color
          </label>
          <div className="mt-1 flex items-center space-x-3">
            <input
              type="color"
              id="primaryColor"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="#0ea5e9"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Choose a color that matches your brand
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Widget is active
          </label>
          <p className="ml-2 text-sm text-gray-500">
            (Inactive widgets won't respond to visitors)
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Preview */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Preview</h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-end justify-end mb-4">
              <div 
                className="px-4 py-2 rounded-lg text-white max-w-xs"
                style={{ backgroundColor: formData.primaryColor }}
              >
                {formData.greetingText}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                disabled
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
              />
              <button 
                type="button" 
                disabled
                className="px-4 py-2 text-white rounded-md"
                style={{ backgroundColor: formData.primaryColor }}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (initialData?.id ? 'Update Widget' : 'Create Widget')}
          </button>
        </div>
      </form>
    </div>
  )
}