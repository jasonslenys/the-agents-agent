import { prisma } from './prisma'
import { sendNewLeadNotification } from './email'

interface NotifyNewLeadParams {
  leadId: string
  tenantId: string
}

export async function notifyNewLead({ leadId, tenantId }: NotifyNewLeadParams): Promise<void> {
  try {
    // Get tenant with notification settings
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: true
      }
    })

    if (!tenant) {
      console.warn(`Tenant not found for lead notification: ${tenantId}`)
      return
    }

    // Check if email notifications are enabled
    if (!tenant.emailNotificationsEnabled) {
      console.log(`Email notifications disabled for tenant: ${tenantId}`)
      return
    }

    // Get lead details
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        widget: true
      }
    })

    if (!lead) {
      console.warn(`Lead not found for notification: ${leadId}`)
      return
    }

    // Collect email recipients
    const recipients: string[] = []
    
    // Add primary user email (tenant owner)
    if (tenant.users.length > 0) {
      recipients.push(tenant.users[0].email)
    }

    // Add additional notification emails if configured
    if (tenant.additionalNotificationEmails) {
      const additionalEmails = tenant.additionalNotificationEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0 && email.includes('@'))
      
      recipients.push(...additionalEmails)
    }

    if (recipients.length === 0) {
      console.warn(`No recipients configured for tenant: ${tenantId}`)
      return
    }

    // Determine app base URL
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Prepare notification data (convert null to undefined for type compatibility)
    const notificationData = {
      leadId: lead.id,
      leadName: lead.name ?? undefined,
      leadEmail: lead.email ?? undefined,
      leadPhone: lead.phone ?? undefined,
      intent: lead.intent ?? undefined,
      qualificationScore: lead.qualificationScore ?? undefined,
      createdAt: lead.createdAt,
      appBaseUrl
    }

    // Send notification emails
    await sendNewLeadNotification(notificationData, recipients)

    console.log(`New lead notification sent successfully for lead: ${leadId}`)
  } catch (error) {
    console.error(`Failed to send new lead notification for lead: ${leadId}`, error)
    // Don't throw error - we don't want notification failures to break lead creation
  }
}

// Background job queue simulation - in production this would use a proper queue
export async function enqueueNewLeadNotification(leadId: string, tenantId: string): Promise<void> {
  // For now, we'll process immediately but in a non-blocking way
  setImmediate(() => {
    notifyNewLead({ leadId, tenantId }).catch(error => {
      console.error('Background notification failed:', error)
    })
  })
}