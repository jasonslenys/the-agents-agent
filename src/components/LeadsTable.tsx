'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Lead {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  intent: string | null
  qualificationScore: number | null
  createdAt: Date
  widget: {
    name: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  } | null
  conversations: Array<{
    id: string
    messages: Array<{
      id: string
      text: string
      createdAt: Date
    }>
  }>
}

interface LeadsTableProps {
  leads: Lead[]
  currentFilters: {
    intent: string
    dateRange: string
    search: string
  }
}

export default function LeadsTable({ leads, currentFilters }: LeadsTableProps) {
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
    
    router.push(`/app/leads?${params.toString()}`)
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
          {/* Intent Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intent
            </label>
            <select
              value={currentFilters.intent}
              onChange={(e) => updateFilters({ intent: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Intents</option>
              <option value="buying">Buying</option>
              <option value="selling">Selling</option>
              <option value="renting">Renting</option>
              <option value="investing">Investing</option>
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Name or Email
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search leads..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Search
              </button>
              {currentFilters.search && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    updateFilters({ search: '' })
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(currentFilters.intent !== 'all' || currentFilters.dateRange !== 'all' || currentFilters.search) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Active filters:</span>
              {currentFilters.intent !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Intent: {currentFilters.intent}
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
                  router.push('/app/leads')
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
        Showing {leads.length} lead{leads.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Widget Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Intent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {(currentFilters.intent !== 'all' || currentFilters.dateRange !== 'all' || currentFilters.search) 
                        ? 'No leads found matching your filters' 
                        : 'No leads yet'
                      }
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {(currentFilters.intent !== 'all' || currentFilters.dateRange !== 'all' || currentFilters.search)
                        ? 'Try adjusting your filters to see more results.'
                        : 'Leads will appear here once visitors start chatting with your widgets.'
                      }
                    </p>
                    {!(currentFilters.intent !== 'all' || currentFilters.dateRange !== 'all' || currentFilters.search) && (
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
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const lastConversation = lead.conversations[0]
                const lastMessage = lastConversation?.messages[0]
                
                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          <Link
                            href={`/app/leads/${lead.id}`}
                            className="hover:text-primary-600"
                          >
                            {lead.name || 'Anonymous Lead'}
                          </Link>
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.email && (
                            <div>📧 {lead.email}</div>
                          )}
                          {lead.phone && (
                            <div>📞 {lead.phone}</div>
                          )}
                          {!lead.email && !lead.phone && (
                            <span className="text-gray-400">No contact info</span>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.widget.name}</div>
                      <div className="text-sm text-gray-500">Widget</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {lead.intent ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.intent === 'buying' ? 'bg-blue-100 text-blue-800' :
                            lead.intent === 'selling' ? 'bg-green-100 text-green-800' :
                            lead.intent === 'renting' ? 'bg-yellow-100 text-yellow-800' :
                            lead.intent === 'investing' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.intent}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Not specified</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (lead.qualificationScore || 0) >= 75 ? 'bg-green-100 text-green-800' :
                        (lead.qualificationScore || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(lead.qualificationScore || 0)}%
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.assignedTo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {lead.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lastMessage ? (
                        <div>
                          <div className="text-xs text-gray-400">
                            {new Date(lastMessage.createdAt).toLocaleDateString()}
                          </div>
                          <div className="truncate max-w-xs">
                            {lastMessage.text}
                          </div>
                        </div>
                      ) : (
                        'No messages'
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/app/leads/${lead.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </Link>
                        {lastConversation && (
                          <Link
                            href={`/app/conversations/${lastConversation.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Chat
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}