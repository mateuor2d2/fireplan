// e2e/pricing.spec.ts
// Contracts: Plan visibility and pricing structure
import { test, expect } from '@playwright/test'

test.describe('Pricing page', () => {
  test('pricing page shows all three plans', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForSelector('text=Starter', { timeout: 10000 })
    await expect(page.locator('text=Profesional').first()).toBeVisible()
    await expect(page.locator('text=Empresa').first()).toBeVisible()
  })

  test('shows correct price indicators', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForSelector('text=Starter', { timeout: 10000 })

    // Professional: 79 (monthly or yearly)
    const has79 = await page.locator('text=79').count()
    expect(has79).toBeGreaterThan(0)

    // Enterprise: 179
    const has179 = await page.locator('text=179').count()
    expect(has179).toBeGreaterThan(0)

    // Starter is free (look for "Empezar Gratis" button or "Gratis" text)
    const freeIndicators = await page.locator('text=/Empezar Gratis|0 €|Gratis/i').count()
    expect(freeIndicators).toBeGreaterThan(0)
  })

  test('page loads without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/pricing')
    await page.waitForTimeout(1000)

    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR')
    )
    expect(criticalErrors).toEqual([])
  })
})
