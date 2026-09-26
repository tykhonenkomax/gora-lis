import { useEffect, useState } from 'react'

// Роутинг на History API з чистими адресами:
// /maietok-pushkar/            — головна
// /maietok-pushkar/?s=houses   — головна з прокруткою до секції
// /maietok-pushkar/zrub        — сторінка будинку
// На GitHub Pages прямі заходи на /zrub обробляє 404.html (копія index.html).
const BASE = import.meta.env.BASE_URL

export type Route = { page: string; section?: string; nonce: number }

const parse = (): Route => {
  const { pathname, search } = window.location
  const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\//, '')
  const page = path.replace(/\/+$/, '') || 'home'
  const section = new URLSearchParams(search).get('s') ?? undefined
  return { page, section, nonce: Date.now() }
}

export const href = (page: string, section?: string) =>
  `${BASE}${page === 'home' ? '' : page}${section ? `?s=${section}` : ''}`

const listeners = new Set<() => void>()

export function navigate(to: string) {
  if (to !== window.location.pathname + window.location.search) window.history.pushState(null, '', to)
  listeners.forEach((l) => l())
}

// Перехоплює кліки по внутрішніх посиланнях, щоб не перезавантажувати сторінку.
function onClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const a = (e.target as Element).closest('a')
  if (!a || a.target || a.hasAttribute('download')) return
  const url = new URL(a.href, window.location.href)
  if (url.origin !== window.location.origin || !url.pathname.startsWith(BASE)) return
  e.preventDefault()
  navigate(url.pathname + url.search)
}

export function useRoute() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const update = () => setRoute(parse())
    listeners.add(update)
    window.addEventListener('popstate', update)
    document.addEventListener('click', onClick)
    return () => {
      listeners.delete(update)
      window.removeEventListener('popstate', update)
      document.removeEventListener('click', onClick)
    }
  }, [])
  return route
}

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
