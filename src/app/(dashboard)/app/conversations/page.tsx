import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import ConversationsTable from '@/components/ConversationsTable'
import { Prisma } from '@prisma/client'

interface ConversationsPageProps {
  searchParams?: Promise<{
    widget?: string
    dateRange?: string
    search?: string
    hasLead?: string
  }>
}

export default async function ConversationsPage({ searchParams }: ConversationsPageProps) {
  const session = await getSession()
  const params = await searchParams || {}

  // Build where clause based on filters
  const where: Prisma.ConversationWhereInput = { tenantId: session!.tenantId }

  // Widget filter
  if (params.widget && params.widget !== 'all') {
    where.widgetId = params.widget
  }

  // Date range filter
  if (params.dateRange) {
    const now = new Date()
    let dateThreshold: Date

    switch (params.dateRange) {
      case 'last7days':
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last30days':
        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        dateThreshold = new Date(0) // All time
    }

    if (params.dateRange !== 'all') {
      where.createdAt = { gte: dateThreshold }
    }
  }

  // Has lead filter
  if (params.hasLead === 'true') {
    where.leadId = { not: null }
  } else if (params.hasLead === 'false') {
    where.leadId = null
  }

  // Search filter (by lead name or email)
  if (params.search) {
    where.lead = {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' as Prisma.QueryMode } },
        { email: { contains: params.search, mode: 'insensitive' as Prisma.QueryMode } }
      ]
    }
  }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      widget: true,
      lead: true,
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          messages: true
        }
      }
    }
  })

  // Get all widgets for filter dropdown
  const widgets = await prisma.widget.findMany({
    where: { tenantId: session!.tenantId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <p className="text-gray-600">View all chat conversations from your widgets</p>
      </div>

      <ConversationsTable 
        conversations={conversations}
        widgets={widgets}
        currentFilters={{
          widget: params.widget || 'all',
          dateRange: params.dateRange || 'all',
          search: params.search || '',
          hasLead: params.hasLead || 'all'
        }}
      />
    </div>
  )
}