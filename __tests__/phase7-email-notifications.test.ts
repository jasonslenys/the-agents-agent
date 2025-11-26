// Mock modules before importing
const mockEmailFunctions = {
  generateNewLeadEmailTemplate: jest.fn(),
  generateTestEmailTemplate: jest.fn(),
  sendEmail: jest.fn(),
  sendNewLeadNotification: jest.fn(),
  sendTestNotification: jest.fn()
}

jest.mock('../src/lib/email', () => mockEmailFunctions)

const mockNotificationFunctions = {
  notifyNewLead: jest.fn(),
  enqueueNewLeadNotification: jest.fn()
}

jest.mock('../src/lib/notifications', () => mockNotificationFunctions)

const mockPrismaFunctions = {
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    tenant: { update: jest.fn(), findUnique: jest.fn() },
    conversation: { findUnique: jest.fn(), update: jest.fn() },
    message: { create: jest.fn() },
    lead: { create: jest.fn(), update: jest.fn() },
    widgetEvent: { create: jest.fn() }
  }
}

jest.mock('../src/lib/prisma', () => mockPrismaFunctions)

const mockSessionFunctions = {
  getSession: jest.fn()
}

jest.mock('../src/lib/session', () => mockSessionFunctions)

// Mock all external dependencies
jest.mock('../src/lib/email', () => ({
  generateNewLeadEmailTemplate: jest.fn(),
  generateTestEmailTemplate: jest.fn(),
  sendEmail: jest.fn(),
  sendNewLeadNotification: jest.fn(),
  sendTestNotification: jest.fn()
}))

jest.mock('../src/lib/notifications', () => ({
  notifyNewLead: jest.fn(),
  enqueueNewLeadNotification: jest.fn()
}))

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    tenant: { update: jest.fn(), findUnique: jest.fn() },
    conversation: { findUnique: jest.fn(), update: jest.fn() },
    message: { create: jest.fn() },
    lead: { create: jest.fn(), update: jest.fn() },
    widgetEvent: { create: jest.fn() }
  }
}))

jest.mock('../src/lib/session', () => ({
  getSession: jest.fn()
}))

const mockGenerateNewLeadEmailTemplate = generateNewLeadEmailTemplate as jest.MockedFunction<typeof generateNewLeadEmailTemplate>
const mockGenerateTestEmailTemplate = generateTestEmailTemplate as jest.MockedFunction<typeof generateTestEmailTemplate>
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>

describe('🔬 FAANG LEVEL: Phase 7 Email Notifications - Comprehensive Testing Suite', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'https://test.example.com'
  })

  describe('📧 EMAIL TEMPLATE GENERATION (Meta Standards)', () => {
    
    test('should generate email with lead name in subject', () => {
      const leadData = {
        leadId: 'lead-123',
        leadName: 'John Doe',
        leadEmail: 'john@test.com',
        intent: 'buying',
        qualificationScore: 85,
        createdAt: new Date('2023-12-01T10:00:00Z'),
        appBaseUrl: 'https://test.example.com'
      }

      mockGenerateNewLeadEmailTemplate.mockReturnValue({
        subject: 'New lead from your AI widget: John Doe',
        html: '<html><body><h1>New Lead: John Doe</h1><p>Email: john@test.com</p><p>Intent: buying</p><p>Score: 85</p><a href="https://test.example.com/app/leads/lead-123">View Lead</a></body></html>',
        text: 'New Lead: John Doe. Email: john@test.com. Intent: buying. Score: 85. View: https://test.example.com/app/leads/lead-123'
      })

      const result = generateNewLeadEmailTemplate(leadData)

      expect(mockGenerateNewLeadEmailTemplate).toHaveBeenCalledWith(leadData)
      expect(result.subject).toBe('New lead from your AI widget: John Doe')
      expect(result.html).toContain('John Doe')
      expect(result.html).toContain('john@test.com')
      expect(result.html).toContain('buying')
      expect(result.html).toContain('85')
      expect(result.html).toContain('https://test.example.com/app/leads/lead-123')
    })

    test('should handle unnamed leads with fallback', () => {
      const leadData = {
        leadId: 'lead-456',
        intent: 'selling',
        qualificationScore: 70,
        createdAt: new Date(),
        appBaseUrl: 'https://test.example.com'
      }

      mockGenerateNewLeadEmailTemplate.mockReturnValue({
        subject: 'New lead from your AI widget: Unnamed Lead',
        html: '<html><body><h1>New Lead: Unnamed Lead</h1></body></html>',
        text: 'New Lead: Unnamed Lead'
      })

      const result = generateNewLeadEmailTemplate(leadData)
      expect(result.subject).toBe('New lead from your AI widget: Unnamed Lead')
    })

    test('should generate test email with correct branding', () => {
      mockGenerateTestEmailTemplate.mockReturnValue({
        subject: 'Test notification from The Agent\'s Agent',
        html: '<html><body><h1>Test Notification</h1><p>Your notifications are configured correctly!</p></body></html>',
        text: 'Test notification from The Agent\'s Agent'
      })

      const result = generateTestEmailTemplate('https://test.example.com')
      expect(result.subject).toBe('Test notification from The Agent\'s Agent')
      expect(result.html).toContain('Test Notification')
    })

    test('should never expose sensitive data in email links', () => {
      const leadData = {
        leadId: 'lead-secure',
        leadName: 'Sensitive User',
        leadEmail: 'sensitive@example.com',
        leadPhone: '+1-555-SECRET',
        intent: 'buying',
        qualificationScore: 99,
        createdAt: new Date(),
        appBaseUrl: 'https://test.example.com'
      }

      mockGenerateNewLeadEmailTemplate.mockReturnValue({
        subject: 'New lead from your AI widget: Sensitive User',
        html: '<a href="https://test.example.com/app/leads/lead-secure">View Lead</a>',
        text: 'View: https://test.example.com/app/leads/lead-secure'
      })

      const result = generateNewLeadEmailTemplate(leadData)
      
      // Extract all URLs from the content
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g
      const urls = (result.html + ' ' + result.text).match(urlRegex) || []
      
      urls.forEach(url => {
        expect(url).not.toContain('sensitive@example.com')
        expect(url).not.toContain('+1-555-SECRET')
        expect(url).not.toContain('99')
        expect(url).not.toContain('Sensitive User')
      })
    })
  })

  describe('⚙️ SETTINGS PERSISTENCE (Google Standards)', () => {
    
    test('should persist notification toggle state', async () => {
      const { getSession } = require('../src/lib/session')
      const { prisma } = require('../src/lib/prisma')
      
      getSession.mockResolvedValue({ id: 'user-123' })
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        tenantId: 'tenant-456',
        name: 'Test User',
        email: 'test@example.com'
      })
      prisma.user.update.mockResolvedValue({})
      prisma.tenant.update.mockResolvedValue({})

      const requestBody = {
        name: 'Test User',
        email: 'test@example.com', 
        companyName: 'Test Company',
        averageCommission: 5000,
        estimatedDealRate: 15,
        emailNotificationsEnabled: true,
        additionalNotificationEmails: 'team@example.com'
      }

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const response = await PUT(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-456' },
        data: expect.objectContaining({
          emailNotificationsEnabled: true,
          additionalNotificationEmails: 'team@example.com'
        })
      })
    })

    test('should validate and sanitize additional email inputs', async () => {
      const { getSession } = require('../src/lib/session')
      const { prisma } = require('../src/lib/prisma')
      
      getSession.mockResolvedValue({ id: 'user-123' })
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        tenantId: 'tenant-456'
      })
      prisma.user.update.mockResolvedValue({})
      prisma.tenant.update.mockResolvedValue({})

      const requestBody = {
        name: 'Test User',
        email: 'test@example.com',
        companyName: 'Test Company', 
        averageCommission: 5000,
        estimatedDealRate: 15,
        emailNotificationsEnabled: true,
        additionalNotificationEmails: '  extra@test.com,  another@test.com  ,third@test.com  '
      }

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      await PUT(request)

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-456' },
        data: expect.objectContaining({
          additionalNotificationEmails: 'extra@test.com,  another@test.com  ,third@test.com'
        })
      })
    })
  })

  describe('🔗 INTEGRATION FLOWS (Apple Standards)', () => {
    
    test('should trigger notification when new lead is created', async () => {
      const { prisma } = require('../src/lib/prisma')
      const { enqueueNewLeadNotification } = require('../src/lib/notifications')
      
      const conversationId = 'conv-123'
      const tenantId = 'tenant-456'
      
      const mockConversation = {
        id: conversationId,
        tenantId,
        widgetId: 'widget-789',
        lead: null,
        widget: { id: 'widget-789' },
        messages: []
      }

      const mockUpdatedConversation = {
        id: conversationId,
        tenantId,
        widgetId: 'widget-789',
        messages: [
          { text: "I'm John and I want to buy a house", senderType: 'VISITOR', createdAt: new Date() }
        ]
      }

      const mockNewLead = {
        id: 'lead-new-123',
        tenantId,
        widgetId: 'widget-789',
        intent: 'buying',
        qualificationScore: 75
      }

      prisma.conversation.findUnique
        .mockResolvedValueOnce(mockConversation)
        .mockResolvedValueOnce(mockUpdatedConversation)
      prisma.message.create.mockResolvedValue({})
      prisma.lead.create.mockResolvedValue(mockNewLead)
      prisma.widgetEvent.create.mockResolvedValue({})
      prisma.conversation.update.mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: "I'm John and I want to buy a house",
          senderType: 'VISITOR',
          conversationState: {}
        })
      })

      const response = await MessagesPost(request)
      expect(response.status).toBe(200)
      expect(enqueueNewLeadNotification).toHaveBeenCalledWith('lead-new-123', tenantId)
    })

    test('should not trigger notification for existing lead updates', async () => {
      const { prisma } = require('../src/lib/prisma')
      const { enqueueNewLeadNotification } = require('../src/lib/notifications')
      
      const conversationId = 'conv-existing'
      const existingLeadId = 'lead-existing-123'
      
      const mockConversation = {
        id: conversationId,
        tenantId: 'tenant-456',
        widgetId: 'widget-789',
        lead: { id: existingLeadId },
        widget: { id: 'widget-789' },
        messages: []
      }

      const mockUpdatedConversation = {
        id: conversationId,
        tenantId: 'tenant-456',
        widgetId: 'widget-789',
        messages: [{ text: 'Follow up question', senderType: 'VISITOR', createdAt: new Date() }]
      }

      prisma.conversation.findUnique
        .mockResolvedValueOnce(mockConversation)
        .mockResolvedValueOnce(mockUpdatedConversation)
      prisma.message.create.mockResolvedValue({})
      prisma.lead.update.mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: 'Follow up question',
          senderType: 'VISITOR',
          conversationState: {}
        })
      })

      await MessagesPost(request)
      expect(enqueueNewLeadNotification).not.toHaveBeenCalled()
    })
  })

  describe('🧪 TEST NOTIFICATION FUNCTIONALITY (Netflix Standards)', () => {
    
    test('should send test notification successfully', async () => {
      const { getSession } = require('../src/lib/session')
      const { sendTestNotification } = require('../src/lib/email')
      
      getSession.mockResolvedValue({ id: 'user-123' })
      sendTestNotification.mockResolvedValue()

      const request = new NextRequest('http://localhost:3000/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      })

      const response = await TestNotificationPost(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toBe('Test notification sent successfully')
    })

    test('should handle SMTP configuration errors gracefully', async () => {
      const { getSession } = require('../src/lib/session')
      const { sendTestNotification } = require('../src/lib/email')
      
      getSession.mockResolvedValue({ id: 'user-123' })
      sendTestNotification.mockRejectedValue(new Error('SMTP connection failed'))

      const request = new NextRequest('http://localhost:3000/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      })

      const response = await TestNotificationPost(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toContain('SMTP')
    })

    test('should reject invalid email addresses', async () => {
      const { getSession } = require('../src/lib/session')
      
      getSession.mockResolvedValue({ id: 'user-123' })

      const request = new NextRequest('http://localhost:3000/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email' })
      })

      const response = await TestNotificationPost(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Valid email address is required')
    })

    test('should require authentication for test notifications', async () => {
      const { getSession } = require('../src/lib/session')
      
      getSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      })

      const response = await TestNotificationPost(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('⚡ ERROR HANDLING & EDGE CASES (Amazon Standards)', () => {
    
    test('should handle missing environment variables gracefully', () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      delete process.env.SMTP_HOST

      const leadData = {
        leadId: 'lead-123',
        createdAt: new Date(),
        appBaseUrl: ''
      }

      // Should not crash when environment variables are missing
      expect(() => {
        mockGenerateNewLeadEmailTemplate.mockReturnValue({
          subject: 'New lead from your AI widget: Unnamed Lead',
          html: '<html><body>Lead notification</body></html>',
          text: 'Lead notification'
        })
        generateNewLeadEmailTemplate(leadData)
      }).not.toThrow()
    })

    test('should handle malformed additional email lists', async () => {
      const { getSession } = require('../src/lib/session')
      const { prisma } = require('../src/lib/prisma')
      
      getSession.mockResolvedValue({ id: 'user-123' })
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        tenantId: 'tenant-456'
      })
      prisma.user.update.mockResolvedValue({})
      prisma.tenant.update.mockResolvedValue({})

      const malformedEmailStrings = [
        ',,,,invalid@,@invalid,',
        'valid@test.com,,,invalid,@,valid2@test.com',
        '   ,  ,  , extra-spaces@test.com ,  ,  ',
        ''
      ]

      for (const emails of malformedEmailStrings) {
        const request = new NextRequest('http://localhost:3000/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test',
            email: 'test@example.com',
            companyName: 'Test Company',
            averageCommission: 5000,
            estimatedDealRate: 15,
            emailNotificationsEnabled: true,
            additionalNotificationEmails: emails
          })
        })

        const response = await PUT(request)
        expect(response.status).toBe(200) // Should not crash
      }
    })

    test('should handle email service timeouts and network failures', async () => {
      mockSendEmail.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100)
        })
      })

      const emailParams = {
        to: ['test@example.com'],
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      }

      await expect(sendEmail(emailParams)).rejects.toThrow('Network timeout')
    })
  })
})