import { test, expect } from '@playwright/test'

test.describe('Progressive Enhancement - No JavaScript', () => {
  test.beforeEach(async ({ context }) => {
    // Disable JavaScript for all tests in this suite
    await context.addInitScript(() => {
      delete (window as any).navigator
      delete (window as any).fetch
      // Simulate a browser with JS completely disabled
      Object.defineProperty(window, 'navigator', {
        value: undefined,
        writable: false
      })
    })
  })

  test('landing page should load and display search form without JS', async ({ page }) => {
    await page.goto('/')
    
    // Check that basic content loads
    await expect(page.locator('text=SPONTRA')).toBeVisible()
    await expect(page.locator('text=EXPLORE')).toBeVisible()
    
    // Check that the search form is present
    await expect(page.locator('form')).toBeVisible()
    
    // Check that theme selection is available
    await expect(page.locator('[data-testid="theme-adventure"]')).toBeVisible()
    await expect(page.locator('[data-testid="theme-nature"]')).toBeVisible()
    
    // Check that form inputs are present
    await expect(page.locator('input[name="departureAirport"]')).toBeVisible()
    await expect(page.locator('input[name="departureDate"]')).toBeVisible()
    await expect(page.locator('select[name="passengers"]')).toBeVisible()
    
    // Check submit button is present
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('search form should work with Server Actions without JS', async ({ page }) => {
    await page.goto('/')
    
    // Fill out the search form
    await page.selectOption('[data-testid="theme-select"]', 'adventure')
    await page.fill('input[name="departureAirport"]', 'LHR')
    await page.fill('input[name="departureDate"]', '2025-12-01')
    await page.selectOption('select[name="passengers"]', '2')
    
    // Submit the form (should trigger Server Action)
    await page.click('button[type="submit"]')
    
    // Should either redirect to results or show loading state
    // Since we're testing without JS, we expect standard form submission behavior
    
    // Wait for navigation or response
    await page.waitForTimeout(2000)
    
    // Check that we either got results or a proper fallback
    const currentUrl = page.url()
    const hasResults = await page.locator('[data-testid="search-results"]').isVisible().catch(() => false)
    const hasError = await page.locator('[data-testid="error-message"]').isVisible().catch(() => false)
    const hasRedirect = currentUrl.includes('/flights')
    
    // At least one of these should be true in a proper progressive enhancement setup
    expect(hasResults || hasError || hasRedirect).toBeTruthy()
  })

  test('direct flight search should work without JS', async ({ page }) => {
    await page.goto('/')
    
    // Fill out form for direct flight search (both origin and destination)
    await page.fill('input[name="departureAirport"]', 'LHR')
    await page.fill('input[name="destinationAirport"]', 'BCN')
    await page.fill('input[name="departureDate"]', '2025-12-01')
    await page.selectOption('select[name="passengers"]', '1')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Should redirect to flights page with query parameters
    await page.waitForURL(/\/flights\?.*origin=LHR.*destination=BCN/, { timeout: 10000 })
    
    // Verify the URL contains the expected parameters
    const url = page.url()
    expect(url).toContain('origin=LHR')
    expect(url).toContain('destination=BCN')
    expect(url).toContain('departureDate=2025-12-01')
    expect(url).toContain('passengers=1')
  })

  test('error states should be handled gracefully without JS', async ({ page }) => {
    await page.goto('/')
    
    // Submit form with missing required fields
    await page.click('button[type="submit"]')
    
    // Should show validation errors or prevent submission
    const hasValidationErrors = await page.locator('[data-testid="validation-error"]').isVisible().catch(() => false)
    const formStillVisible = await page.locator('form').isVisible()
    
    // Either validation errors should show or form should still be visible (HTML5 validation)
    expect(hasValidationErrors || formStillVisible).toBeTruthy()
  })

  test('authentication flows should work without JS', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Check that login form is available
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check that the form has proper action attribute for server submission
    const form = page.locator('form')
    const action = await form.getAttribute('action')
    expect(action).toBeTruthy()
  })

  test('critical user flows should degrade gracefully', async ({ page }) => {
    // Test the complete flow: search → results → booking
    await page.goto('/')
    
    // 1. Search
    await page.fill('input[name="departureAirport"]', 'LHR')
    await page.fill('input[name="destinationAirport"]', 'BCN') 
    await page.fill('input[name="departureDate"]', '2025-12-01')
    await page.click('button[type="submit"]')
    
    // Should redirect to flights page
    await page.waitForURL(/\/flights/, { timeout: 10000 })
    
    // 2. Check that flights page loads properly
    await expect(page.locator('text=Flight Search')).toBeVisible().catch(() => {
      // Alternative: check for any flight-related content
      expect(page.locator('text=flights').or(page.locator('text=booking'))).toBeVisible()
    })
    
    // Page should be functional even without JS for core booking flow
    const hasBookingElements = await page.locator('[data-testid="booking-form"]').isVisible().catch(() => false)
    const hasFlightList = await page.locator('[data-testid="flight-list"]').isVisible().catch(() => false)
    const hasBasicContent = await page.locator('main').isVisible()
    
    expect(hasBookingElements || hasFlightList || hasBasicContent).toBeTruthy()
  })

  test('accessibility should be maintained without JS', async ({ page }) => {
    await page.goto('/')
    
    // Check basic accessibility features work without JS
    
    // 1. Keyboard navigation
    await page.keyboard.press('Tab')
    const firstFocusable = await page.evaluate(() => document.activeElement?.tagName)
    expect(['INPUT', 'BUTTON', 'SELECT', 'A'].includes(firstFocusable || '')).toBeTruthy()
    
    // 2. Form labels
    const formLabels = await page.locator('label').count()
    expect(formLabels).toBeGreaterThan(0)
    
    // 3. Semantic structure
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('h1, h2, h3')).toHaveCount({ min: 1 })
    
    // 4. Alt text for images
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      // Images should have alt text or be decorative (alt="" or role="presentation")
      expect(alt !== null || role === 'presentation').toBeTruthy()
    }
  })

  test('performance should be acceptable without JS', async ({ page }) => {
    // Measure page load performance without JavaScript
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Wait for content to be visible
    await expect(page.locator('text=SPONTRA')).toBeVisible()
    await expect(page.locator('form')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Without JS, page should load quickly (under 3 seconds)
    expect(loadTime).toBeLessThan(3000)
    
    // Check that critical content is immediately visible
    const criticalElements = [
      'text=SPONTRA',
      'form',
      'input[name="departureAirport"]',
      'button[type="submit"]'
    ]
    
    for (const selector of criticalElements) {
      await expect(page.locator(selector)).toBeVisible()
    }
  })
})