import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './session'
import { prisma } from './prisma'

export type UserRole = 'owner' | 'agent'

export interface PermissionContext {
  user: {
    id: string
    email: string
    name: string
    role: UserRole
    isAdmin: boolean
    tenantId: string
  }
  params?: Record<string, string>
}

export class PermissionError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message)
    this.name = 'PermissionError'
  }
}

export async function withPermissions<T = any>(
  request: NextRequest,
  requiredPermissions: (context: PermissionContext) => boolean | Promise<boolean>,
  handler: (request: NextRequest, context: PermissionContext) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  try {
    // Get session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details including role
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        tenantId: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const context: PermissionContext = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        isAdmin: user.isAdmin,
        tenantId: user.tenantId
      }
    }

    // Check permissions
    const hasPermission = await requiredPermissions(context)
    if (!hasPermission) {
      throw new PermissionError('Insufficient permissions')
    }

    // Call the actual handler
    return await handler(request, context)
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    console.error('Permission middleware error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Permission helpers
export const permissions = {
  // Only owners can access
  ownerOnly: (context: PermissionContext) => {
    if (!context?.user) return false
    return context.user.role === 'owner'
  },

  // Only admins can access
  adminOnly: (context: PermissionContext) => {
    if (!context?.user) return false
    return context.user.isAdmin
  },

  // Owner or admin can access
  ownerOrAdmin: (context: PermissionContext) => {
    if (!context?.user) return false
    return context.user.role === 'owner' || context.user.isAdmin
  },

  // Any authenticated user can access
  authenticated: (context: PermissionContext) => {
    if (!context?.user) return false
    return true
  },

  // Owner can access, or agent can access their own resources
  ownerOrSelf: (resourceUserId?: string) => (context: PermissionContext) => {
    if (!context?.user) return false
    if (context.user.role === 'owner' || context.user.isAdmin) return true
    if (resourceUserId && resourceUserId !== '' && context.user.id === resourceUserId) return true
    return false
  },

  // Check if user can access tenant resources
  sameTenant: (resourceTenantId?: string) => (context: PermissionContext) => {
    if (!context?.user) return false
    if (context.user.isAdmin) return true
    if (!resourceTenantId || resourceTenantId === '') return false
    return context.user.tenantId === resourceTenantId
  },

  // Combined: same tenant AND (owner OR self)
  sameTenantOwnerOrSelf: (resourceTenantId?: string, resourceUserId?: string) => 
    (context: PermissionContext) => {
      if (!context?.user) return false
      if (context.user.isAdmin) return true
      
      // Must be in same tenant
      if (resourceTenantId && resourceTenantId !== '' && context.user.tenantId !== resourceTenantId) return false
      
      // Must be owner or accessing own resources
      if (context.user.role === 'owner') return true
      if (resourceUserId && resourceUserId !== '' && context.user.id === resourceUserId) return true
      
      return false
    }
}

// Route-specific permission functions
export const routePermissions = {
  teamManagement: permissions.ownerOnly,
  billing: permissions.ownerOnly,
  settings: permissions.ownerOnly,
  leads: permissions.authenticated,
  conversations: permissions.authenticated,
  widgets: permissions.ownerOnly,
  analytics: permissions.authenticated,
  admin: permissions.adminOnly
}