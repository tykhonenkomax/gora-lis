import { useEffect, useRef, useState } from 'react'
import { Menu, Phone, X } from 'lucide-react'
import { brand, contacts, houses } from '../data/site'
import { href } from '../router'

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    document.body.classList.add('lock')
    const menu = menuRef.current
    const opener = openerRef.current
    const frame = requestAnimationFrame(() => menu?.querySelector<HTMLButtonElement>('button')?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key !== 'Tab' || !menu) return
      const elements = menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      document.body.classList.remove('lock')
      window.removeEventListener('keydown', onKey)
      opener?.focus({ preventScroll: true })
    }
  }, [open])

  const close = () => setOpen(false)
  const links = [
    { label: 'Головна', to: href('home') },
    ...houses.map((h) => ({ label: h.name, to: href(h.slug) })),
    { label: 'Поблизу', to: href('nearby') },
    { label: 'Вільні дати', to: href('home', 'availability') },
    { label: 'Чан', to: href('home', 'chan') },
    { label: 'Територія', to: href('home', 'fire') },
    { label: 'Контакти', to: href('home', 'contacts') },
  ]

  return (
    <>
      <header className={`header ${scrolled ? 'header--solid' : ''}`}>
        <a className="header__logo" href={href('home')} onClick={close}>
          {brand.name}
        </a>
        <div className="header__actions">
          <a className="icon-btn" href={`tel:${contacts.phone}`} aria-label="Подзвонити">
            <Phone size={20} />
          </a>
          <button ref={openerRef} className="icon-btn" onClick={() => setOpen(true)} aria-label="Меню" aria-expanded={open} aria-controls="site-menu">
            <Menu size={24} />
          </button>
        </div>
      </header>

      <div ref={menuRef} id="site-menu" className={`menu ${open ? 'menu--open' : ''}`} role="dialog" aria-modal={open || undefined} aria-label="Навігація сайтом" aria-hidden={!open} inert={!open}>
        <span className="menu__brand">{brand.name}</span>
        <button className="icon-btn menu__close" onClick={close} aria-label="Закрити меню">
          <X size={28} />
        </button>
        <nav className="menu__nav" aria-label="Головне меню">
          {links.map((l, i) => (
            <a key={l.label} href={l.to} onClick={close} style={{ transitionDelay: `${open ? 80 + i * 50 : 0}ms` }}>
              <span className="menu__num">0{i + 1}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="menu__foot">
          <a className="btn btn--light" href={`tel:${contacts.phone}`}>
            <Phone size={18} /> {contacts.phoneLabel}
          </a>
          <p>{contacts.address}</p>
        </div>
      </div>
    </>
  )
}
