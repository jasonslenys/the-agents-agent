import { generateNewLeadEmailTemplate, generateTestEmailTemplate } from '../../../src/lib/email'

describe('Email Formatting', () => {
  describe('generateNewLeadEmailTemplate', () => {
    it('should generate proper email subject with lead name', () => {
      const mockData = {
        leadId: 'lead-123',
        leadName: 'John Doe',
        leadEmail: 'john@example.com',
        intent: 'buying',
        qualificationScore: 85,
        createdAt: new Date('2023-12-01T10:00:00Z'),
        appBaseUrl: 'https://app.example.com'
      }

      const { subject, html } = generateNewLeadEmailTemplate(mockData)

      expect(subject).toBe('New lead from your AI widget: John Doe')
      expect(html).toContain('John Doe')
      expect(html).toContain('john@example.com')
      expect(html).toContain('buying')
      expect(html).toContain('85')
      expect(html).toContain('https://app.example.com/app/leads/lead-123')
    })

    it('should handle unnamed leads correctly', () => {
      const mockData = {
        leadId: 'lead-456',
        intent: 'selling',
        qualificationScore: 70,
        createdAt: new Date('2023-12-01T10:00:00Z'),
        appBaseUrl: 'https://app.example.com'
      }

      const { subject } = generateNewLeadEmailTemplate(mockData)

      expect(subject).toBe('New lead from your AI widget: Unnamed Lead')
    })

    it('should include all required fields in HTML body', () => {
      const mockData = {
        leadId: 'lead-789',
        leadName: 'Jane Smith',
        leadEmail: 'jane@example.com',
        leadPhone: '+1-555-123-4567',
        intent: 'investing',
        qualificationScore: 92,
        createdAt: new Date('2023-12-01T15:30:00Z'),
        appBaseUrl: 'https://app.example.com'
      }

      const { html } = generateNewLeadEmailTemplate(mockData)

      // Check for lead details
      expect(html).toContain('Jane Smith')
      expect(html).toContain('jane@example.com')
      expect(html).toContain('+1-555-123-4567')
      expect(html).toContain('investing')
      expect(html).toContain('92')
      
      // Check for secure link
      expect(html).toContain('https://app.example.com/app/leads/lead-789')
      
      // Check for timestamp (should be formatted)
      expect(html).toContain('2023')
      expect(html).toContain('Dec')
    })

    it('should not expose sensitive data in links', () => {
      const mockData = {
        leadId: 'lead-secure',
        leadName: 'Test User',
        leadEmail: 'test@example.com',
        intent: 'buying',
        qualificationScore: 75,
        createdAt: new Date(),
        appBaseUrl: 'https://app.example.com'
      }

      const { html } = generateNewLeadEmailTemplate(mockData)

      // Link should only contain the app base URL and lead ID
      const linkMatch = html.match(/href="([^"]*\/app\/leads\/[^"]*)"/)
      expect(linkMatch).toBeTruthy()
      
      const link = linkMatch![1]
      expect(link).toBe('https://app.example.com/app/leads/lead-secure')
      expect(link).not.toContain('test@example.com')
      expect(link).not.toContain('75')
    })
  })

  describe('generateTestEmailTemplate', () => {
    it('should generate test email with proper content', () => {
      const { subject, html } = generateTestEmailTemplate('https://app.example.com')

      expect(subject).toBe('Test notification from The Agent\'s Agent')
      expect(html).toContain('Test notification')
      expect(html).toContain('https://app.example.com')
      expect(html).toContain('configured correctly')
    })

    it('should include app link in test email', () => {
      const { html } = generateTestEmailTemplate('https://myapp.com')

      expect(html).toContain('https://myapp.com')
    })
  })
})