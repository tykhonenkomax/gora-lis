import { validateStay } from '../../supabase/functions/_shared/bookingRules'
export { earliestCheckout, MIN_NIGHTS } from '../../supabase/functions/_shared/bookingRules'
// Дати — календарні дні, без перетворення локального часу на UTC.
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const todayKey = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Kyiv' }).format(new Date())
export const parseDay = (day: string) => new Date(`${day}T12:00:00`)
export const formatDay = (day: string) => parseDay(day).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
export const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1, 12)
export const shiftMonth = (date: Date, offset: number) => new Date(date.getFullYear(), date.getMonth() + offset, 1, 12)

export function validDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(parseDay(day).getTime()) && dateKey(parseDay(day)) === day
}

export function rangeError(start: string, end: string, today = todayKey()): string {
  return validateStay(start, end, today)
}

export function overlaps(start: string, end: string, otherStart: string, otherEnd: string): boolean {
  return start < otherEnd && end > otherStart
}

export function nightsBetween(start: string, end: string): string[] {
  const result: string[] = []
  const day = parseDay(start)
  while (dateKey(day) < end) {
    result.push(dateKey(day))
    day.setDate(day.getDate() + 1)
  }
  return result
}
