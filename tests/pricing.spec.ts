import { test, expect } from '@playwright/test'
import { nightPrice, parsePricing, quotePrice } from '../supabase/functions/_shared/pricing'
import { parseRequest, requestMessage } from '../supabase/functions/_shared/bookingRules'
import { TEST_PRICING } from './pricing-fixture'

test('season boundaries, mixed nights, guest supplements and chan use one quote', () => {
  const rates = structuredClone(TEST_PRICING)
  rates.seasons.push({ id: 'season', house_slug: 'zrub', name: 'Свята', starts_on: '2090-05-11', ends_on: '2090-05-12', nightly_price: 6000 })
  const request = parseRequest({ house: 'zrub', checkIn: '2090-05-10', checkOut: '2090-05-14', guests: 6, withChan: true, name: 'Тест', phone: '0967773015' })
  const quote = quotePrice(rates, request)
  expect(quote.nights.map(night => night.price)).toEqual([5000, 7000, 7000, 5000])
  expect(quote.accommodation).toBe(24000)
  expect(quote.total).toBe(26000)
  expect(nightPrice(rates, 'panorama', '2090-05-11')).toBe(3000)
  expect(nightPrice(rates, 'zrub', '2090-05-13')).toBe(4000)
  expect(requestMessage(request, 'test-id', quote)).toContain(quote.total.toLocaleString('uk-UA'))
  rates.houses[0].base_price = 4500
  expect(quotePrice(rates, request).total).toBe(27000)
})

test('invalid or incomplete pricing never becomes a zero/free quote', () => {
  expect(() => parsePricing({ houses: [], seasons: [] })).toThrow()
  expect(() => parsePricing({ ...TEST_PRICING, houses: [{ house_slug: 'zrub', base_price: -1, extra_guest_price: 500 }, TEST_PRICING.houses[1]] })).toThrow()
  const rates = structuredClone(TEST_PRICING)
  const season = { id: 'one', house_slug: 'zrub' as const, name: 'Season', starts_on: '2090-05-10', ends_on: '2090-05-12', nightly_price: 6000 }
  rates.seasons = [season, { ...season, id: 'two' }]
  expect(() => nightPrice(rates, 'zrub', '2090-05-11')).toThrow()
})

test('owner edits base and season prices; public cards and booking form update without rebuild', async ({ page }) => {
  const rates = structuredClone(TEST_PRICING)
  const id = '11111111-1111-4111-8111-111111111111'
  const token = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`
  await page.route('https://booking-test.invalid/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname.endsWith('/rpc/get_pricing')) return route.fulfill({ json: rates })
    if (url.pathname.endsWith('/auth/v1/token')) return route.fulfill({ json: { access_token: token, refresh_token: 'test', token_type: 'bearer', expires_in: 3600, user: { id, aud: 'authenticated', role: 'authenticated', email: 'admin@owners.gora-lis.invalid', app_metadata: {}, user_metadata: {} } } })
    if (url.pathname.endsWith('/booking_admins')) return route.fulfill({ json: { user_id: id } })
    if (url.pathname.endsWith('/house_prices') && request.method() === 'PATCH') {
      Object.assign(rates.houses.find(row => `eq.${row.house_slug}` === url.searchParams.get('house_slug'))!, request.postDataJSON())
      return route.fulfill({ json: [{ house_slug: 'zrub' }] })
    }
    if (url.pathname.endsWith('/seasonal_prices')) {
      if (request.method() === 'POST') rates.seasons.push({ ...request.postDataJSON(), id })
      if (request.method() === 'PATCH') Object.assign(rates.seasons[0], request.postDataJSON())
      if (request.method() === 'DELETE') rates.seasons = []
      return route.fulfill({ json: [{ id }] })
    }
    return route.fulfill({ json: [] })
  })
  await page.goto('admin')
  await page.getByLabel('Логін', { exact: true }).fill('admin')
  await page.getByLabel('Пароль', { exact: true }).fill('test-password')
  await page.getByRole('button', { name: 'Увійти', exact: true }).click()
  await page.getByRole('button', { name: 'Ціни', exact: true }).click()
  await page.getByLabel('Ціна за ніч, грн', { exact: true }).fill('4500')
  await page.getByLabel('Доплата за гостя після 4-го, грн / ніч', { exact: true }).fill('650')
  await page.getByRole('button', { name: 'Зберегти звичайну ціну', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Звичайну ціну збережено')
  await page.getByLabel('Перша ніч сезону', { exact: true }).fill('2090-05-11')
  await page.getByLabel('Остання ніч сезону (включно)', { exact: true }).fill('2090-05-12')
  await page.getByLabel('Сезонна ціна за ніч, грн', { exact: true }).fill('6000')
  await page.getByRole('button', { name: 'Додати сезон', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Сезонний тариф збережено')
  await page.getByRole('button', { name: 'Редагувати', exact: true }).click()
  await page.getByLabel('Сезонна ціна за ніч, грн', { exact: true }).fill('6500')
  await page.getByRole('button', { name: 'Зберегти зміни сезону', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Сезонний тариф збережено')
  await page.getByRole('link', { name: 'На сайт', exact: true }).click()
  await expect(page.locator('a.house-card[href$="/zrub"] .house-card__foot')).toContainText('4 500 грн')
  const form = page.locator('.booking__form')
  await form.getByLabel('Заїзд', { exact: true }).fill('2090-05-10')
  await form.getByLabel('Виїзд', { exact: true }).fill('2090-05-13')
  await form.getByRole('combobox', { name: 'Гостей', exact: true }).selectOption('5')
  await expect(form.locator('.booking__total')).toContainText('19 450 грн')
  await expect(form.locator('.booking__total')).toContainText('1 ноч. × 5 150 грн')
  await expect(form.locator('.booking__total')).toContainText('2 ноч. × 7 150 грн')
  await page.goto('zrub')
  await expect(page.locator('.house-hero__price')).toContainText('4 500 грн')
  await expect(page.locator('.house-hero__surcharge')).toContainText('650 грн')
  await page.goto('admin')
  await page.getByRole('button', { name: 'Ціни', exact: true }).click()
  await page.getByRole('button', { name: 'Видалити', exact: true }).click()
  await page.getByRole('button', { name: 'Так, видалити', exact: true }).click()
  await expect(page.getByText('Сезонних тарифів немає — діє звичайна ціна.')).toBeVisible()
})

test('price fetch failure disables sending instead of silently using old hardcoded prices', async ({ page }) => {
  await page.route('https://booking-test.invalid/**', route => route.fulfill(route.request().url().endsWith('/rpc/get_pricing') ? { status: 503, json: { message: 'Offline' } } : { json: [] }))
  await page.goto('zrub?s=booking')
  await expect(page.locator('.booking__form').getByRole('button', { name: 'Надіслати заявку' })).toBeDisabled()
  await expect(page.locator('.house-hero__price')).toContainText('Ціну уточнюйте телефоном')
  await expect(page.locator('.booking__form').getByRole('status')).toContainText('Не вдалося завантажити ціни')
})
