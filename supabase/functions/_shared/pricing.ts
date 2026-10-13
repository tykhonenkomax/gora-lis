import { CHAN_PRICE, stayNights, validDate, type BookingRequest } from './bookingRules.ts'

export type HousePrice = { house_slug: BookingRequest['house']; base_price: number; extra_guest_price: number }
export type SeasonPrice = { id: string; house_slug: BookingRequest['house']; name: string; starts_on: string; ends_on: string; nightly_price: number }
export type PricingSnapshot = { houses: HousePrice[]; seasons: SeasonPrice[] }
export type PriceQuote = { nights: { date: string; price: number }[]; accommodation: number; chan: number; total: number }

const validAmount = (amount: unknown, allowZero = false) => typeof amount === 'number' && Number.isInteger(amount) && amount >= (allowZero ? 0 : 1) && amount <= 1000000

export function parsePricing(value: unknown): PricingSnapshot {
  const data = value as PricingSnapshot | null
  if (!data || !Array.isArray(data.houses) || !Array.isArray(data.seasons)) throw new Error('Ціни недоступні.')
  if (data.houses.length !== 2 || !['zrub', 'panorama'].every(slug => data.houses.some(row => row.house_slug === slug))) throw new Error('Ціни недоступні.')
  if (data.houses.some(row => !validAmount(row.base_price) || !validAmount(row.extra_guest_price, true))) throw new Error('Ціни недоступні.')
  if (data.seasons.some(row => !['zrub', 'panorama'].includes(row.house_slug) || !validAmount(row.nightly_price) || !validDate(row.starts_on) || !validDate(row.ends_on) || row.ends_on < row.starts_on)) throw new Error('Ціни недоступні.')
  return data
}

export function nightPrice(snapshot: PricingSnapshot, slug: BookingRequest['house'], day: string, guests = 4): number {
  const base = snapshot.houses.find(row => row.house_slug === slug)
  if (!base) throw new Error('Ціни недоступні.')
  const seasons = snapshot.seasons.filter(row => row.house_slug === slug && row.starts_on <= day && row.ends_on >= day)
  if (seasons.length > 1) throw new Error('Сезонні тарифи перетинаються.')
  return (seasons[0]?.nightly_price ?? base.base_price) + Math.max(0, guests - 4) * base.extra_guest_price
}

export function quotePrice(snapshot: PricingSnapshot, request: Pick<BookingRequest, 'house' | 'checkIn' | 'checkOut' | 'guests' | 'withChan'>): PriceQuote {
  if (!validDate(request.checkIn) || !validDate(request.checkOut)) throw new Error('Оберіть дати.')
  const count = stayNights(request.checkIn, request.checkOut)
  if (count < 1 || count > 366) throw new Error('Перевірте дати.')
  const nights = Array.from({ length: count }, (_, offset) => {
    const date = new Date(Date.parse(request.checkIn) + offset * 86400000).toISOString().slice(0, 10)
    return { date, price: nightPrice(snapshot, request.house, date, request.guests) }
  })
  const accommodation = nights.reduce((sum, night) => sum + night.price, 0)
  const chan = request.withChan ? CHAN_PRICE : 0
  return { nights, accommodation, chan, total: accommodation + chan }
}
