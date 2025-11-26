import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const checks: Record<string, { status: string; message?: string }> = {}

  // Check environment variables
  checks.DATABASE_URL = {
    status: process.env.DATABASE_URL ? 'ok' : 'missing',
  }
  checks.JWT_SECRET = {
    status: process.env.JWT_SECRET ? 'ok' : 'missing (using fallback)',
  }
  checks.STRIPE_SECRET_KEY = {
    status: process.env.STRIPE_SECRET_KEY ? 'ok' : 'missing',
  }
  checks.NEXT_PUBLIC_APP_URL = {
    status: process.env.NEXT_PUBLIC_APP_URL ? 'ok' : 'missing',
  }

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database_connection = { status: 'ok' }
  } catch (error) {
    checks.database_connection = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Check if tables exist
  try {
    const userCount = await prisma.user.count()
    const tenantCount = await prisma.tenant.count()
    checks.database_tables = {
      status: 'ok',
      message: `Users: ${userCount}, Tenants: ${tenantCount}`,
    }
  } catch (error) {
    checks.database_tables = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  const allOk = Object.values(checks).every(
    (c) => c.status === 'ok' || c.status === 'missing (using fallback)'
  )

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 500 }
  )
}
