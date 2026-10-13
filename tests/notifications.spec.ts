import { test, expect } from '@playwright/test'
import { createBookingHandler, type BookingDependencies, type Channel } from '../supabase/functions/_shared/bookingHandler'
import { parseRequest, requestTotal, requestMessage } from '../supabase/functions/_shared/bookingRules'

const payload = { house: 'zrub', checkIn: '2090-05-10', checkOut: '2090-05-12', guests: 5, withChan: true, name: 'Олена', phone: '0967773015' }
const requestId = '11111111-1111-4111-8111-111111111111'
const origin = 'https://tykhonenkomax.github.io'
const request = (changes = {}, source = origin) => new Request('https://example.test/submit-booking', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: source }, body: JSON.stringify({ ...payload, requestId, ...changes }),
})

function setup() {
  const sent: Channel[] = []
  const marked = { telegram_sent: false, email_sent: false }
  const deps: BookingDependencies = {
    origins: [origin], ready: () => true,
    claim: async () => ({ ...marked }),
    send: async channel => { sent.push(channel) },
    markSent: async (_id, channel) => { marked[`${channel}_sent`] = true },
    release: async () => {},
  }
  return { deps, marked, sent }
}

test('server recalculates price and formats plain-text request', () => {
  const valid = parseRequest({ ...payload, total: 1, nightlyPrice: 1 })
  expect(requestTotal(valid)).toBe(11000)
  expect(requestMessage(valid, requestId)).toContain('Ночей: 2 · Гостей: 5')
  expect(requestMessage(valid, requestId)).toContain(requestId)
  expect(() => parseRequest({ ...payload, guests: 7 })).toThrow()
  expect(() => parseRequest({ ...payload, name: 'Олена\nНова ціна: 1' })).toThrow()
  expect(() => parseRequest({ ...payload, phone: '0967773015\n' })).toThrow()
  expect(() => parseRequest({ ...payload, house: '__proto__' })).toThrow()
})

test('one night rejected before storage or delivery', async () => {
  const { deps, sent } = setup()
  let claimed = false
  deps.claim = async () => { claimed = true; return { telegram_sent: false, email_sent: false } }
  const response = await createBookingHandler(deps)(request({ checkOut: '2090-05-11' }))
  expect(response.status).toBe(400)
  expect((await response.json()).error).toContain('2 ночі')
  expect(claimed).toBe(false)
  expect(sent).toEqual([])
})

test('success requires both providers and repeated request does not send twice', async () => {
  const { deps, sent, marked } = setup()
  const handler = createBookingHandler(deps)
  const response = await handler(request())
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ ok: true, requestId, total: 11000 })
  expect(marked).toEqual({ telegram_sent: true, email_sent: true })
  expect((await handler(request())).status).toBe(200)
  expect(sent.sort()).toEqual(['email', 'telegram'])
})

test('partial failure retries only the undelivered channel', async () => {
  const { deps, marked } = setup()
  let telegramCount = 0
  let emailCount = 0
  deps.send = async channel => {
    if (channel === 'telegram') telegramCount++
    else { emailCount++; if (emailCount === 1) throw new Error('SMTP offline') }
  }
  const handler = createBookingHandler(deps)
  expect((await handler(request())).status).toBe(503)
  expect(marked).toEqual({ telegram_sent: true, email_sent: false })
  expect((await handler(request())).status).toBe(200)
  expect(telegramCount).toBe(1)
  expect(emailCount).toBe(2)
})

test('unknown origins, missing configuration and occupied dates never send', async () => {
  const { deps, sent } = setup()
  expect((await createBookingHandler(deps)(request({}, 'https://other.test'))).status).toBe(403)
  deps.ready = () => false
  expect((await createBookingHandler(deps)(request())).status).toBe(503)
  deps.ready = () => true
  deps.claim = async () => ({ error: 'occupied', telegram_sent: false, email_sent: false })
  expect((await createBookingHandler(deps)(request())).status).toBe(409)
  expect(sent).toEqual([])
})

test('rate limits and active processing return actionable responses', async () => {
  const { deps, sent } = setup()
  deps.claim = async () => ({ error: 'rate_limit', telegram_sent: false, email_sent: false })
  expect((await createBookingHandler(deps)(request())).status).toBe(429)
  deps.claim = async () => ({ error: 'processing', telegram_sent: false, email_sent: false })
  const result = await createBookingHandler(deps)(request())
  expect(result.status).toBe(409)
  expect((await result.json()).error).toContain('обробляється')
  expect(sent).toEqual([])
})

test('form retries same request after server error and only then shows success', async ({ page }) => {
  const requests: Record<string, unknown>[] = []
  await page.route('https://booking-test.invalid/**', async route => {
    if (route.request().url().includes('/functions/v1/submit-booking')) {
      const body = route.request().postDataJSON()
      requests.push(body)
      await route.fulfill(requests.length === 1
        ? { status: 503, json: { error: 'Пошта тимчасово недоступна. Повторіть спробу.' } }
        : { status: 200, json: { ok: true, requestId: body.requestId, total: 11000 } })
    } else await route.fulfill({ json: [] })
  })
  await page.goto('zrub?s=booking')
  const form = page.locator('.booking__form')
  await form.getByLabel('Заїзд', { exact: true }).fill(payload.checkIn)
  await form.getByLabel('Виїзд', { exact: true }).fill(payload.checkOut)
  await form.getByRole('combobox', { name: 'Гостей', exact: true }).selectOption('5')
  await form.getByLabel('Чан', { exact: false }).check()
  await form.getByLabel('Імʼя', { exact: true }).fill(payload.name)
  await form.getByLabel('Телефон', { exact: true }).fill(payload.phone)
  await form.getByRole('button', { name: 'Надіслати заявку' }).click()
  await expect(form.getByRole('alert')).toContainText('Пошта тимчасово недоступна')
  await expect(page.getByText('Заявку надіслано!', { exact: true })).toHaveCount(0)
  await form.getByRole('button', { name: 'Надіслати заявку' }).click()
  await expect(page.getByText('Заявку надіслано!', { exact: true })).toBeVisible()
  expect(requests[0].requestId).toBe(requests[1].requestId)
  expect(requests[0]).not.toHaveProperty('total')
})

test('contacts and house-specific FAQs show the agreed information', async ({ page }) => {
  await page.route('https://booking-test.invalid/**', route => route.fulfill({ json: [] }))
  await page.goto('panorama')
  await expect(page.locator('.faq').getByText('Чи буде світло під час відключень?')).toHaveCount(0)
  await page.locator('.faq').getByText('О котрій заїзд і виїзд?').click()
  await expect(page.locator('.faq').getByText('Заселення — з 15:00, виселення — до 12:00.')).toBeVisible()
  await expect(page.locator('a[href="mailto:GoraLis@ukr.net"]')).toHaveCount(1)
  await page.goto('zrub')
  await expect(page.locator('.faq').getByText('Чи буде світло під час відключень?')).toHaveCount(1)
  await expect(page.getByText('Камін з розведенням теплого повітря по всіх приміщеннях', { exact: true })).toHaveCount(1)
})

test('home form follows calendar house selection, preserves dates and sends the chosen house', async ({ page }) => {
  const requests: Record<string, unknown>[] = []
  await page.route('https://booking-test.invalid/**', async route => {
    if (route.request().url().includes('/functions/v1/submit-booking')) {
      const body = route.request().postDataJSON()
      requests.push(body)
      await route.fulfill({ json: { ok: true, requestId: body.requestId, total: 6000 } })
    } else await route.fulfill({ json: [] })
  })
  await page.goto('?s=booking')
  const calendar = page.locator('#availability')
  const form = calendar.locator('.booking__form')
  await expect(form).toHaveCount(1)
  await form.getByLabel('Заїзд', { exact: true }).fill(payload.checkIn)
  await form.getByLabel('Виїзд', { exact: true }).fill(payload.checkOut)
  await form.getByLabel('Імʼя', { exact: true }).fill(payload.name)
  await form.getByLabel('Телефон', { exact: true }).fill(payload.phone)
  await calendar.getByRole('button', { name: 'Panorama', exact: true }).click()
  await expect(form.getByRole('combobox', { name: 'Будинок', exact: true })).toHaveValue('panorama')
  await expect(form.getByLabel('Заїзд', { exact: true })).toHaveValue(payload.checkIn)
  await expect(form.getByLabel('Імʼя', { exact: true })).toHaveValue(payload.name)
  await form.getByRole('combobox', { name: 'Будинок', exact: true }).selectOption('zrub')
  await expect(calendar.getByRole('button', { name: 'Atmosfera', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await form.getByRole('combobox', { name: 'Будинок', exact: true }).selectOption('panorama')
  await form.getByRole('button', { name: 'Надіслати заявку' }).click()
  await expect(calendar.getByText('Заявку надіслано!', { exact: true })).toBeVisible()
  expect(requests).toHaveLength(1)
  expect(requests[0].house).toBe('panorama')
  await calendar.getByRole('button', { name: 'Atmosfera', exact: true }).click()
  await expect(calendar.locator('.booking__done pre')).toContainText('Заявка: Panorama')
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.evaluate(() => window.innerWidth))
})
