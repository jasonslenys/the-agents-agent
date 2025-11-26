'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface AnalyticsData {
  success: boolean
  data: {
    summary: {
      visitors: number
      conversations: number
      leads: number
      conversationRate: number
      qualificationRate: number
      dealRate: number
      estimatedDeals: number
      estimatedRevenue: number
      averageCommission: number
    }
    dailyBreakdown: Array<{
      date: string
      views: number
      conversations: number
      leads: number
    }>
    settings: {
      averageCommission: number
      estimatedDealRate: number
    }
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('7')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/analytics?days=${dateRange}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics')
      }
      
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">No data available</div>
      </div>
    )
  }

  const { summary, dailyBreakdown, settings } = data.data

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitors (V)</CardTitle>
            <div className="text-2xl font-bold text-blue-600">👥</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.visitors}</div>
            <p className="text-xs text-muted-foreground">Unique widget views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversation Rate (c)</CardTitle>
            <div className="text-2xl font-bold text-green-600">💬</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.conversationRate}%</div>
            <p className="text-xs text-muted-foreground">{summary.conversations} conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualification Rate (q)</CardTitle>
            <div className="text-2xl font-bold text-orange-600">🎯</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.qualificationRate}%</div>
            <p className="text-xs text-muted-foreground">{summary.leads} leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deal Rate (d)</CardTitle>
            <div className="text-2xl font-bold text-purple-600">🤝</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.dealRate}%</div>
            <p className="text-xs text-muted-foreground">Estimated conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Deals</CardTitle>
            <div className="text-2xl font-bold text-indigo-600">📊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.estimatedDeals}</div>
            <p className="text-xs text-muted-foreground">leads × deal rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Revenue</CardTitle>
            <div className="text-2xl font-bold text-emerald-600">💰</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.estimatedRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">deals × avg commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <div className="text-2xl font-bold text-yellow-600">💵</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.averageCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per deal</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()} 
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Bar dataKey="views" fill="#3b82f6" name="Widget Views" />
                <Bar dataKey="conversations" fill="#10b981" name="Conversations" />
                <Bar dataKey="leads" fill="#f59e0b" name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()} 
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Widget Views" strokeWidth={2} />
                <Line type="monotone" dataKey="conversations" stroke="#10b981" name="Conversations" strokeWidth={2} />
                <Line type="monotone" dataKey="leads" stroke="#f59e0b" name="Leads" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Average Commission:</span>
              <span className="text-lg font-bold text-green-600">${settings.averageCommission.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Estimated Deal Rate:</span>
              <span className="text-lg font-bold text-blue-600">{settings.estimatedDealRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}