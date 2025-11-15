'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Widget {
  id: string
  name: string
  greetingText: string
  primaryColor: string
  isActive: boolean
  publicKey: string
  createdAt: Date
  _count: {
    leads: number
    conversations: number
  }
}

interface WidgetListProps {
  widgets: Widget[]
}

export default function WidgetList({ widgets }: WidgetListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string, widgetId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(widgetId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getEmbedCode = (publicKey: string) => {
    return `<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/widget.js" data-widget-id="${publicKey}"></script>
<div id="realestate-ai-widget"></div>`
  }

  if (widgets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No widgets</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating your first AI chat widget.</p>
        <div className="mt-6">
          <Link
            href="/app/widgets/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Create Widget
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {widgets.map((widget) => (
        <div key={widget.id} className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{widget.name}</h3>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                widget.isActive 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {widget.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {widget.greetingText}
            </p>

            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {widget._count.leads} leads
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {widget._count.conversations} chats
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Embed Code:
                </label>
                <button
                  onClick={() => copyToClipboard(getEmbedCode(widget.publicKey), widget.id)}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  {copiedId === widget.id ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <code className="mt-1 block w-full text-xs bg-gray-50 p-2 rounded border text-gray-800 overflow-x-auto">
                {getEmbedCode(widget.publicKey)}
              </code>
            </div>

            <div className="mt-6 flex space-x-3">
              <Link
                href={`/app/widgets/${widget.id}`}
                className="flex-1 bg-primary-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-primary-700 text-center"
              >
                Edit
              </Link>
              <Link
                href={`/app/widgets/${widget.id}/analytics`}
                className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-50 text-center"
              >
                Analytics
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}