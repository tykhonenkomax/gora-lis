import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://booking-test.invalid/**', route => route.fulfill({ json: [] }))
})

test('main pages and booking inputs fit narrow and wide viewports', async ({ page }, info) => {
  const widths = info.project.name === 'desktop' ? [1280] : [320, 390, 768]
  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 })
    for (const route of ['', 'zrub', 'panorama', 'nearby', 'admin']) {
      await page.goto(route || './')
      await expect(page.locator('main')).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
      expect(overflow, `${route || 'home'} at ${width}px`).toBe(false)
      if (route === '' || route === 'zrub' || route === 'panorama') {
        const outside = await page.locator('.booking__form').evaluate(form => {
          const box = form.getBoundingClientRect()
          return Array.from(form.querySelectorAll('input, select')).filter(input => {
            const bounds = input.getBoundingClientRect()
            return bounds.width > 0 && (bounds.left < box.left - 1 || bounds.right > box.right + 1)
          }).map(input => input.getAttribute('type') || input.tagName)
        })
        expect(outside, `${route || 'home'} fields at ${width}px`).toEqual([])
      }
    }
  }
})

test('short-screen menu scrolls, traps focus and restores navigation', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('./')
  const opener = page.getByRole('button', { name: 'Меню', exact: true })
  await opener.click()
  const menu = page.getByRole('dialog', { name: 'Навігація сайтом' })
  await expect(menu).toBeVisible()
  const close = menu.getByRole('button', { name: 'Закрити меню' })
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(menu.getByRole('link', { name: '096 777 30 15', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await menu.getByRole('link', { name: 'Контакти', exact: false }).click()
  await expect(menu).toBeHidden()
  await expect(page.locator('body')).not.toHaveClass(/lock/)
  await expect(page).toHaveURL(/s=contacts/)
  await opener.click()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(opener).toBeFocused()
})

test('mobile booking CTA opens the form and stays out of focused input area', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await page.locator('.callbar').getByRole('link', { name: 'Забронювати' }).click()
  await expect(page.getByRole('heading', { name: 'Залишити заявку', exact: true })).toBeInViewport()
  const phone = page.locator('.booking__form').getByLabel('Телефон', { exact: true })
  await phone.focus()
  await expect(page.locator('.callbar')).toHaveCSS('pointer-events', 'none')
  await phone.blur()
  await expect(page.locator('.callbar')).toHaveCSS('pointer-events', 'auto')
})

test('brand fonts load locally and mobile hero preserves the whole photograph', async ({ page }) => {
  const externalFonts: string[] = []
  page.on('request', request => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) externalFonts.push(request.url())
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await page.evaluate(() => Promise.all([
    document.fonts.load('500 24px "Lora Variable"', 'Gora&Lis Ґанок'),
    document.fonts.load('400 16px "Onest Variable"', 'Вільні дати'),
  ]))
  expect(await page.evaluate(() => document.fonts.check('500 24px "Lora Variable"', 'Gora&Lis Ґанок'))).toBe(true)
  expect(await page.evaluate(() => document.fonts.check('400 16px "Onest Variable"', 'Вільні дати'))).toBe(true)
  expect(externalFonts).toEqual([])
  const photo = page.locator('.slide--hero .slide__media')
  await photo.evaluate((image: HTMLImageElement) => image.decode())
  await expect(photo).toHaveCSS('object-fit', 'contain')
  const bounds = await photo.boundingBox()
  expect(bounds!.y).toBeGreaterThanOrEqual(68)
  expect(bounds!.width / bounds!.height).toBeCloseTo(1416 / 1111, 1)
})
