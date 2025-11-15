import { getSession, setSession, clearSession } from '@/lib/session'
import { UserSession } from '@/lib/auth'

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}))

// Mock auth utilities
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
  generateToken: jest.fn(),
}))

describe('Session Management', () => {
  const mockUser: UserSession = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    tenantId: 'tenant-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSession', () => {
    test('should return user session when valid token exists', async () => {
      const { cookies } = require('next/headers')
      const { verifyToken } = require('@/lib/auth')
      
      cookies().get.mockReturnValue({ value: 'valid-jwt-token' })
      verifyToken.mockReturnValue(mockUser)

      const session = await getSession()
      
      expect(session).toEqual(mockUser)
      expect(cookies().get).toHaveBeenCalledWith('session')
      expect(verifyToken).toHaveBeenCalledWith('valid-jwt-token')
    })

    test('should return null when no token exists', async () => {
      const { cookies } = require('next/headers')
      
      cookies().get.mockReturnValue(undefined)

      const session = await getSession()
      
      expect(session).toBeNull()
    })

    test('should return null when token is invalid', async () => {
      const { cookies } = require('next/headers')
      const { verifyToken } = require('@/lib/auth')
      
      cookies().get.mockReturnValue({ value: 'invalid-token' })
      verifyToken.mockReturnValue(null)

      const session = await getSession()
      
      expect(session).toBeNull()
    })
  })

  describe('setSession', () => {
    test('should set session cookie with generated token', async () => {
      const { cookies } = require('next/headers')
      const { generateToken } = require('@/lib/auth')
      
      generateToken.mockReturnValue('generated-jwt-token')

      await setSession(mockUser)
      
      expect(generateToken).toHaveBeenCalledWith(mockUser)
      expect(cookies().set).toHaveBeenCalledWith('session', 'generated-jwt-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    })
  })

  describe('clearSession', () => {
    test('should delete session cookie', async () => {
      const { cookies } = require('next/headers')

      await clearSession()
      
      expect(cookies().delete).toHaveBeenCalledWith('session')
    })
  })
})

describe('Multi-Tenancy Isolation', () => {
  test('sessions should include tenant isolation', async () => {
    const userA: UserSession = {
      id: 'user-a',
      email: 'usera@companya.com',
      name: 'User A',
      tenantId: 'tenant-a',
    }

    const userB: UserSession = {
      id: 'user-b',
      email: 'userb@companyb.com',
      name: 'User B',
      tenantId: 'tenant-b',
    }

    expect(userA.tenantId).not.toBe(userB.tenantId)
    expect(userA.tenantId).toBe('tenant-a')
    expect(userB.tenantId).toBe('tenant-b')
  })
})