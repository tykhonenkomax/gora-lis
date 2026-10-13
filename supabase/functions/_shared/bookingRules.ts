import type { PriceQuote } from './pricing.ts'

export const MIN_NIGHTS = 2
export const CHAN_PRICE = 2000
export const HOUSE_PRICING = {
  zrub: { name: 'Atmosfera', guests: 6, includedGuests: 4 },
  panorama: { name: 'Panorama', guests: 4, includedGuests: 4 },
} as const

export function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}

export function stayNights(start: string, end: string): number {
  return (Date.parse(end) - Date.parse(start)) / 86400000
}

export function earliestCheckout(start: string): string {
  if (!validDate(start)) return ''
  return new Date(Date.parse(start) + MIN_NIGHTS * 86400000).toISOString().slice(0, 10)
}

export function kyivToday(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Kyiv' }).format(new Date())
}

export function validateStay(start: string, end: string, today = kyivToday()): string {
  if (!validDate(start) || !validDate(end)) return 'Оберіть дати заїзду та виїзду.'
  if (start < today) return 'Дата заїзду не може бути в минулому.'
  const nights = stayNights(start, end)
  if (nights < MIN_NIGHTS) return 'Мінімальне бронювання — 2 ночі.'
  if (nights > 366) return 'Оберіть період не довший за рік.'
  return ''
}

export type BookingRequest = {
  house: keyof typeof HOUSE_PRICING
  checkIn: string
  checkOut: string
  guests: number
  withChan: boolean
  name: string
  phone: string
}

export function parseRequest(value: unknown, today = kyivToday()): BookingRequest {
  if (!value || typeof value !== 'object') throw new Error('Перевірте дані заявки.')
  const body = value as Record<string, unknown>
  if (body.house !== 'zrub' && body.house !== 'panorama') throw new Error('Оберіть будинок.')
  if (typeof body.checkIn !== 'string' || typeof body.checkOut !== 'string') throw new Error('Оберіть дати.')
  const invalid = validateStay(body.checkIn, body.checkOut, today)
  if (invalid) throw new Error(invalid)
  if (typeof body.guests !== 'number' || !Number.isInteger(body.guests) || body.guests < 1 || body.guests > HOUSE_PRICING[body.house].guests) throw new Error('Перевірте кількість гостей.')
  if (typeof body.withChan !== 'boolean') throw new Error('Вкажіть, чи потрібен чан.')
  if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 100 || [...body.name].some(char => char.charCodeAt(0) < 32)) throw new Error('Вкажіть ім’я (2–100 символів).')
  if (typeof body.phone !== 'string' || body.phone.length > 30 || [...body.phone].some(char => char.charCodeAt(0) < 32) || !/^\+?[\d ()-]+$/.test(body.phone)) throw new Error('Вкажіть коректний номер телефону.')
  const digits = body.phone.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 15) throw new Error('Вкажіть коректний номер телефону.')
  return { house: body.house, checkIn: body.checkIn, checkOut: body.checkOut, guests: body.guests, withChan: body.withChan, name: body.name.trim(), phone: body.phone.trim() }
}

export function requestMessage(request: BookingRequest, id: string, quote: PriceQuote): string {
  return [
    `🏡 Нова заявка · ${HOUSE_PRICING[request.house].name}`,
    `📅 Заїзд: ${request.checkIn} (з 15:00)`,
    `📅 Виїзд: ${request.checkOut} (до 12:00)`,
    `🌙 Ночей: ${stayNights(request.checkIn, request.checkOut)} · Гостей: ${request.guests}`,
    `👤 ${request.name}`, `📞 ${request.phone}`, `🛁 Чан: ${request.withChan ? 'так' : 'ні'}`,
    `💰 Проживання: ${quote.accommodation.toLocaleString('uk-UA')} грн`,
    ...(quote.chan ? [`Чан: ${quote.chan.toLocaleString('uk-UA')} грн`] : []),
    `Разом орієнтовно: ${quote.total.toLocaleString('uk-UA')} грн`,
    '', 'Очікує підтвердження власником. Дати ще не заблоковано.', `Номер заявки: ${id}`,
  ].join('\n')
}
