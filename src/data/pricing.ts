import { useSyncExternalStore } from 'react'
import { bookingClient } from './bookingApi'
import { parsePricing, type PricingSnapshot } from '../../supabase/functions/_shared/pricing'

type State = { data: PricingSnapshot | null; error: string; loading: boolean }
let state: State = { data: null, error: '', loading: true }
let requestVersion = 0
const listeners = new Set<() => void>()
let stop: (() => void) | undefined
const getSnapshot = () => state
const publish = (next: State) => { state = next; listeners.forEach(listener => listener()) }

export async function refreshPricing(): Promise<void> {
  const version = ++requestVersion
  publish({ ...state, loading: true, error: '' })
  try {
    if (!bookingClient) throw new Error('Not configured')
    const { data, error } = await bookingClient.rpc('get_pricing')
    if (error) throw error
    const parsed = parsePricing(data)
    if (version === requestVersion) publish({ data: parsed, error: '', loading: false })
  } catch {
    if (version === requestVersion) publish({ data: null, error: 'Не вдалося завантажити ціни. Уточніть вартість телефоном або спробуйте ще раз.', loading: false })
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    void refreshPricing()
    const refresh = () => { if (!document.hidden) void refreshPricing() }
    const timer = window.setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    stop = () => { clearInterval(timer); window.removeEventListener('focus', refresh); requestVersion++ }
  }
  return () => { listeners.delete(listener); if (!listeners.size) stop?.() }
}

export const usePricing = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
