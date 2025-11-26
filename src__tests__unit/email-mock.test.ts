import { sendEmail, sendNewLeadNotification, sendTestNotification } from '../../../src/lib/email'
import nodemailer from 'nodemailer'

// Mock nodemailer
jest.mock('nodemailer')

const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>

describe('Email Provider Mock Setup', () => {
  let mockTransporter: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock transporter with sendMail method
    mockTransporter = {
      sendMail: jest.fn()
    }
    
    // Mock createTransporter to return our mock
    mockNodemailer.createTransporter = jest.fn().mockReturnValue(mockTransporter)
  })

  describe('sendEmail function', () => {
    it('should create transporter with correct SMTP config', async () => {
      // Set up environment variables
      process.env.SMTP_HOST = 'smtp.test.com'
      process.env.SMTP_PORT = '587'
      process.env.SMTP_USER = 'test@test.com'
      process.env.SMTP_PASS = 'testpass'
      process.env.FROM_EMAIL = 'noreply@test.com'

      const emailParams = {
        to: ['recipient@test.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text content'
      }

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' })

      await sendEmail(emailParams)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@test.com',
        to: ['recipient@test.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text content'
      })
    })

    it('should handle SMTP errors gracefully', async () => {
      const smtpError = new Error('SMTP connection failed')
      mockTransporter.sendMail.mockRejectedValue(smtpError)

      const emailParams = {
        to: ['recipient@test.com'],
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: 'Test'
      }

      await expect(sendEmail(emailParams)).rejects.toThrow('SMTP connection failed')
    })

    it('should handle missing environment variables', async () => {
      // Clear environment variables
      delete process.env.SMTP_HOST
      delete process.env.SMTP_PORT
      delete process.env.FROM_EMAIL

      const emailParams = {
        to: ['test@test.com'],
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      }

      // Should throw error due to missing config
      await expect(sendEmail(emailParams)).rejects.toThrow()
    })
  })

  describe('sendNewLeadNotification function', () => {
    it('should send notification to multiple recipients', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'notification-id' })

      const leadData = {
        leadId: 'lead-123',
        leadName: 'John Doe',
        leadEmail: 'john@example.com',
        intent: 'buying',
        qualificationScore: 85,
        createdAt: new Date('2023-12-01T10:00:00Z'),
        appBaseUrl: 'https://app.test.com'
      }

      const recipients = ['agent@test.com', 'manager@test.com']

      await sendNewLeadNotification(leadData, recipients)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: recipients,
          subject: 'New lead from your AI widget: John Doe',
          html: expect.stringContaining('John Doe'),
          text: expect.stringContaining('John Doe')
        })
      )
    })

    it('should handle empty recipients list', async () => {
      const leadData = {
        leadId: 'lead-456',
        appBaseUrl: 'https://app.test.com',
        createdAt: new Date()
      }

      await sendNewLeadNotification(leadData, [])

      // Should not call sendMail with empty recipients
      expect(mockTransporter.sendMail).not.toHaveBeenCalled()
    })
  })

  describe('sendTestNotification function', () => {
    it('should send test email with correct content', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-notification-id' })

      await sendTestNotification('test@test.com', 'https://app.test.com')

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test@test.com'],
          subject: 'Test notification from The Agent\'s Agent',
          html: expect.stringContaining('Test notification'),
          text: expect.stringContaining('Test notification')
        })
      )
    })

    it('should handle test notification failures', async () => {
      const emailError = new Error('SMTP authentication failed')
      mockTransporter.sendMail.mockRejectedValue(emailError)

      await expect(sendTestNotification('test@test.com', 'https://app.test.com'))
        .rejects.toThrow('SMTP authentication failed')
    })
  })

  describe('Error handling scenarios', () => {
    it('should handle transporter creation failure', async () => {
      mockNodemailer.createTransporter = jest.fn().mockImplementation(() => {
        throw new Error('Failed to create transporter')
      })

      const emailParams = {
        to: ['test@test.com'],
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      }

      await expect(sendEmail(emailParams)).rejects.toThrow('Failed to create transporter')
    })

    it('should handle network timeout', async () => {
      const timeoutError = new Error('Network timeout')
      timeoutError.name = 'NetworkTimeoutError'
      mockTransporter.sendMail.mockRejectedValue(timeoutError)

      const emailParams = {
        to: ['test@test.com'],
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      }

      await expect(sendEmail(emailParams)).rejects.toThrow('Network timeout')
    })

    it('should handle invalid recipient email', async () => {
      const invalidEmailError = new Error('Invalid recipient email address')
      mockTransporter.sendMail.mockRejectedValue(invalidEmailError)

      const emailParams = {
        to: ['invalid-email'],
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      }

      await expect(sendEmail(emailParams)).rejects.toThrow('Invalid recipient email address')
    })
  })
})