import { NextRequest } from 'next/server'
import { POST } from '../../../src/app/api/messages/route'
import { prisma } from '../../../src/lib/prisma'
import { sendNewLeadNotification } from '../../../src/lib/email'

// Mock the email service
jest.mock('../../../src/lib/email', () => ({
  sendNewLeadNotification: jest.fn()
}))

// Mock prisma
jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    conversation: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    message: {
      create: jest.fn()
    },
    lead: {
      create: jest.fn(),
      update: jest.fn()
    },
    widgetEvent: {
      create: jest.fn()
    },
    tenant: {
      findUnique: jest.fn()
    },
    user: {
      findMany: jest.fn()
    }
  }
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockSendNewLeadNotification = sendNewLeadNotification as jest.MockedFunction<typeof sendNewLeadNotification>

describe('Lead Creation Triggers Email Notification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock environment variables
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test.com'
  })

  it('should trigger email notification when new lead is created from visitor message', async () => {
    const conversationId = 'conv-123'
    const tenantId = 'tenant-456'
    const widgetId = 'widget-789'

    // Mock conversation data
    const mockConversation = {
      id: conversationId,
      tenantId,
      widgetId,
      lead: null, // No existing lead
      widget: { id: widgetId },
      messages: []
    }

    // Mock updated conversation with messages
    const mockUpdatedConversation = {
      id: conversationId,
      tenantId,
      widgetId,
      messages: [
        {
          id: 'msg-1',
          text: "Hi, I'm John Doe and I'm looking to buy a house",
          senderType: 'VISITOR',
          createdAt: new Date()
        },
        {
          id: 'msg-2',
          text: "Nice to meet you, John! What brings you here today?",
          senderType: 'SYSTEM',
          createdAt: new Date()
        }
      ]
    }

    // Mock new lead creation
    const mockNewLead = {
      id: 'lead-new-123',
      tenantId,
      widgetId,
      intent: 'buying',
      qualificationScore: 75,
      createdAt: new Date()
    }

    // Mock tenant with notifications enabled
    const mockTenant = {
      id: tenantId,
      emailNotificationsEnabled: true,
      additionalNotificationEmails: 'team@example.com'
    }

    // Mock tenant's users
    const mockUsers = [
      {
        id: 'user-1',
        email: 'agent@example.com',
        name: 'Main Agent'
      }
    ]

    // Set up mocks
    mockPrisma.conversation.findUnique
      .mockResolvedValueOnce(mockConversation as any)
      .mockResolvedValueOnce(mockUpdatedConversation as any)

    mockPrisma.message.create.mockResolvedValue({} as any)
    mockPrisma.lead.create.mockResolvedValue(mockNewLead as any)
    mockPrisma.widgetEvent.create.mockResolvedValue({} as any)
    mockPrisma.conversation.update.mockResolvedValue({} as any)
    
    // Mock notification dependencies
    mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant as any)
    mockPrisma.user.findMany.mockResolvedValue(mockUsers as any)
    mockSendNewLeadNotification.mockResolvedValue()

    const requestBody = {
      conversationId,
      message: "Hi, I'm John Doe and I'm looking to buy a house",
      senderType: 'VISITOR',
      conversationState: {}
    }

    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    // Execute the API call
    const response = await POST(request)
    const responseData = await response.json()

    // Verify response
    expect(response.status).toBe(200)
    expect(responseData.success).toBe(true)

    // Verify new lead was created
    expect(mockPrisma.lead.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        widgetId,
        intent: expect.any(String),
        qualificationScore: expect.any(Number)
      }
    })

    // Allow async notification to process
    await new Promise(resolve => setImmediate(resolve))

    // Verify email notification was triggered
    expect(mockSendNewLeadNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 'lead-new-123',
        appBaseUrl: 'https://app.test.com'
      }),
      expect.arrayContaining([
        'agent@example.com',
        'team@example.com'
      ])
    )
  })

  it('should not trigger notification when tenant has notifications disabled', async () => {
    const conversationId = 'conv-disabled'
    const tenantId = 'tenant-disabled'

    // Mock conversation data
    const mockConversation = {
      id: conversationId,
      tenantId,
      widgetId: 'widget-789',
      lead: null,
      widget: { id: 'widget-789' },
      messages: []
    }

    // Mock updated conversation
    const mockUpdatedConversation = {
      id: conversationId,
      tenantId,
      widgetId: 'widget-789',
      messages: [
        {
          id: 'msg-1',
          text: "Hi, I'm Jane and I want to sell my house",
          senderType: 'VISITOR',
          createdAt: new Date()
        }
      ]
    }

    // Mock new lead creation
    const mockNewLead = {
      id: 'lead-disabled-123',
      tenantId,
      widgetId: 'widget-789',
      intent: 'selling',
      qualificationScore: 80
    }

    // Mock tenant with notifications DISABLED
    const mockTenant = {
      id: tenantId,
      emailNotificationsEnabled: false
    }

    // Set up mocks
    mockPrisma.conversation.findUnique
      .mockResolvedValueOnce(mockConversation as any)
      .mockResolvedValueOnce(mockUpdatedConversation as any)

    mockPrisma.message.create.mockResolvedValue({} as any)
    mockPrisma.lead.create.mockResolvedValue(mockNewLead as any)
    mockPrisma.widgetEvent.create.mockResolvedValue({} as any)
    mockPrisma.conversation.update.mockResolvedValue({} as any)
    
    mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant as any)

    const requestBody = {
      conversationId,
      message: "Hi, I'm Jane and I want to sell my house",
      senderType: 'VISITOR',
      conversationState: {}
    }

    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    await POST(request)

    // Allow async processing
    await new Promise(resolve => setImmediate(resolve))

    // Verify email notification was NOT triggered
    expect(mockSendNewLeadNotification).not.toHaveBeenCalled()
  })

  it('should update existing lead without triggering notification', async () => {
    const conversationId = 'conv-existing'
    const tenantId = 'tenant-existing'
    const existingLeadId = 'lead-existing-123'

    // Mock conversation with existing lead
    const mockConversation = {
      id: conversationId,
      tenantId,
      widgetId: 'widget-789',
      lead: { id: existingLeadId },
      widget: { id: 'widget-789' },
      messages: []
    }

    // Mock updated conversation
    const mockUpdatedConversation = {
      id: conversationId,
      tenantId,
      widgetId: 'widget-789',
      messages: [
        {
          id: 'msg-1',
          text: "I have more questions",
          senderType: 'VISITOR',
          createdAt: new Date()
        }
      ]
    }

    // Set up mocks
    mockPrisma.conversation.findUnique
      .mockResolvedValueOnce(mockConversation as any)
      .mockResolvedValueOnce(mockUpdatedConversation as any)

    mockPrisma.message.create.mockResolvedValue({} as any)
    mockPrisma.lead.update.mockResolvedValue({} as any)

    const requestBody = {
      conversationId,
      message: "I have more questions",
      senderType: 'VISITOR',
      conversationState: {}
    }

    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    await POST(request)

    // Verify existing lead was updated (not created)
    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: existingLeadId },
      data: expect.objectContaining({
        intent: expect.any(String),
        qualificationScore: expect.any(Number),
        updatedAt: expect.any(Date)
      })
    })

    // Verify no new lead creation
    expect(mockPrisma.lead.create).not.toHaveBeenCalled()

    // Allow async processing
    await new Promise(resolve => setImmediate(resolve))

    // Verify no email notification was triggered for existing lead update
    expect(mockSendNewLeadNotification).not.toHaveBeenCalled()
  })
})