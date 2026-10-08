import { createClient } from '@supabase/supabase-js'
import type { House } from './site'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const bookingClient = url && key ? createClient(url, key) : null

export type Reservation = {
  id: string
  house_slug: House['slug']
  check_in: string
  check_out: string
  status: 'confirmed' | 'tentative'
}

export function bookingError(code?: string): string {
  if (code === '23P01') return 'Ці дати вже зайняті. Оновіть календар і виберіть інший період.'
  if (code === '42501' || code === 'PGRST301') return 'Немає доступу. Увійдіть повторно під акаунтом власника.'
  return 'Не вдалося зберегти зміну. Перевірте інтернет і оновіть список, перш ніж повторювати.'
}
