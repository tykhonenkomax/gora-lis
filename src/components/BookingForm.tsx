import { useRef, useState, type FormEvent } from 'react'
import { Phone } from 'lucide-react'
import { chan, contacts, houses, type House } from '../data/site'
import { bookingClient } from '../data/bookingApi'
import { earliestCheckout, rangeError, todayKey } from '../data/bookingDates'
import { parseRequest } from '../../supabase/functions/_shared/bookingRules'
import { nightPrice, quotePrice } from '../../supabase/functions/_shared/pricing'
import { refreshPricing, usePricing } from '../data/pricing'

const DAY = 24 * 60 * 60 * 1000
const money = (n: number) => `${n.toLocaleString('uk-UA')} грн`

// Повідомлення надсилає сервер; дати блокує власник після підтвердження.
export function BookingForm({ house, onHouseChange, onSendingChange }: {
  house: House
  onHouseChange?: (slug: House['slug']) => void
  onSendingChange?: (sending: boolean) => void
}) {
  const [slug, setSlug] = useState(house.slug)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [withChan, setWithChan] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)
  const [sentMessage, setSentMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [serverTotal, setServerTotal] = useState<number | null>(null)
  const [website, setWebsite] = useState('')
  const attempt = useRef<{ signature: string; id: string } | null>(null)
  const pricing = usePricing()

  const selected = onHouseChange ? house : houses.find((h) => h.slug === slug) ?? house
  const guestCount = Math.min(guests, selected.guests)
  const nights = checkIn && checkOut ? Math.max(0, Math.round((+new Date(checkOut) - +new Date(checkIn)) / DAY)) : 0
  const tariff = pricing.data?.houses.find(row => row.house_slug === selected.slug)
  const quote = pricing.data && !rangeError(checkIn, checkOut)
    ? quotePrice(pricing.data, { house: selected.slug, checkIn, checkOut, guests: guestCount, withChan }) : null
  const nightlyGroups = new Map<number, number>()
  quote?.nights.forEach(night => nightlyGroups.set(night.price, (nightlyGroups.get(night.price) ?? 0) + 1))
  const displayPrice = pricing.data ? nightPrice(pricing.data, selected.slug, checkIn || todayKey()) : null

  const message = [
    `Заявка: ${selected.name}`,
    checkIn && checkOut ? `${checkIn} — ${checkOut} (${nights} ноч.)` : '',
    `Гостей: ${guestCount}`,
    withChan ? 'Чан: так' : '',
    `${name}, ${phone}`,
  ]
    .filter(Boolean)
    .join('\n')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (sending) return
    setError('')
    setSending(true)
    onSendingChange?.(true)
    try {
      const invalid = rangeError(checkIn, checkOut)
      if (invalid) throw new Error(invalid)
      if (!pricing.data) throw new Error('Не вдалося завантажити актуальні ціни. Спробуйте ще раз або зателефонуйте.')
      const payload = parseRequest({ house: selected.slug, checkIn, checkOut, guests: guestCount, withChan, name, phone })
      if (!bookingClient) throw new Error('Надсилання тимчасово недоступне. Зателефонуйте нам.')
      const signature = JSON.stringify(payload)
      if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() }
      const { data, error: failure } = await bookingClient.functions.invoke('submit-booking', {
        body: { ...payload, requestId: attempt.current.id, website }, signal: AbortSignal.timeout(40000),
      })
      if (failure) {
        let message = 'Не вдалося підтвердити надсилання. Повторіть спробу або зателефонуйте нам.'
        if (failure.context instanceof Response) {
          try { const body = await failure.context.json(); if (typeof body.error === 'string') message = body.error } catch { /* Зберігаємо повідомлення про повторну спробу. */ }
        }
        throw new Error(message)
      }
      if (!data?.ok || data.requestId !== attempt.current.id || typeof data.total !== 'number') throw new Error('Не вдалося підтвердити надсилання. Спробуйте знову.')
      setServerTotal(data.total)
      setSentMessage(message)
      setSent(true)
    } catch (failure) {
      setError(failure instanceof Error && failure.name !== 'AbortError' && failure.name !== 'TimeoutError' ? failure.message : 'Надсилання триває довше очікуваного. Повторіть спробу або зателефонуйте нам.')
    } finally { setSending(false); onSendingChange?.(false) }
  }

  if (sent) {
    return (
      <div className="booking__done">
        <h3>Заявку надіслано!</h3>
        <p>Власник отримав повідомлення та зв’яжеться з вами для підтвердження. Дати ще не заброньовані.</p>
        <pre>{sentMessage}</pre>
        {serverTotal !== null && <p className="booking__total">Орієнтовно: {money(serverTotal)}</p>}
        <div className="booking__actions">
          <a className="btn btn--accent" href={`tel:${contacts.phone}`}>
            <Phone size={18} /> Подзвонити
          </a>
        </div>
        <button className="link" onClick={() => { setSent(false); attempt.current = null; setCheckIn(''); setCheckOut('') }}>
          Нова заявка
        </button>
      </div>
    )
  }

  return (
    <form className="booking__form" onSubmit={submit}>
      <fieldset className="booking__fields" disabled={sending}>
      <p className="field--full">Мінімальне бронювання — 2 ночі. Заїзд з 15:00, виїзд до 12:00.</p>
      <label className="booking__honeypot" aria-hidden="true">Сайт<input name="website" autoComplete="off" tabIndex={-1} value={website} onChange={event => setWebsite(event.target.value)} /></label>
      <label className="field field--full">
        <span>Будинок</span>
        <select value={selected.slug} onChange={(e) => (onHouseChange ?? setSlug)(e.target.value as House['slug'])}>
          {houses.map((h) => (
            <option key={h.slug} value={h.slug}>
              {h.name}
            </option>
          ))}
        </select>
      </label>
      <div className="booking__house-summary field--full"><span>{displayPrice !== null ? <>від <strong>{money(displayPrice)}</strong> / ніч</> : pricing.loading ? 'Завантажуємо ціну…' : 'Ціну уточнюйте телефоном'}</span><span>До {selected.guests} гостей</span></div>
      <label className="field">
        <span>Заїзд</span>
        <input type="date" required min={todayKey()} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (checkOut < earliestCheckout(e.target.value)) setCheckOut('') }} />
      </label>
      <label className="field">
        <span>Виїзд</span>
        <input
          type="date"
          required
          min={earliestCheckout(checkIn || todayKey())}
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
      {selected.extraGuest && tariff && (
        <p className="field--full">
          Ціна за {selected.extraGuest.included} гостей залежить від дат.
          {' '}За кожного наступного гостя — +{money(tariff.extra_guest_price)} / ніч.
        </p>
      )}
      <label className="field field--check">
        <input type="checkbox" checked={withChan} onChange={(e) => setWithChan(e.target.checked)} />
        <span>Чан (+{money(chan.price)})</span>
      </label>
      <label className="field field--full">
        <span>Імʼя</span>
        <input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field field--full">
        <span>Телефон</span>
        <input
          required
          maxLength={30}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+380"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      {quote && (
        <div className="booking__total field--full" aria-live="polite">
          {[...nightlyGroups].map(([price, count]) => <p key={price}>{count} ноч. × {money(price)}</p>)}
          {withChan && <p>Чан: {money(chan.price)}</p>}
          <p>Разом орієнтовно: <b>{money(quote.total)}</b></p>
        </div>
      )}
      {pricing.error && <p className="field--full booking__error" role="status">{pricing.error} <button className="link" type="button" onClick={() => void refreshPricing()}>Оновити ціни</button></p>}
      <p className="field--full booking__privacy">Натискаючи кнопку, ви передаєте ім’я, телефон і дати власнику для опрацювання заявки.</p>
      {error && <p className="field--full booking__error" role="alert">{error} <a href={`tel:${contacts.phone}`}>{contacts.phoneLabel}</a></p>}
      <button className="btn btn--accent field--full" type="submit" disabled={!pricing.data}>
        {sending ? 'Надсилаємо…' : 'Надіслати заявку'}
      </button>
      </fieldset>
    </form>
  )
}
