'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Conversation {
  id: string
  createdAt: Date
  updatedAt: Date
  widget: {
    id: string
    name: string
  }
  lead: {
    id: string
    name: string | null
    email: string | null
    qualificationScore: number | null
  } | null
  messages: Array<{
    id: string
    text: string
    senderType: string
    createdAt: Date
  }>
  _count: {
    messages: number
  }
}

interface Widget {
  id: string
  name: string
}

interface ConversationsTableProps {
  conversations: Conversation[]
  widgets: Widget[]
  currentFilters: {
    widget: string
    dateRange: string
    search: string
    hasLead: string
  }
}

export default function ConversationsTable({ conversations, widgets, currentFilters }: ConversationsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(currentFilters.search)

  const updateFilters = (newFilters: Partial<typeof currentFilters>) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === 'all' || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    router.push(`/app/conversations?${params.toString()}`)
  }

  const handleSearch = () => {
    updateFilters({ search: searchTerm })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Widget Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget Source
            </label>
            <select
              value={currentFilters.widget}
              onChange={(e) => updateFilters({ widget: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Widgets</option>
              {widgets.map((widget) => (
                <option key={widget.id} value={widget.id}>
                  {widget.name}
                </option>
              ))}
            </select>
          </div>

          {/* Has Lead Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Status
            </label>
            <select
              value={currentFilters.hasLead}
              onChange={(e) => updateFilters({ hasLead: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Conversations</option>
              <option value="true">With Lead</option>
              <option value="false">No Lead</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={currentFilters.dateRange}
              onChange={(e) => updateFilters({ dateRange: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Time</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Lead Name or Email
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search conversations..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Search
              </button>
            </div>
            {currentFilters.search && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  updateFilters({ search: '' })
                }}
                className="mt-1 text-sm text-primary-600 hover:text-primary-900 underline"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        {(currentFilters.widget !== 'all' || currentFilters.hasLead !== 'all' || currentFilters.dateRange !== 'all' || currentFilters.search) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Active filters:</span>
              {currentFilters.widget !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Widget: {widgets.find(w => w.id === currentFilters.widget)?.name}
                </span>
              )}
              {currentFilters.hasLead !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {currentFilters.hasLead === 'true' ? 'Has Lead' : 'No Lead'}
                </span>
              )}
              {currentFilters.dateRange !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Date: {currentFilters.dateRange === 'last7days' ? 'Last 7 days' : 'Last 30 days'}
                </span>
              )}
              {currentFilters.search && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Search: "{currentFilters.search}"
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('')
                  router.push('/app/conversations')
                }}
                className="text-primary-600 hover:text-primary-900 text-sm underline"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {conversations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {(currentFilters.widget !== 'all' || currentFilters.hasLead !== 'all' || currentFilters.dateRange !== 'all' || currentFilters.search) 
                ? 'No conversations found matching your filters' 
                : 'No conversations yet'
              }
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {(currentFilters.widget !== 'all' || currentFilters.hasLead !== 'all' || currentFilters.dateRange !== 'all' || currentFilters.search)
                ? 'Try adjusting your filters to see more results.'
                : 'Conversations will appear here when visitors start chatting with your widgets.'
              }
            </p>
            {!(currentFilters.widget !== 'all' || currentFilters.hasLead !== 'all' || currentFilters.dateRange !== 'all' || currentFilters.search) && (
              <div className="mt-6">
                <Link
                  href="/app/widgets"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Set up your first widget
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => {
              const lastMessage = conversation.messages[0]
              const lead = conversation.lead
              
              return (
                <Link
                  key={conversation.id}
                  href={`/app/conversations/${conversation.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {lead?.name || 'Anonymous Visitor'}
                            </p>
                            <span className="flex-shrink-0 text-xs text-gray-500">
                              via {conversation.widget.name}
                            </span>
                            {lead && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Lead
                              </span>
                            )}
                          </div>
                          <div className="mt-1">
                            {lastMessage ? (
                              <p className="text-sm text-gray-600 line-clamp-1">
                                <span className="font-medium">
                                  {lastMessage.senderType === 'VISITOR' ? 'Visitor' : 
                                   lastMessage.senderType === 'AGENT' ? 'Agent' : 'System'}:
                                </span>
                                {' '}{lastMessage.text}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">No messages</p>
                            )}
                            {lead?.email && (
                              <p className="text-xs text-gray-500 mt-1">
                                📧 {lead.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          {conversation._count.messages} message{conversation._count.messages !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          Updated: {new Date(conversation.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          Started: {new Date(conversation.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {lead?.qualificationScore && (
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lead.qualificationScore >= 75 ? 'bg-green-100 text-green-800' :
                          lead.qualificationScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(lead.qualificationScore)}%
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/app/conversations/${conversation.id}`}
                          className="text-xs text-primary-600 hover:text-primary-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Chat
                        </Link>
                        {lead && (
                          <Link
                            href={`/app/leads/${lead.id}`}
                            className="text-xs text-primary-600 hover:text-primary-900"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Lead
                          </Link>
                        )}
                      </div>
                      
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}