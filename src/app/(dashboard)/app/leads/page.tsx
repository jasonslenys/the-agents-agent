import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import LeadsTable from '@/components/LeadsTable'

interface LeadsPageProps {
  searchParams?: Promise<{
    intent?: string
    dateRange?: string
    search?: string
  }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const session = await getSession()
  const params = await searchParams || {}
  
  // Build where clause based on filters
  const where: { 
    tenantId: string; 
    intent?: string; 
    createdAt?: { gte: Date }; 
    OR?: Array<{ name: { contains: string; mode: string } } | { email: { contains: string; mode: string } }>
  } = { tenantId: session!.tenantId }
  
  // Intent filter
  if (params.intent && params.intent !== 'all') {
    where.intent = params.intent
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
  
  // Search filter
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } }
    ]
  }
  
  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      widget: true,
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      conversations: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  })

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-600">Manage your captured leads and their qualification scores</p>
      </div>

      <LeadsTable 
        leads={leads} 
        currentFilters={{
          intent: params.intent || 'all',
          dateRange: params.dateRange || 'all',
          search: params.search || ''
        }}
      />
    </div>
  )
}