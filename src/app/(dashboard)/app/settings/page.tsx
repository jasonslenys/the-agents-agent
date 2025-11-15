import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const session = await getSession()
  
  const user = await prisma.user.findUnique({
    where: { id: session!.id },
    include: {
      tenant: true
    }
  })

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and company information</p>
      </div>

      <div className="max-w-2xl">
        <SettingsForm user={user!} />
      </div>
    </div>
  )
}