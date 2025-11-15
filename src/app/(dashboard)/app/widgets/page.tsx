import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import WidgetList from '@/components/WidgetList'

export default async function WidgetsPage() {
  const session = await getSession()
  
  const widgets = await prisma.widget.findMany({
    where: { tenantId: session!.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          leads: true,
          conversations: true,
        }
      }
    }
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Widgets</h1>
          <p className="text-gray-600">Manage your AI chat widgets</p>
        </div>
        <Link
          href="/app/widgets/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Create Widget
        </Link>
      </div>

      <WidgetList widgets={widgets} />
    </div>
  )
}