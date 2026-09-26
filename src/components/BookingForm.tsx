import { useState, type FormEvent } from 'react'
import { MessageSquare, Phone } from 'lucide-react'
import { chan, contacts, houses, type House } from '../data/site'

const DAY = 24 * 60 * 60 * 1000
const today = () => new Date().toISOString().slice(0, 10)
const money = (n: number) => `${n.toLocaleString('uk-UA')} грн`

// Поки бекенду немає: форма рахує вартість і пропонує подзвонити або надіслати SMS із заявкою.
export function BookingForm({ house }: { house: House }) {
  const [slug, setSlug] = useState(house.slug)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [withChan, setWithChan] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)

  const selected = houses.find((h) => h.slug === slug) ?? house
  const guestCount = Math.min(guests, selected.guests)
  const nights = checkIn && checkOut ? Math.max(0, Math.round((+new Date(checkOut) - +new Date(checkIn)) / DAY)) : 0
  const total = nights * selected.price + (withChan ? chan.price : 0)

  const message = [
    `Заявка: ${selected.name}`,
    checkIn && checkOut ? `${checkIn} — ${checkOut} (${nights} ноч.)` : '',
    `Гостей: ${guestCount}`,
    withChan ? 'Чан: так' : '',
    `${name}, ${phone}`,
  ]
    .filter(Boolean)
    .join('\n')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <div className="booking__done">
        <h3>Майже готово!</h3>
        <p>Поки що бронювання підтверджуємо телефоном. Зателефонуйте або надішліть SMS із заявкою:</p>
        <pre>{message}</pre>
        {total > 0 && <p className="booking__total">Орієнтовно: {money(total)}</p>}
        <div className="booking__actions">
          <a className="btn btn--accent" href={`tel:${contacts.phone}`}>
            <Phone size={18} /> Подзвонити
          </a>
          <a className="btn btn--outline" href={`sms:${contacts.phone}?&body=${encodeURIComponent(message)}`}>
            <MessageSquare size={18} /> Надіслати SMS
          </a>
        </div>
        <button className="link" onClick={() => setSent(false)}>
          Змінити дані
        </button>
      </div>
    )
  }

  return (
    <form className="booking__form" onSubmit={submit}>
      <label className="field field--full">
        <span>Будинок</span>
        <select value={slug} onChange={(e) => setSlug(e.target.value as House['slug'])}>
          {houses.map((h) => (
            <option key={h.slug} value={h.slug}>
              {h.name} — до {h.guests} осіб, {money(h.price)}/ніч
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Заїзд</span>
        <input type="date" required min={today()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
      </label>
      <label className="field">
        <span>Виїзд</span>
        <input
          type="date"
          required
          min={checkIn || today()}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Гостей</span>
        <select value={guestCount} onChange={(e) => setGuests(+e.target.value)}>
          {Array.from({ length: selected.guests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="field field--check">
        <input type="checkbox" checked={withChan} onChange={(e) => setWithChan(e.target.checked)} />
        <span>Чан (+{money(chan.price)})</span>
      </label>
      <label className="field field--full">
        <span>Імʼя</span>
        <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field field--full">
        <span>Телефон</span>
        <input
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+380"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      {nights > 0 && (
        <p className="booking__total field--full">
          {nights} ноч. × {money(selected.price)}
          {withChan ? ` + чан ${money(chan.price)}` : ''} = <b>{money(total)}</b>
        </p>
      )}
      <button className="btn btn--accent field--full" type="submit">
        Залишити заявку
      </button>
    </form>
  )
}
