import { test, expect, type Page } from '@playwright/test'
import { dateKey, shiftMonth, monthStart, parseDay, todayKey } from '../src/data/bookingDates'

const next = dateKey(shiftMonth(monthStart(parseDay(todayKey())), 1)).slice(0, 7)
const start = `${next}-05`
const end = `${next}-07`
const id = '11111111-1111-4111-8111-111111111111'
const user = { id, email: 'admin@owners.gora-lis.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }
const jwt = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`

async function mockBackend(page: Page, options: { denied?: boolean; unavailable?: boolean; conflict?: boolean } = {}) {
  let rows: { id: string; house_slug: string; check_in: string; check_out: string; status: string }[] = []
  await page.route('https://booking-test.invalid/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const json = (body: unknown, status = 200) => route.fulfill({ status, json: body })
    if (url.pathname.includes('/auth/v1/token')) {
      expect(request.postDataJSON().email).toBe(user.email)
      return json({ access_token: jwt, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user })
    }
    if (url.pathname.includes('/auth/v1/user')) return json(user)
    if (url.pathname.includes('/auth/v1/logout')) return json({})
    if (url.pathname.endsWith('/booking_admins')) return json(options.denied ? null : { user_id: id })
    if (url.pathname.endsWith('/rpc/occupied_nights')) {
      if (options.unavailable) return json({ message: 'Offline', code: '503' }, 503)
      const body = request.postDataJSON()
      return json(body.p_house === 'zrub' ? [{ night: body.p_from.slice(0, 7) + '-15', status: 'confirmed' }, { night: body.p_from.slice(0, 7) + '-16', status: 'tentative' }] : [])
    }
    if (url.pathname.endsWith('/reservations')) {
      if (request.method() === 'POST') {
        if (options.conflict) return json({ code: '23P01', message: 'Conflicting reservation' }, 409)
        rows.push({ ...request.postDataJSON(), id: `reservation-${rows.length + 1}` })
        return route.fulfill({ status: 201, body: '' })
      }
      if (request.method() === 'DELETE') {
        const removed = rows.filter(row => `eq.${row.id}` === url.searchParams.get('id'))
        rows = rows.filter(row => `eq.${row.id}` !== url.searchParams.get('id'))
        return json(removed.map(row => ({ id: row.id })))
      }
      if (request.method() === 'PATCH') {
        const updated = rows.filter(row => `eq.${row.id}` === url.searchParams.get('id'))
        updated.forEach(row => { row.status = request.postDataJSON().status })
        return json(updated.map(row => ({ id: row.id })))
      }
      return json(rows)
    }
    return json({ message: 'Unexpected request' }, 400)
  })
}

async function login(page: Page) {
  await page.goto('admin')
  await page.getByLabel('Логін', { exact: true }).fill('admin')
  await page.getByLabel('Пароль', { exact: true }).fill('test-password')
  await page.getByRole('button', { name: 'Увійти', exact: true }).click()
}

test('public calendar separates houses and never marks failed data as free', async ({ page }) => {
  await mockBackend(page)
  await page.goto('?s=availability')
  const calendar = page.locator('#availability')
  await expect(calendar.locator('.booking-calendar')).toHaveCount(3)
  await expect(calendar.locator('.is-busy')).toHaveCount(3)
  await expect(calendar.locator('.is-tentative')).toHaveCount(3)
  const originalMonth = await calendar.locator('h3').first().textContent()
  await calendar.getByRole('button', { name: 'Наступні три місяці' }).click()
  await expect(calendar.locator('h3').first()).not.toHaveText(originalMonth!)
  await expect(calendar.locator('.is-tentative')).toHaveCount(3)
  await calendar.getByRole('button', { name: 'Panorama', exact: true }).click()
  await expect(calendar.locator('.is-unknown')).toHaveCount(0)
  await expect(calendar.locator('.is-busy')).toHaveCount(0)
  await expect(calendar.locator('.is-tentative')).toHaveCount(0)
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.evaluate(() => window.innerWidth))
})

test('failed calendar request displays unknown dates and retry', async ({ page }) => {
  await mockBackend(page, { unavailable: true })
  await page.goto('?s=availability')
  await expect(page.getByText('Не вдалося завантажити зайнятість.', { exact: false })).toBeVisible()
  await expect(page.locator('#availability .is-unknown').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Спробувати ще раз' })).toBeVisible()
})

test('owner adds a stay, checkout remains free, then cancels it', async ({ page }) => {
  await mockBackend(page)
  await login(page)
  await expect(page.getByText('Майбутніх бронювань поки немає.')).toBeVisible()
  await page.getByLabel('Заїзд', { exact: true }).fill(start)
  await page.getByLabel('Виїзд', { exact: true }).fill(end)
  await page.getByRole('button', { name: 'Позначити зайнятими' }).click()
  await expect(page.getByText('Збережено!', { exact: false })).toBeVisible()
  await expect(page.locator('.booking-calendar .is-busy')).toHaveCount(2)
  await page.getByRole('button', { name: 'Panorama', exact: true }).click()
  await expect(page.getByText('Майбутніх бронювань поки немає.')).toBeVisible()
  await expect(page.locator('.booking-calendar .is-busy')).toHaveCount(0)
  await page.getByRole('button', { name: 'Atmosfera', exact: true }).click()
  await page.getByRole('button', { name: 'Скасувати бронювання', exact: true }).click()
  await page.getByRole('button', { name: 'Так, скасувати', exact: true }).click()
  await expect(page.getByText('Бронювання скасовано. Дати знову вільні.')).toBeVisible()
  await expect(page.locator('.booking-calendar .is-busy')).toHaveCount(0)
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.evaluate(() => window.innerWidth))
})

test('server-side overlap rejection shows error without success', async ({ page }) => {
  await mockBackend(page, { conflict: true })
  await login(page)
  await page.getByLabel('Заїзд', { exact: true }).fill(start)
  await page.getByLabel('Виїзд', { exact: true }).fill(end)
  await page.getByRole('button', { name: 'Позначити зайнятими' }).click()
  await expect(page.getByRole('alert')).toContainText('Ці дати вже зайняті')
  await expect(page.locator('.admin-panel__success')).toHaveCount(0)
})

test('authenticated non-owner cannot see management controls', async ({ page }) => {
  await mockBackend(page, { denied: true })
  await login(page)
  await expect(page.getByText('Цей акаунт не має доступу власника.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Позначити зайнятими' })).toHaveCount(0)
})

test('owner can mark tentative dates then confirm them without deleting the stay', async ({ page }) => {
  await mockBackend(page)
  await login(page)
  await page.getByLabel('Заїзд', { exact: true }).fill(start)
  await page.getByLabel('Виїзд', { exact: true }).fill(end)
  await page.getByRole('radio', { name: 'Попереднє' }).check()
  await page.getByRole('button', { name: 'Позначити попереднє' }).click()
  await expect(page.locator('.booking-calendar .is-tentative')).toHaveCount(2)
  await expect(page.locator('.booking-calendar .is-busy')).toHaveCount(0)
  await page.getByRole('button', { name: 'Підтвердити ❤️', exact: true }).click()
  await expect(page.getByText('Бронювання підтверджено ❤️', { exact: true })).toBeVisible()
  await expect(page.locator('.booking-calendar .is-tentative')).toHaveCount(0)
  await expect(page.locator('.booking-calendar .is-busy')).toHaveCount(2)
})
