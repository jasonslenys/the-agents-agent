import { hashPassword, verifyPassword, generateToken, verifyToken, createUser, authenticateUser } from '@/lib/auth'
import { UserSession } from '@/lib/auth'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      create: jest.fn(),
    },
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

describe('Authentication Library', () => {
  describe('Password Hashing', () => {
    test('hashPassword should create a secure hash', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).toBeTruthy()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are typically 60 chars
    })

    test('verifyPassword should validate correct passwords', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    test('verifyPassword should reject incorrect passwords', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword456!'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Management', () => {
    const mockUser: UserSession = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      tenantId: 'tenant-123',
    }

    test('generateToken should create a valid JWT', () => {
      const token = generateToken(mockUser)
      
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    test('verifyToken should decode valid tokens', () => {
      const token = generateToken(mockUser)
      const decoded = verifyToken(token)
      
      expect(decoded).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        tenantId: mockUser.tenantId,
      }))
    })

    test('verifyToken should reject invalid tokens', () => {
      const invalidToken = 'invalid.jwt.token'
      const decoded = verifyToken(invalidToken)
      
      expect(decoded).toBeNull()
    })
  })

  describe('User Creation & Authentication', () => {
    const { prisma } = require('@/lib/prisma')

    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('createUser should create tenant and user', async () => {
      const mockTenant = { id: 'tenant-123', name: 'Test Company' }
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-123',
        passwordHash: 'hashedpassword',
      }

      prisma.tenant.create.mockResolvedValue(mockTenant)
      prisma.user.create.mockResolvedValue(mockUser)

      const result = await createUser('test@example.com', 'password123', 'Test User', 'Test Company')

      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: { name: 'Test Company' },
      })
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: expect.any(String),
          name: 'Test User',
          tenantId: 'tenant-123',
        },
      })
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-123',
      })
    })

    test('authenticateUser should return user session for valid credentials', async () => {
      const passwordHash = await hashPassword('password123')
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-123',
        passwordHash,
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await authenticateUser('test@example.com', 'password123')

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-123',
      })
    })

    test('authenticateUser should return null for invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await authenticateUser('nonexistent@example.com', 'password123')
      expect(result).toBeNull()
    })

    test('authenticateUser should return null for invalid password', async () => {
      const passwordHash = await hashPassword('password123')
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash,
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await authenticateUser('test@example.com', 'wrongpassword')
      expect(result).toBeNull()
    })
  })
})