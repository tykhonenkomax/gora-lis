import { CalendarDays, Phone } from 'lucide-react'
import { contacts } from '../data/site'
import { href, scrollToSection } from '../router'

// Нижня панель на телефоні — дзвінок і бронювання завжди під пальцем.
export function CallBar({ page, section }: { page: string; section: string }) {
  return (
    <div className="callbar">
      <a className="btn btn--ghost" href={`tel:${contacts.phone}`}>
        <Phone size={18} /> Подзвонити
      </a>
      <a className="btn btn--accent" href={href(page, section)} onClick={() => scrollToSection(section)}>
        <CalendarDays size={18} /> Забронювати
      </a>
    </div>
  )
}
