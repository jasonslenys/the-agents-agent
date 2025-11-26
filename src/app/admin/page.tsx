import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { withPermissions, routePermissions } from '@/lib/permissions'

export default async function AdminPage() {
  const session = await getSession()
  
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session!.id },
    select: { isAdmin: true }
  })
  
  if (!user?.isAdmin) {
    notFound()
  }

  // Get platform statistics
  const [
    totalTenants,
    totalUsers,
    totalLeads,
    totalWidgets,
    totalConversations,
    recentTenants,
    topTenantsByLeads
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.lead.count(),
    prisma.widget.count(),
    prisma.conversation.count(),
    
    // Recent tenants (last 30 days)
    prisma.tenant.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        users: {
          select: {
            id: true,
            role: true
          }
        },
        _count: {
          select: {
            leads: true,
            widgets: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    
    // Top tenants by lead count
    prisma.tenant.findMany({
      include: {
        users: {
          where: { role: 'owner' },
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            leads: true,
            users: true,
            widgets: true
          }
        }
      },
      orderBy: {
        leads: {
          _count: 'desc'
        }
      },
      take: 10
    })
  ])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Admin Console</h1>
          <p className="text-gray-600">Overview of all tenants, users, and platform usage</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Tenants</div>
            <div className="text-3xl font-bold text-gray-900">{totalTenants.toLocaleString()}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Users</div>
            <div className="text-3xl font-bold text-gray-900">{totalUsers.toLocaleString()}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Leads</div>
            <div className="text-3xl font-bold text-gray-900">{totalLeads.toLocaleString()}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Widgets</div>
            <div className="text-3xl font-bold text-gray-900">{totalWidgets.toLocaleString()}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Conversations</div>
            <div className="text-3xl font-bold text-gray-900">{totalConversations.toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tenants */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Tenants (Last 30 Days)</h2>
            </div>
            <div className="p-6">
              {recentTenants.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No new tenants in the last 30 days</p>
              ) : (
                <div className="space-y-4">
                  {recentTenants.map((tenant) => (
                    <div key={tenant.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-500">
                          {tenant.users.length} user{tenant.users.length !== 1 ? 's' : ''} • 
                          {tenant._count.leads} lead{tenant._count.leads !== 1 ? 's' : ''} • 
                          {tenant._count.widgets} widget{tenant._count.widgets !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Tenants by Leads */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Top Tenants by Lead Count</h2>
            </div>
            <div className="p-6">
              {topTenantsByLeads.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tenants yet</p>
              ) : (
                <div className="space-y-4">
                  {topTenantsByLeads.map((tenant, index) => {
                    const owner = tenant.users.find(u => u)
                    return (
                      <div key={tenant.id} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-600 mr-3">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{tenant.name}</div>
                            <div className="text-sm text-gray-500">
                              {owner ? `${owner.name} (${owner.email})` : 'No owner found'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{tenant._count.leads} leads</div>
                          <div className="text-sm text-gray-500">
                            {tenant._count.users} users • {tenant._count.widgets} widgets
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Tenants Table */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">All Tenants</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Widgets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topTenantsByLeads.map((tenant) => {
                  const owner = tenant.users.find(u => u)
                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-500">ID: {tenant.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {owner ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                            <div className="text-sm text-gray-500">{owner.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No owner found</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tenant._count.users}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tenant._count.leads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tenant._count.widgets}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}