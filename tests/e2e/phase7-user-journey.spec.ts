import { test, expect, Page } from '@playwright/test'

test.describe('🍎 APPLE TEAM: Phase 7 End-to-End User Journey Testing', () => {

  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('http://localhost:3002')
    
    // Mock successful authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('test-session', 'authenticated')
    })
  })

  test.describe('📧 NOTIFICATION SETTINGS USER JOURNEY', () => {
    
    test('Complete notification setup workflow', async ({ page }) => {
      // Navigate to settings
      await page.goto('http://localhost:3002/app/settings')
      
      // Wait for settings page to load
      await expect(page.locator('h1')).toContainText('Settings')
      
      // Verify notification section exists
      await expect(page.locator('h3')).toContainText('Email Notifications')
      
      // Enable email notifications
      const notificationToggle = page.locator('#emailNotifications')
      await expect(notificationToggle).toBeVisible()
      await notificationToggle.check()
      
      // Add additional notification emails
      const additionalEmailsInput = page.locator('#additionalEmails')
      await expect(additionalEmailsInput).toBeVisible()
      await additionalEmailsInput.fill('team@example.com, manager@example.com')
      
      // Verify test notification button is enabled
      const testButton = page.locator('button:has-text("Send Test Email")')
      await expect(testButton).toBeEnabled()
      
      // Save settings
      const saveButton = page.locator('button:has-text("Save Changes")')
      await expect(saveButton).toBeVisible()
      await saveButton.click()
      
      // Verify success message
      await expect(page.locator('.text-green-700')).toContainText('Settings updated successfully')
    })

    test('Test notification button workflow', async ({ page }) => {
      await page.goto('http://localhost:3002/app/settings')
      
      // Enable notifications first
      await page.locator('#emailNotifications').check()
      
      // Click test notification button
      const testButton = page.locator('button:has-text("Send Test Email")')
      await testButton.click()
      
      // Verify loading state
      await expect(page.locator('button:has-text("Sending...")')).toBeVisible()
      
      // Wait for completion and verify success message
      await expect(page.locator('.text-green-700')).toContainText('Test notification sent successfully')
    })

    test('Disable notifications workflow', async ({ page }) => {
      await page.goto('http://localhost:3002/app/settings')
      
      // First enable notifications
      await page.locator('#emailNotifications').check()
      await page.locator('button:has-text("Save Changes")').click()
      await expect(page.locator('.text-green-700')).toBeVisible()
      
      // Then disable notifications
      await page.locator('#emailNotifications').uncheck()
      
      // Verify test button is disabled
      const testButton = page.locator('button:has-text("Send Test Email")')
      await expect(testButton).toBeDisabled()
      
      // Save disabled state
      await page.locator('button:has-text("Save Changes")').click()
      await expect(page.locator('.text-green-700')).toContainText('Settings updated successfully')
    })
  })

  test.describe('🤖 WIDGET TO NOTIFICATION JOURNEY', () => {
    
    test('Complete lead creation to notification workflow', async ({ page }) => {
      // Step 1: Navigate to widget test page
      await page.goto('http://localhost:3002/test-external.html')
      
      // Wait for widget to load
      await expect(page.locator('iframe')).toBeVisible()
      
      // Switch to widget frame
      const widgetFrame = page.frameLocator('iframe')
      
      // Step 2: Start conversation in widget
      const chatInput = widgetFrame.locator('input[type="text"], textarea')
      await expect(chatInput).toBeVisible()
      await chatInput.fill("Hi, I'm John Doe and I'm looking to buy a house")
      
      // Send message
      const sendButton = widgetFrame.locator('button:has-text("Send")')
      await sendButton.click()
      
      // Step 3: Continue conversation to qualify as lead
      await expect(widgetFrame.locator('text=Nice to meet you, John')).toBeVisible()
      
      // Provide email for lead qualification
      await chatInput.fill('My email is john.doe@example.com')
      await sendButton.click()
      
      // Step 4: Verify lead was created (check admin panel)
      await page.goto('http://localhost:3002/app/leads')
      
      // Should see new lead in dashboard
      await expect(page.locator('text=John')).toBeVisible()
      await expect(page.locator('text=buying')).toBeVisible()
      
      // Step 5: Verify notification was triggered (check logs/mock)
      // Note: In real test, this would verify email was sent via test SMTP
    })

    test('Multiple conversation workflow', async ({ page }) => {
      await page.goto('http://localhost:3002/test-external.html')
      
      const widgetFrame = page.frameLocator('iframe')
      const chatInput = widgetFrame.locator('input[type="text"], textarea')
      const sendButton = widgetFrame.locator('button:has-text("Send")')
      
      // Create multiple conversations rapidly
      const leadNames = ['Alice Smith', 'Bob Johnson', 'Carol Williams']
      
      for (const name of leadNames) {
        await chatInput.fill(`Hello, I'm ${name} and I want to sell my property`)
        await sendButton.click()
        
        await expect(widgetFrame.locator(`text=Nice to meet you, ${name.split(' ')[0]}`)).toBeVisible()
        
        await chatInput.fill(`${name.toLowerCase().replace(' ', '.')}@example.com`)
        await sendButton.click()
        
        // Wait for response before next iteration
        await page.waitForTimeout(1000)
      }
      
      // Verify all leads appear in dashboard
      await page.goto('http://localhost:3002/app/leads')
      
      for (const name of leadNames) {
        await expect(page.locator(`text=${name.split(' ')[0]}`)).toBeVisible()
      }
    })
  })

  test.describe('📱 RESPONSIVE & ACCESSIBILITY TESTING', () => {
    
    test('Settings page mobile responsiveness', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('http://localhost:3002/app/settings')
      
      // Verify elements are still accessible
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('#emailNotifications')).toBeVisible()
      await expect(page.locator('#additionalEmails')).toBeVisible()
      
      // Verify form is still functional
      await page.locator('#emailNotifications').check()
      await page.locator('button:has-text("Save Changes")').click()
      await expect(page.locator('.text-green-700')).toBeVisible()
    })

    test('Keyboard navigation for notifications settings', async ({ page }) => {
      await page.goto('http://localhost:3002/app/settings')
      
      // Navigate using keyboard only
      await page.keyboard.press('Tab') // Navigate to first input
      await page.keyboard.press('Tab') // Navigate to email input
      await page.keyboard.press('Tab') // Navigate to company input
      await page.keyboard.press('Tab') // Navigate to notification checkbox
      
      // Enable notifications via keyboard
      await page.keyboard.press('Space')
      
      // Navigate to additional emails
      await page.keyboard.press('Tab')
      await page.keyboard.type('keyboard-test@example.com')
      
      // Navigate to save button
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      
      // Verify success
      await expect(page.locator('.text-green-700')).toBeVisible()
    })

    test('Screen reader accessibility', async ({ page }) => {
      await page.goto('http://localhost:3002/app/settings')
      
      // Check for proper ARIA labels and roles
      const notificationCheckbox = page.locator('#emailNotifications')
      await expect(notificationCheckbox).toHaveAttribute('type', 'checkbox')
      
      const emailInput = page.locator('#additionalEmails')
      await expect(emailInput).toHaveAttribute('type', 'text')
      
      // Verify proper labeling
      await expect(page.locator('label[for="emailNotifications"]')).toBeVisible()
      await expect(page.locator('label[for="additionalEmails"]')).toBeVisible()
      
      // Check for descriptive help text
      await expect(page.locator('text=Email me when a new lead is created')).toBeVisible()
      await expect(page.locator('text=Comma-separated list')).toBeVisible()
    })
  })

  test.describe('⚡ PERFORMANCE & UX TESTING', () => {
    
    test('Settings page load performance', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('http://localhost:3002/app/settings')
      await expect(page.locator('h1')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      
      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000)
    })

    test('Form submission responsiveness', async ({ page }) => {
      await page.goto('http://localhost:3002/app/settings')
      
      // Enable notifications
      await page.locator('#emailNotifications').check()
      
      const startTime = Date.now()
      
      // Submit form
      await page.locator('button:has-text("Save Changes")').click()
      
      // Wait for success message
      await expect(page.locator('.text-green-700')).toBeVisible()
      
      const responseTime = Date.now() - startTime
      
      // Should respond within 3 seconds
      expect(responseTime).toBeLessThan(3000)
    })

    test('Test notification button responsiveness', async ({ page }) => {
      await page.goto('http://localhost:3002/app/settings')
      
      await page.locator('#emailNotifications').check()
      
      const startTime = Date.now()
      
      // Click test button
      await page.locator('button:has-text("Send Test Email")').click()
      
      // Wait for loading state
      await expect(page.locator('button:has-text("Sending...")')).toBeVisible()
      
      // Wait for completion
      await expect(page.locator('.text-green-700')).toBeVisible()
      
      const totalTime = Date.now() - startTime
      
      // Should complete within 10 seconds
      expect(totalTime).toBeLessThan(10000)
    })
  })

  test.describe('🔄 ERROR HANDLING UX', () => {
    
    test('Network error handling', async ({ page }) => {
      await page.goto('http://localhost:3002/app/settings')
      
      // Enable notifications
      await page.locator('#emailNotifications').check()
      
      // Simulate network failure
      await page.route('**/api/settings', route => route.abort())
      
      // Try to save
      await page.locator('button:has-text("Save Changes")').click()
      
      // Should show error message
      await expect(page.locator('.text-red-700')).toBeVisible()
      await expect(page.locator('text=Something went wrong')).toBeVisible()
    })

    test('Invalid email error handling', async ({ page }) => {
      await page.goto('http://localhost:3002/app/settings')
      
      await page.locator('#emailNotifications').check()
      
      // Enter invalid email
      await page.locator('#additionalEmails').fill('invalid-email-format')
      
      // Try test notification
      await page.locator('button:has-text("Send Test Email")').click()
      
      // Should show validation error
      await expect(page.locator('.text-red-700')).toBeVisible()
    })

    test('SMTP configuration error handling', async ({ page }) => {
      await page.goto('http://localhost:3002/app/settings')
      
      await page.locator('#emailNotifications').check()
      
      // Mock SMTP error
      await page.route('**/api/notifications/test', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Email configuration error. Please check your SMTP settings.'
          })
        })
      })
      
      await page.locator('button:has-text("Send Test Email")').click()
      
      // Should show specific SMTP error
      await expect(page.locator('text=Email configuration error')).toBeVisible()
    })
  })

  test.describe('🔐 SECURITY UX TESTING', () => {
    
    test('Unauthorized access handling', async ({ page }) => {
      // Clear authentication
      await page.addInitScript(() => {
        window.localStorage.removeItem('test-session')
      })
      
      // Try to access settings
      await page.goto('http://localhost:3002/app/settings')
      
      // Should redirect to login or show unauthorized message
      await expect(page.locator('text=Unauthorized')).toBeVisible()
    })

    test('Session timeout handling', async ({ page }) => {
      await page.goto('http://localhost:3002/app/settings')
      
      // Simulate session timeout
      await page.route('**/api/settings', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        })
      })
      
      await page.locator('#emailNotifications').check()
      await page.locator('button:has-text("Save Changes")').click()
      
      // Should handle session timeout gracefully
      await expect(page.locator('.text-red-700')).toBeVisible()
    })
  })
})