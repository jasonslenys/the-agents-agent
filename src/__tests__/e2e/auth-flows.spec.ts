import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
  });

  test('TC1.1: User can register with valid email/password', async ({ page }) => {
    // Navigate to signup page
    await page.click('a[href="/signup"]');
    await expect(page).toHaveURL('/signup');

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="companyName"]', 'Test Company');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard on successful registration
    await expect(page).toHaveURL('/app/dashboard');
    
    // Verify user is logged in by checking for dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('TC1.2: User cannot register with duplicate email', async ({ page }) => {
    const email = 'duplicate@example.com';
    
    // First registration
    await page.click('a[href="/signup"]');
    await page.fill('input[name="name"]', 'First User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="companyName"]', 'First Company');
    await page.click('button[type="submit"]');

    // Logout
    await page.goto('/');
    
    // Attempt duplicate registration
    await page.click('a[href="/signup"]');
    await page.fill('input[name="name"]', 'Second User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="companyName"]', 'Second Company');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text*=email is already registered')).toBeVisible();
  });

  test('TC1.3: User can login with correct credentials', async ({ page }) => {
    const email = `login${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    // Register user first
    await page.goto('/signup');
    await page.fill('input[name="name"]', 'Login Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="companyName"]', 'Login Test Company');
    await page.click('button[type="submit"]');
    
    // Logout
    await page.locator('button:has-text("Sign out")').click();
    await expect(page).toHaveURL('/');

    // Login with credentials
    await page.click('a[href="/login"]');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Should be redirected to dashboard
    await expect(page).toHaveURL('/app/dashboard');
    await expect(page.locator('text=Login Test User')).toBeVisible();
  });

  test('TC1.4: User cannot login with incorrect credentials', async ({ page }) => {
    await page.click('a[href="/login"]');
    
    // Fill with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text*=Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('TC1.5: User session persists across page refreshes', async ({ page }) => {
    const email = `persist${Date.now()}@example.com`;
    
    // Register and login
    await page.goto('/signup');
    await page.fill('input[name="name"]', 'Persist User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="companyName"]', 'Persist Company');
    await page.click('button[type="submit"]');

    // Verify logged in
    await expect(page).toHaveURL('/app/dashboard');

    // Refresh page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL('/app/dashboard');
    await expect(page.locator('text=Persist User')).toBeVisible();
  });

  test('TC1.6: User can logout and session is invalidated', async ({ page }) => {
    const email = `logout${Date.now()}@example.com`;
    
    // Register user
    await page.goto('/signup');
    await page.fill('input[name="name"]', 'Logout User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="companyName"]', 'Logout Company');
    await page.click('button[type="submit"]');

    // Verify logged in
    await expect(page).toHaveURL('/app/dashboard');

    // Logout
    await page.locator('button:has-text("Sign out")').click();

    // Should be redirected to homepage
    await expect(page).toHaveURL('/');

    // Try to access protected page directly
    await page.goto('/app/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('TC1.9: Protected routes redirect to login when unauthenticated', async ({ page }) => {
    // Try to access protected routes without authentication
    const protectedRoutes = [
      '/app/dashboard',
      '/app/leads',
      '/app/conversations',
      '/app/widgets',
      '/app/settings'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    }
  });
});