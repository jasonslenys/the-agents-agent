import { createTransport } from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
}

interface SendEmailParams {
  to: string[]
  subject: string
  html: string
  text?: string
}

interface LeadNotificationData {
  leadId: string
  leadName?: string
  leadEmail?: string
  leadPhone?: string
  intent?: string
  qualificationScore?: number
  createdAt: Date
  appBaseUrl: string
}

interface TeamInvitationData {
  to: string
  inviterName: string
  tenantName: string
  role: string
  inviteLink: string
}

function getEmailConfig(): EmailConfig {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '587')
  const secure = process.env.SMTP_SECURE === 'true'
  const user = process.env.SMTP_USER || ''
  const pass = process.env.SMTP_PASS || ''

  if (!user || !pass) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.')
  }

  return { host, port, secure, user, pass }
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  try {
    const config = getEmailConfig()
    
    const transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })

    await transporter.sendMail({
      from: config.user,
      to: to.join(', '),
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    })

    console.log(`Email sent successfully to: ${to.join(', ')}`)
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export function generateNewLeadEmailTemplate(data: LeadNotificationData): { subject: string; html: string } {
  const leadName = data.leadName || 'Unknown'
  const subject = `New lead from your AI widget: ${leadName}`
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Lead Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0ea5e9; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { background-color: #64748b; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
        .lead-info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #0ea5e9; }
        .qualification-score { display: inline-block; background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
        .cta-button { display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
        .cta-button:hover { background-color: #0284c7; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 New Lead Alert!</h1>
        <p>Your AI widget just captured a new qualified lead.</p>
      </div>
      
      <div class="content">
        <div class="lead-info">
          <h3>Lead Details:</h3>
          <p><strong>Name:</strong> ${data.leadName || 'Not provided'}</p>
          <p><strong>Email:</strong> ${data.leadEmail || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${data.leadPhone || 'Not provided'}</p>
          <p><strong>Interest:</strong> ${data.intent || 'General inquiry'}</p>
          <p><strong>Qualification Score:</strong> <span class="qualification-score">${data.qualificationScore || 0}/100</span></p>
          <p><strong>Received:</strong> ${data.createdAt.toLocaleString()}</p>
        </div>
        
        <p>This lead was automatically qualified by your AI assistant based on their conversation. Review the full conversation and contact details to follow up quickly!</p>
        
        <a href="${data.appBaseUrl}/app/leads/${data.leadId}" class="cta-button">View Lead Details →</a>
        
        <p><small><strong>Pro tip:</strong> Quick responses to new leads dramatically improve conversion rates. Consider reaching out within the first hour!</small></p>
      </div>
      
      <div class="footer">
        <p>Powered by The Agent's Agent | <a href="${data.appBaseUrl}/app/settings" style="color: #cbd5e1;">Manage notification settings</a></p>
      </div>
    </body>
    </html>
  `
  
  return { subject, html }
}

export function generateTestEmailTemplate(recipientEmail: string, appBaseUrl: string): { subject: string; html: string } {
  const subject = 'Test notification from The Agent\'s Agent'
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f0fdf4; padding: 20px; border: 1px solid #bbf7d0; }
        .footer { background-color: #64748b; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
        .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Email Notifications Working!</h1>
      </div>
      
      <div class="content">
        <div class="success-icon">🎉</div>
        <p>Great news! Your email notification system is properly configured and working.</p>
        <p><strong>Test sent to:</strong> ${recipientEmail}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        
        <p>You'll now receive email alerts whenever a new qualified lead is created through your AI widgets.</p>
        
        <p>You can manage your notification settings anytime from your dashboard.</p>
      </div>
      
      <div class="footer">
        <p>Powered by The Agent's Agent | <a href="${appBaseUrl}/app/settings" style="color: #cbd5e1;">Manage notification settings</a></p>
      </div>
    </body>
    </html>
  `
  
  return { subject, html }
}

export async function sendNewLeadNotification(data: LeadNotificationData, recipientEmails: string[]): Promise<void> {
  const { subject, html } = generateNewLeadEmailTemplate(data)
  await sendEmail({
    to: recipientEmails,
    subject,
    html
  })
}

export async function sendTestNotification(recipientEmail: string, appBaseUrl: string): Promise<void> {
  const { subject, html } = generateTestEmailTemplate(recipientEmail, appBaseUrl)
  await sendEmail({
    to: [recipientEmail],
    subject,
    html
  })
}

export function generateTeamInvitationEmailTemplate(data: TeamInvitationData): { subject: string; html: string } {
  const subject = `You're invited to join ${data.tenantName} team`
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #7c3aed; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { background-color: #64748b; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
        .invitation-info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #7c3aed; }
        .role-badge { display: inline-block; background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; text-transform: capitalize; }
        .cta-button { display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
        .cta-button:hover { background-color: #6d28d9; }
        .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Team Invitation</h1>
        <p>You've been invited to join a team!</p>
      </div>
      
      <div class="content">
        <div class="invitation-info">
          <h3>Invitation Details:</h3>
          <p><strong>Team:</strong> ${data.tenantName}</p>
          <p><strong>Invited by:</strong> ${data.inviterName}</p>
          <p><strong>Role:</strong> <span class="role-badge">${data.role}</span></p>
        </div>
        
        <p>You've been invited to join the <strong>${data.tenantName}</strong> team as a <strong>${data.role}</strong>. This will give you access to their leads, conversations, and team features.</p>
        
        <a href="${data.inviteLink}" class="cta-button">Accept Invitation →</a>
        
        <div class="warning">
          <p><strong>⏰ This invitation expires in 7 days.</strong> Click the button above to accept and create your account.</p>
        </div>
        
        <p><small>If you don't want to join this team, you can simply ignore this email.</small></p>
      </div>
      
      <div class="footer">
        <p>Powered by The Agent's Agent</p>
      </div>
    </body>
    </html>
  `
  
  return { subject, html }
}

export async function sendTeamInvitationEmail(data: TeamInvitationData): Promise<void> {
  const { subject, html } = generateTeamInvitationEmailTemplate(data)
  await sendEmail({
    to: [data.to],
    subject,
    html
  })
}