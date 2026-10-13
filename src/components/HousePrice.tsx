import { usePricing } from '../data/pricing'
import { todayKey } from '../data/bookingDates'
import { nightPrice } from '../../supabase/functions/_shared/pricing'
import type { House } from '../data/site'

export function HousePrice({ house }: { house: House }) {
  const pricing = usePricing()
  if (!pricing.data) return <span>{pricing.loading ? 'Завантажуємо ціну…' : 'Ціну уточнюйте телефоном'}</span>
  return <span>від <b>{nightPrice(pricing.data, house.slug, todayKey()).toLocaleString('uk-UA')} грн</b> / ніч</span>
}
