import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Simple session validation (replace with your auth system)
async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie?.value) {
    return null
  }

  try {
    // This is a simplified session check - replace with your actual auth
    const user = await prisma.user.findFirst({
      where: { email: { contains: '@' } }, // Temporary - get first user
      include: { tenant: true }
    })
    return user
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7', 10)
    const widgetId = searchParams.get('widgetId')
    
    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    // Base where clause for tenant scoping
    const baseWhere = {
      tenantId: user.tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(widgetId && { widgetId }),
    }

    // Aggregate event counts
    const [widgetViews, conversations, leads] = await Promise.all([
      // V: Unique widget views (approximate by session)
      prisma.widgetEvent.findMany({
        where: {
          ...baseWhere,
          eventType: 'widget_view',
        },
        select: {
          sessionId: true,
          createdAt: true,
        },
        distinct: ['sessionId'],
      }),

      // Conversations started
      prisma.widgetEvent.count({
        where: {
          ...baseWhere,
          eventType: 'conversation_started',
        },
      }),

      // Leads created
      prisma.widgetEvent.count({
        where: {
          ...baseWhere,
          eventType: 'lead_created',
        },
      }),
    ])

    // Get tenant settings for revenue calculations
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        averageCommission: true,
        estimatedDealRate: true,
      },
    })

    const V = widgetViews.length // Unique visitors (by session)
    const c = V > 0 ? conversations / V : 0 // Conversation rate
    const q = conversations > 0 ? leads / conversations : 0 // Qualification rate
    const d = tenant?.estimatedDealRate || 0.10 // Deal rate (estimated)
    const avgCommission = tenant?.averageCommission || 5000

    const estimatedDeals = leads * d
    const estimatedRevenue = estimatedDeals * avgCommission

    // Daily breakdown for charts
    const dailyBreakdown = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayWhere = {
        ...baseWhere,
        createdAt: {
          gte: date,
          lt: nextDate,
        },
      }

      const [dayViews, dayConversations, dayLeads] = await Promise.all([
        prisma.widgetEvent.count({
          where: { ...dayWhere, eventType: 'widget_view' },
        }),
        prisma.widgetEvent.count({
          where: { ...dayWhere, eventType: 'conversation_started' },
        }),
        prisma.widgetEvent.count({
          where: { ...dayWhere, eventType: 'lead_created' },
        }),
      ])

      dailyBreakdown.push({
        date: date.toISOString().split('T')[0],
        views: dayViews,
        conversations: dayConversations,
        leads: dayLeads,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          visitors: V,
          conversations,
          leads,
          conversationRate: Math.round(c * 100 * 100) / 100, // Round to 2 decimals
          qualificationRate: Math.round(q * 100 * 100) / 100,
          dealRate: Math.round(d * 100 * 100) / 100,
          estimatedDeals: Math.round(estimatedDeals * 100) / 100,
          estimatedRevenue: Math.round(estimatedRevenue),
          averageCommission: avgCommission,
        },
        dailyBreakdown,
        settings: {
          averageCommission: tenant?.averageCommission || 5000,
          estimatedDealRate: (tenant?.estimatedDealRate || 0.10) * 100, // Convert to percentage
        },
      },
    })
    
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}