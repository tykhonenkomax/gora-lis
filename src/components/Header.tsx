import { useEffect, useState } from 'react'
import { Menu, Phone, X } from 'lucide-react'
import { brand, contacts, houses } from '../data/site'
import { href } from '../router'



export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('lock', open)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Меню">
            <Menu size={24} />
          </button>
        </div>
      </header>

      <div className={`menu ${open ? 'menu--open' : ''}`} aria-hidden={!open}>
        <button className="icon-btn menu__close" onClick={close} aria-label="Закрити меню">
          <X size={28} />
        </button>
        <nav className="menu__nav">
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
