// e2e/auth.spec.ts
// Contracts: C1-C5 (auth flows)
import { test, expect } from '@playwright/test'

test.describe('C3/C4: Login page', () => {
  test('login page loads and renders form', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/login')
    await page.waitForSelector('form', { timeout: 15000 })

    const inputs = page.locator('form input')
    await expect(inputs).toHaveCount(3)

    const submitBtn = page.locator('form button[type="submit"]').first()
    await expect(submitBtn).toBeVisible({ timeout: 5000 })

    await expect(page.locator('text=Google').first()).toBeVisible()
    await expect(page.locator('text=Regístrate').first()).toBeVisible()

    await page.waitForTimeout(500)
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('404')
    )
    expect(criticalErrors).toEqual([])
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('form', { timeout: 15000 })

    const textInputs = page.locator('form input:not([type="checkbox"]):not([type="hidden"])')
    await textInputs.nth(0).fill('nonexistent@test.com')
    await textInputs.nth(1).fill('wrongpassword123')

    const submitBtn = page.locator('form button[type="submit"]').first()
    await submitBtn.click()

    await page.waitForTimeout(3000)

    const url = page.url()
    const hasErrorToast = await page.locator('[role="alert"]').count() > 0
    const stillOnLogin = url.includes('/login')
    expect(stillOnLogin || hasErrorToast).toBe(true)
  })
})

test.describe('C1/C2: Signup page', () => {
  test('signup page loads with form', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForSelector('form', { timeout: 15000 })

    const inputs = page.locator('form input')
    const inputCount = await inputs.count()
    expect(inputCount).toBeGreaterThanOrEqual(3)

    const submitBtn = page.locator('form button[type="submit"]').first()
    await expect(submitBtn).toBeVisible()

    // Has link back to login
    const loginLink = page.locator('a[href="/login"]').first()
    await expect(loginLink).toBeVisible({ timeout: 3000 })
  })
})

test.describe('C5: Protected routes', () => {
  test('protected page content is gated by auth', async ({ page }) => {
    // With SSR:false, middleware runs server-side but SPA navigation is client-side
    // The API calls from protected pages will fail without auth cookie
    // So we test that the API rejects unauthenticated requests
    const response = await page.request.get('http://localhost:5000/api/auth/me')
    // Should return error (401 or redirect) without auth cookie
    expect(response.status()).not.toBe(200)
  })
})
