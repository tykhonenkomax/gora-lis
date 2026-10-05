import { MapPin, Phone } from 'lucide-react'
import { brand, contacts, houses } from '../data/site'
import { href } from '../router'

export function Footer() {
  return (
    <footer className="footer" id="contacts">
      <div className="container footer__grid">
        <div>
          <p className="footer__brand">{brand.name}</p>
          <p className="muted">{brand.tagline}</p>
        </div>
        <div className="footer__col">
          <a className="footer__phone" href={`tel:${contacts.phone}`}>
            <Phone size={18} /> {contacts.phoneLabel}
          </a>
          <p className="footer__addr">
            <MapPin size={18} /> {contacts.address}
          </p>
          <a href={contacts.mapUrl} target="_blank" rel="noreferrer">Відкрити в Google Maps</a>
        </div>
        <nav className="footer__col">
          {houses.map((h) => (
            <a key={h.slug} href={href(h.slug)}>
              {h.name} — {h.subtitle.toLowerCase()}
            </a>
          ))}
          <a href={href('nearby')}>Що поблизу</a>
        </nav>
      </div>
      <div className="footer__map">
        <iframe
          title="Gora&Lis на Google Maps"
          loading="lazy"
          src={contacts.mapEmbedUrl}
        />
      </div>
      <p className="container footer__copy muted">
        © {new Date().getFullYear()} {brand.name}
      </p>
    </footer>
  )
}
