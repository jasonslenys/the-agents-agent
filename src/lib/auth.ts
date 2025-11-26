import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { TRIAL_DAYS } from './stripe'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export interface UserSession {
  id: string
  email: string
  name: string
  tenantId: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: UserSession): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession
  } catch {
    return null
  }
}

export async function createUser(email: string, password: string, name: string, tenantName: string) {
  const hashedPassword = await hashPassword(password)

  // Calculate trial end date
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

  // Create tenant first with trial settings
  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      plan: 'trial',
      subscriptionStatus: 'trialing',
      trialEndsAt,
    },
  })

  // Create user as owner (first user in tenant)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name,
      role: 'owner',
      tenantId: tenant.id,
    },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    role: user.role,
  }
}

export async function authenticateUser(email: string, password: string): Promise<UserSession | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return null
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash)
  if (!isValidPassword) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    role: user.role,
  }
}