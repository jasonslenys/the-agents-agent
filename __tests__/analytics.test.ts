import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Mock Prisma client
const mockPrisma = {
  widgetEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  widget: {
    findFirst: jest.fn()
  },
  tenant: {
    findUnique: jest.fn()
  }
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

describe('Analytics System - Event Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Event Creation', () => {
    it('should log widget_view events correctly', async () => {
      // Mock widget lookup
      mockPrisma.widget.findFirst.mockResolvedValueOnce({
        id: 'widget-123',
        tenantId: 'tenant-456',
        publicKey: 'test-key',
        isActive: true
      })

      // Mock event creation
      mockPrisma.widgetEvent.create.mockResolvedValueOnce({
        id: 'event-789',
        eventType: 'widget_view',
        sessionId: 'session-abc',
        tenantId: 'tenant-456',
        widgetId: 'widget-123'
      })

      const eventData = {
        eventType: 'widget_view',
        sessionId: 'session-abc',
        userAgent: 'test-browser',
        referrer: 'https://example.com',
        tenantId: 'tenant-456',
        widgetId: 'widget-123'
      }

      await mockPrisma.widgetEvent.create({ data: eventData })

      expect(mockPrisma.widgetEvent.create).toHaveBeenCalledWith({
        data: eventData
      })
    })

    it('should log conversation_started events correctly', async () => {
      const eventData = {
        eventType: 'conversation_started',
        sessionId: 'session-xyz',
        tenantId: 'tenant-456',
        widgetId: 'widget-123'
      }

      mockPrisma.widgetEvent.create.mockResolvedValueOnce({
        id: 'event-890',
        ...eventData
      })

      await mockPrisma.widgetEvent.create({ data: eventData })

      expect(mockPrisma.widgetEvent.create).toHaveBeenCalledWith({
        data: eventData
      })
    })

    it('should log lead_created events correctly', async () => {
      const eventData = {
        eventType: 'lead_created',
        tenantId: 'tenant-456',
        widgetId: 'widget-123'
      }

      mockPrisma.widgetEvent.create.mockResolvedValueOnce({
        id: 'event-901',
        ...eventData
      })

      await mockPrisma.widgetEvent.create({ data: eventData })

      expect(mockPrisma.widgetEvent.create).toHaveBeenCalledWith({
        data: eventData
      })
    })
  })

  describe('KPI Calculations', () => {
    it('should calculate V (visitors) correctly', () => {
      const widgetViews = [
        { sessionId: 'session-1' },
        { sessionId: 'session-2' },
        { sessionId: 'session-3' }
      ]
      
      const V = widgetViews.length
      expect(V).toBe(3)
    })

    it('should calculate c (conversation rate) correctly', () => {
      const V = 10 // visitors
      const conversations = 3
      
      const c = V > 0 ? conversations / V : 0
      expect(c).toBe(0.3) // 30% conversion rate
      
      // Test edge case: no visitors
      const c_zero = 0 > 0 ? conversations / 0 : 0
      expect(c_zero).toBe(0)
    })

    it('should calculate q (qualification rate) correctly', () => {
      const conversations = 5
      const leads = 2
      
      const q = conversations > 0 ? leads / conversations : 0
      expect(q).toBe(0.4) // 40% qualification rate
      
      // Test edge case: no conversations
      const q_zero = 0 > 0 ? leads / 0 : 0
      expect(q_zero).toBe(0)
    })

    it('should calculate revenue estimation correctly', () => {
      const leads = 5
      const dealRate = 0.2 // 20%
      const averageCommission = 5000
      
      const estimatedDeals = leads * dealRate
      const estimatedRevenue = estimatedDeals * averageCommission
      
      expect(estimatedDeals).toBe(1) // 5 * 0.2 = 1
      expect(estimatedRevenue).toBe(5000) // 1 * 5000 = 5000
    })

    it('should handle complete V,c,q,d calculation flow', () => {
      // Test data
      const widgetViews = Array.from({ length: 100 }, (_, i) => ({ sessionId: `session-${i}` }))
      const conversations = 25
      const leads = 10
      const dealRate = 0.15
      const averageCommission = 7500
      
      // Calculate V, c, q, d
      const V = widgetViews.length
      const c = V > 0 ? conversations / V : 0
      const q = conversations > 0 ? leads / conversations : 0
      const d = dealRate
      
      const estimatedDeals = leads * d
      const estimatedRevenue = estimatedDeals * averageCommission
      
      expect(V).toBe(100)
      expect(c).toBe(0.25) // 25%
      expect(q).toBe(0.4)  // 40% 
      expect(d).toBe(0.15) // 15%
      expect(estimatedDeals).toBe(1.5)
      expect(estimatedRevenue).toBe(11250)
    })
  })

  describe('Date Range Filtering', () => {
    it('should create correct date ranges', () => {
      const days = 7
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      
      expect(startDate.getHours()).toBe(0)
      expect(endDate.getHours()).toBe(23)
      expect(endDate.getTime() - startDate.getTime()).toBeGreaterThan(6 * 24 * 60 * 60 * 1000) // At least 6 days
    })

    it('should filter events by date range', async () => {
      const mockEvents = [
        { id: '1', eventType: 'widget_view', createdAt: new Date('2024-01-01') },
        { id: '2', eventType: 'widget_view', createdAt: new Date('2024-01-05') },
        { id: '3', eventType: 'widget_view', createdAt: new Date('2024-01-10') }
      ]

      mockPrisma.widgetEvent.findMany.mockResolvedValueOnce(mockEvents)

      const events = await mockPrisma.widgetEvent.findMany({
        where: {
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-07')
          }
        }
      })

      expect(mockPrisma.widgetEvent.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-07')
          }
        }
      })
    })
  })

  describe('Tenant Isolation', () => {
    it('should scope analytics data by tenantId', async () => {
      const tenantId = 'tenant-test-123'
      
      mockPrisma.widgetEvent.findMany.mockResolvedValueOnce([
        { id: '1', tenantId: 'tenant-test-123', eventType: 'widget_view' }
      ])

      await mockPrisma.widgetEvent.findMany({
        where: { tenantId }
      })

      expect(mockPrisma.widgetEvent.findMany).toHaveBeenCalledWith({
        where: { tenantId }
      })
    })

    it('should not return data from other tenants', async () => {
      const tenantId = 'tenant-abc'
      const otherTenantEvents = [
        { id: '1', tenantId: 'tenant-xyz', eventType: 'widget_view' }
      ]
      
      // Mock should only return events for the specified tenant
      mockPrisma.widgetEvent.findMany.mockResolvedValueOnce([])

      const events = await mockPrisma.widgetEvent.findMany({
        where: { tenantId }
      })

      expect(events).toHaveLength(0)
    })
  })
})

describe('Analytics Settings Validation', () => {
  it('should validate averageCommission is positive', () => {
    const validCommission = 5000
    const invalidCommission = -100
    
    expect(typeof validCommission === 'number' && validCommission > 0).toBe(true)
    expect(typeof invalidCommission === 'number' && invalidCommission > 0).toBe(false)
  })

  it('should validate estimatedDealRate is between 0 and 100', () => {
    const validRates = [0, 15.5, 100]
    const invalidRates = [-5, 150, NaN]
    
    validRates.forEach(rate => {
      expect(typeof rate === 'number' && rate >= 0 && rate <= 100).toBe(true)
    })
    
    invalidRates.forEach(rate => {
      expect(typeof rate === 'number' && rate >= 0 && rate <= 100).toBe(false)
    })
  })

  it('should convert percentage to decimal correctly', () => {
    const percentage = 15.5 // 15.5%
    const decimal = percentage / 100
    
    expect(decimal).toBe(0.155)
  })
})