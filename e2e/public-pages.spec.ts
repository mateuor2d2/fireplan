// e2e/public-pages.spec.ts
// Smoke test: all public pages load and render content
// Note: /pricing has its own dedicated spec (pricing.spec.ts)
import { test, expect } from '@playwright/test'

const publicPages = [
  { path: '/', waitFor: 'body' },
  { path: '/login', waitFor: 'form' },
  { path: '/signup', waitFor: 'form' },
  { path: '/about', waitFor: 'body' },
  { path: '/contact', waitFor: 'body' },
]

for (const { path, waitFor } of publicPages) {
  test(`${path || '/'} loads and renders`, async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    const response = await page.goto(path)
    expect(response?.status()).toBe(200)

    if (waitFor === 'body') {
      await page.waitForSelector('body', { timeout: 15000 })
      await page.waitForTimeout(3000)
      const bodyText = await page.locator('body').innerText()
      expect(bodyText.length).toBeGreaterThan(0)
    } else {
      await page.waitForSelector(waitFor, { timeout: 15000 })
    }

    await page.waitForTimeout(500)

    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR_CONNECTION_REFUSED') &&
      !e.includes('404') &&
      !e.includes('Unrecognized content')
    )

    if (criticalErrors.length > 0) {
      console.log(`Critical errors on ${path}:`, criticalErrors)
    }
    expect(criticalErrors).toEqual([])
  })
}
