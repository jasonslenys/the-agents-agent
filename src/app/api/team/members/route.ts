import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissions, routePermissions, PermissionContext } from '@/lib/permissions'

async function handleGetMembers(request: NextRequest, context: PermissionContext): Promise<NextResponse> {
  // Get all team members for this tenant
  const members = await prisma.user.findMany({
    where: { tenantId: context.user.tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  })

  return NextResponse.json(members)
}

export async function GET(request: NextRequest) {
  return withPermissions(
    request,
    routePermissions.teamManagement,
    handleGetMembers
  )
}