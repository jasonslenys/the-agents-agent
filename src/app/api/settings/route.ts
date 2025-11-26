import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissions, routePermissions, PermissionContext } from '@/lib/permissions'

async function handleSettingsUpdate(request: NextRequest, context: PermissionContext): Promise<NextResponse> {
  const body = await request.json()
  const { 
    name, 
    email, 
    companyName, 
    averageCommission, 
    estimatedDealRate,
    emailNotificationsEnabled,
    additionalNotificationEmails
  } = body

  // Validate required fields
  if (!name || !email || !companyName) {
    return NextResponse.json(
      { error: 'Name, email, and company name are required' },
      { status: 400 }
    )
  }

  // Validate analytics settings
  if (typeof averageCommission !== 'number' || averageCommission < 0) {
    return NextResponse.json(
      { error: 'Average commission must be a positive number' },
      { status: 400 }
    )
  }

  if (typeof estimatedDealRate !== 'number' || estimatedDealRate < 0 || estimatedDealRate > 100) {
    return NextResponse.json(
      { error: 'Deal rate must be between 0 and 100' },
      { status: 400 }
    )
  }

  // Update user information
  await prisma.user.update({
    where: { id: context.user.id },
    data: {
      name,
      email,
    }
  })

  // Update tenant information including analytics and notification settings
  await prisma.tenant.update({
    where: { id: context.user.tenantId },
    data: {
      name: companyName,
      averageCommission,
      estimatedDealRate: estimatedDealRate / 100, // Convert percentage to decimal
      emailNotificationsEnabled,
      additionalNotificationEmails: additionalNotificationEmails?.trim() || null,
    }
  })

  return NextResponse.json({
    success: true,
    message: 'Settings updated successfully'
  })
}

export async function PUT(request: NextRequest) {
  return withPermissions(
    request,
    routePermissions.settings,
    handleSettingsUpdate
  )
}