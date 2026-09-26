import { useEffect, useState } from 'react'

// Хеш-роутинг: працює на GitHub Pages без налаштувань сервера.
// #/            — головна
// #/?s=houses   — головна з прокруткою до секції
// #/zrub        — сторінка будинку
export type Route = { page: string; section?: string }

const parse = (): Route => {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [page, query = ''] = raw.split('?')
  const section = new URLSearchParams(query).get('s') ?? undefined
  return { page: page || 'home', section }
}

export const href = (page: string, section?: string) =>
  `#/${page === 'home' ? '' : page}${section ? `?s=${section}` : ''}`

export function useRoute() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
