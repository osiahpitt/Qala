import { test, expect } from '@playwright/test'

test.describe('QALA E2E Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/')

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Qala|Next.js/)

    // Verify the page loads without any console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })

  test('page structure is present', async ({ page }) => {
    await page.goto('/')

    // Check for basic HTML structure
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Check that the page has loaded successfully
    const html = page.locator('html')
    await expect(html).toBeVisible()
  })

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Verify the page is still accessible on mobile
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('page can handle browser navigation', async ({ page }) => {
    await page.goto('/')

    // Test back/forward navigation
    await page.goBack()
    await page.goForward()

    // Verify page is still functional
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})