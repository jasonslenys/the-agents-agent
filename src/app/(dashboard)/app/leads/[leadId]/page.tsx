import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LeadDetailForm from '@/components/LeadDetailForm'

interface LeadDetailPageProps {
  params: Promise<{ leadId: string }>
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const session = await getSession()
  const { leadId } = await params
  
  // Get user details to check role
  const user = await prisma.user.findUnique({
    where: { id: session!.id },
    select: { role: true }
  })
  
  // Fetch team members for assignment (only if user is owner)
  const teamMembers = user?.role === 'owner' ? await prisma.user.findMany({
    where: { tenantId: session!.tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    },
    orderBy: { name: 'asc' }
  }) : []
  
  const lead = await prisma.lead.findFirst({
    where: { 
      id: leadId,
      tenantId: session!.tenantId 
    },
    include: {
      widget: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      conversations: {
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  })

  if (!lead) {
    notFound()
  }

  const lastConversation = lead.conversations[0]
  const totalMessages = lead.conversations.reduce((acc, conv) => acc + conv.messages.length, 0)

  return (
    <div className="p-6">
      {/* Header with breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/app/leads" className="hover:text-primary-600">
            Leads
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{lead.name || 'Anonymous Lead'}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Lead Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Information Card */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Lead Information</h2>
            </div>
            <div className="p-6">
              <LeadDetailForm 
                lead={lead} 
                teamMembers={teamMembers}
                userRole={user?.role || 'agent'}
              />
            </div>
          </div>

          {/* Conversation Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Conversation Summary</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Conversations</dt>
                  <dd className="text-lg font-semibold text-gray-900">{lead.conversations.length}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Messages</dt>
                  <dd className="text-lg font-semibold text-gray-900">{totalMessages}</dd>
                </div>
              </div>
              
              {lastConversation && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Most Recent Conversation</h3>
                  <div className="text-sm text-gray-600 mb-2">
                    Started: {new Date(lastConversation.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {lastConversation.messages.length} message{lastConversation.messages.length !== 1 ? 's' : ''}
                    </span>
                    <Link
                      href={`/app/conversations/${lastConversation.id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100"
                    >
                      View Full Conversation
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Qualification Score</dt>
                <dd className="text-2xl font-bold">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    (lead.qualificationScore || 0) >= 75 ? 'bg-green-100 text-green-800' :
                    (lead.qualificationScore || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {Math.round(lead.qualificationScore || 0)}%
                  </span>
                </dd>
              </div>
              
              <div>
                <dt className="text-sm text-gray-500">Source Widget</dt>
                <dd className="text-sm font-medium text-gray-900">{lead.widget.name}</dd>
              </div>
              
              <div>
                <dt className="text-sm text-gray-500">First Contact</dt>
                <dd className="text-sm text-gray-900">{new Date(lead.createdAt).toLocaleDateString()}</dd>
              </div>
              
              {lastConversation && (
                <div>
                  <dt className="text-sm text-gray-500">Last Activity</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(lastConversation.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {lastConversation && (
                <Link
                  href={`/app/conversations/${lastConversation.id}`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  View Conversation
                </Link>
              )}
              
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Send Email
                </a>
              )}
              
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Call Phone
                </a>
              )}
            </div>
          </div>

          {/* Recent Messages Preview */}
          {lastConversation && lastConversation.messages.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Messages</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lastConversation.messages.slice(-3).map((message) => (
                  <div key={message.id} className="border-l-2 border-gray-200 pl-3">
                    <div className="text-xs text-gray-500 mb-1">
                      {new Date(message.createdAt).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-900 line-clamp-2">
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t">
                <Link
                  href={`/app/conversations/${lastConversation.id}`}
                  className="text-sm text-primary-600 hover:text-primary-900"
                >
                  View all messages →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}