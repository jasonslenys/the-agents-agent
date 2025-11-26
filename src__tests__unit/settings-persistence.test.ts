import { NextRequest } from 'next/server'
import { PUT } from '../../../src/app/api/settings/route'
import { prisma } from '../../../src/lib/prisma'
import { getSession } from '../../../src/lib/session'

// Mock the dependencies
jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    tenant: {
      update: jest.fn()
    }
  }
}))

jest.mock('../../../src/lib/session', () => ({
  getSession: jest.fn()
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>

describe('Settings Toggle Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should persist email notification toggle when enabled', async () => {
    // Mock session
    mockGetSession.mockResolvedValue({ id: 'user-123' })

    // Mock user with tenant
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      tenantId: 'tenant-456',
      name: 'Test User',
      email: 'test@example.com',
      tenant: { id: 'tenant-456', name: 'Test Company' }
    } as any)

    // Mock update operations
    mockPrisma.user.update.mockResolvedValue({} as any)
    mockPrisma.tenant.update.mockResolvedValue({} as any)

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      companyName: 'Test Company',
      averageCommission: 5000,
      estimatedDealRate: 15,
      emailNotificationsEnabled: true,
      additionalNotificationEmails: 'team@example.com, manager@example.com'
    }

    const request = new NextRequest('http://localhost:3000/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const response = await PUT(request)
    const responseData = await response.json()

    // Verify response
    expect(response.status).toBe(200)
    expect(responseData.success).toBe(true)

    // Verify that tenant update was called with correct notification settings
    expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-456' },
      data: {
        name: 'Test Company',
        averageCommission: 5000,
        estimatedDealRate: 0.15, // Should convert percentage to decimal
        emailNotificationsEnabled: true,
        additionalNotificationEmails: 'team@example.com, manager@example.com'
      }
    })
  })

  it('should persist email notification toggle when disabled', async () => {
    // Mock session
    mockGetSession.mockResolvedValue({ id: 'user-123' })

    // Mock user with tenant
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      tenantId: 'tenant-456',
      name: 'Test User',
      email: 'test@example.com',
      tenant: { id: 'tenant-456', name: 'Test Company' }
    } as any)

    // Mock update operations
    mockPrisma.user.update.mockResolvedValue({} as any)
    mockPrisma.tenant.update.mockResolvedValue({} as any)

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      companyName: 'Test Company',
      averageCommission: 5000,
      estimatedDealRate: 15,
      emailNotificationsEnabled: false,
      additionalNotificationEmails: ''
    }

    const request = new NextRequest('http://localhost:3000/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const response = await PUT(request)

    // Verify that tenant update was called with disabled notifications
    expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-456' },
      data: {
        name: 'Test Company',
        averageCommission: 5000,
        estimatedDealRate: 0.15,
        emailNotificationsEnabled: false,
        additionalNotificationEmails: null // Empty string should become null
      }
    })
  })

  it('should handle additional email list correctly', async () => {
    // Mock session
    mockGetSession.mockResolvedValue({ id: 'user-123' })

    // Mock user with tenant
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      tenantId: 'tenant-456',
      name: 'Test User',
      email: 'test@example.com',
      tenant: { id: 'tenant-456', name: 'Test Company' }
    } as any)

    // Mock update operations
    mockPrisma.user.update.mockResolvedValue({} as any)
    mockPrisma.tenant.update.mockResolvedValue({} as any)

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      companyName: 'Test Company',
      averageCommission: 5000,
      estimatedDealRate: 15,
      emailNotificationsEnabled: true,
      additionalNotificationEmails: '  team@example.com, manager@example.com  '
    }

    const request = new NextRequest('http://localhost:3000/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    await PUT(request)

    // Verify that additional emails are trimmed
    expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-456' },
      data: expect.objectContaining({
        additionalNotificationEmails: 'team@example.com, manager@example.com'
      })
    })
  })

  it('should return unauthorized when no session', async () => {
    mockGetSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    const response = await PUT(request)
    const responseData = await response.json()

    expect(response.status).toBe(401)
    expect(responseData.error).toBe('Unauthorized')
  })

  it('should validate required fields', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-123' })

    const requestBody = {
      // Missing required fields
      averageCommission: 5000,
      estimatedDealRate: 15
    }

    const request = new NextRequest('http://localhost:3000/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const response = await PUT(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Name, email, and company name are required')
  })
})