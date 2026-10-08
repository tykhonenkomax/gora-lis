import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Heart, TreePine } from 'lucide-react'
import { bookingClient } from '../data/bookingApi'
import { dateKey, formatDay, monthStart, parseDay, shiftMonth, todayKey } from '../data/bookingDates'
import { houses, type House } from '../data/site'

export function HouseSwitch({ value, onChange, disabled }: { value: House['slug']; onChange: (slug: House['slug']) => void; disabled?: boolean }) {
  return (
    <div className="house-switch" aria-label="Оберіть будинок">
      {houses.map(house => (
        <button type="button" key={house.slug} disabled={disabled} aria-pressed={value === house.slug} onClick={() => onChange(house.slug)}>
          {house.name}
        </button>
      ))}
    </div>
  )
}

type CalendarProps = {
  month: Date
  onMonth: (month: Date) => void
  occupied: Set<string>
  tentative?: Set<string>
  known: boolean
  compact?: boolean
  start?: string
  end?: string
  onPick?: (day: string) => void
}

export function BookingCalendar({ month, onMonth, occupied, tentative, known, compact, start, end, onPick }: CalendarProps) {
  const today = todayKey()
  const offset = (month.getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const label = month.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })
  return (
    <div className="booking-calendar">
      <div className="booking-calendar__nav">
        {!compact && <button type="button" aria-label="Попередній місяць" disabled={dateKey(month) <= dateKey(monthStart(parseDay(today)))} onClick={() => onMonth(shiftMonth(month, -1))}><ChevronLeft /></button>}
        <h3 aria-live="polite">{label}</h3>
        {!compact && <button type="button" aria-label="Наступний місяць" onClick={() => onMonth(shiftMonth(month, 1))}><ChevronRight /></button>}
      </div>
      <div className="booking-calendar__grid">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(day => <span className="booking-calendar__weekday" key={day}>{day}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const day = dateKey(new Date(month.getFullYear(), month.getMonth(), i + 1, 12))
          const past = day < today
          const busy = known && occupied.has(day)
          const pending = known && !!tentative?.has(day)
          const selected = day === start || day === end || !!(start && end && day > start && day < end)
          const status = !known ? 'дані недоступні' : pending ? 'попереднє бронювання' : busy ? 'зайнята ніч' : past ? 'минула дата' : 'вільна ніч'
          const content = <><span>{i + 1}</span>{pending ? <TreePine size={14} aria-hidden="true" /> : busy && <Heart size={13} fill="currentColor" aria-hidden="true" />}</>
          const className = `booking-calendar__day ${past ? 'is-past' : ''} ${busy && !pending ? 'is-busy' : ''} ${pending ? 'is-tentative' : ''} ${selected ? 'is-selected' : ''} ${!known ? 'is-unknown' : ''}`
          return onPick ? (
            <button type="button" key={day} className={className} disabled={past || !known} aria-pressed={selected} aria-label={`${formatDay(day)} — ${status}`} onClick={() => onPick(day)}>{content}</button>
          ) : <div key={day} className={className} aria-label={`${formatDay(day)} — ${status}`}>{content}</div>
        })}
      </div>
      {!compact && <><CalendarLegend /><p className="booking-calendar__hint">Сердечко або ялинка позначає ніч із цієї дати. У день виїзду можливий новий заїзд.</p></>}
    </div>
  )
}

function CalendarLegend() {
  return <div className="booking-calendar__legend">
    <span><span className="calendar-key calendar-key--busy"><Heart size={15} fill="currentColor" /></span> — заброньовано</span>
    <span><span className="calendar-key calendar-key--tentative"><TreePine size={16} /></span> — попереднє бронювання</span>
    <span><span className="calendar-key calendar-key--free" aria-hidden="true" /> — вільно</span>
  </div>
}

export function Availability({ house }: { house?: House }) {
  const [slug, setSlug] = useState<House['slug']>(house?.slug ?? 'zrub')
  const [month, setMonth] = useState(() => monthStart(parseDay(todayKey())))
  const [result, setResult] = useState<{ key: string; days: { night: string; status: string }[]; error?: string } | null>(null)
  const [refresh, setRefresh] = useState(0)
  const key = `${slug}:${dateKey(month)}:${refresh}`

  useEffect(() => {
    let active = true
    const client = bookingClient
    if (!client) return
    void (async () => {
      try {
        const responses = await Promise.all([0, 1, 2].map(offset => client.rpc('occupied_nights', {
          p_house: slug, p_from: dateKey(shiftMonth(month, offset)), p_to: dateKey(shiftMonth(month, offset + 1)),
        })))
        if (!active) return
        const failure = responses.find(response => response.error)?.error
        if (failure) throw failure
        setResult({ key, days: responses.flatMap(response => response.data ?? []) })
      } catch {
        if (active) setResult({ key, days: [], error: 'Не вдалося завантажити зайнятість. Спробуйте ще раз або уточніть дати телефоном.' })
      }
    })()
    return () => { active = false }
  }, [slug, month, key])

  useEffect(() => {
    const update = () => { if (!document.hidden) setRefresh(value => value + 1) }
    const timer = window.setInterval(update, 60000)
    window.addEventListener('focus', update)
    return () => { clearInterval(timer); window.removeEventListener('focus', update) }
  }, [])

  const error = result?.key === key ? result.error : ''
  const known = result?.key === key && !error
  const days = known ? result.days : []
  const occupied = new Set(days.map(day => day.night))
  const tentative = new Set(days.filter(day => day.status === 'tentative').map(day => day.night))
  return (
    <section className="availability section" id="availability">
      <div className="container">
        <p className="kicker kicker--dark">Плануйте відпочинок</p>
        <h2 className="display display--sm display--dark">Вільні дати{house ? ` · ${house.name}` : ''}</h2>
        {!house && <HouseSwitch value={slug} onChange={setSlug} />}
        <div className="availability__navigation">
          <button className="calendar-button" aria-label="Попередні три місяці" disabled={dateKey(month) <= dateKey(monthStart(parseDay(todayKey())))} onClick={() => setMonth(previous => {
            const earlier = shiftMonth(previous, -3)
            const current = monthStart(parseDay(todayKey()))
            return earlier < current ? current : earlier
          })}><ChevronLeft size={20} /> Назад</button>
          <button className="calendar-button" aria-label="Наступні три місяці" onClick={() => setMonth(previous => shiftMonth(previous, 3))}>Далі <ChevronRight size={20} /></button>
        </div>
        <div className="availability__months" aria-label="Календар на три місяці" aria-busy={!!bookingClient && !known && !error}>
          {[0, 1, 2].map(offset => <BookingCalendar key={dateKey(shiftMonth(month, offset))} month={shiftMonth(month, offset)} onMonth={setMonth} occupied={occupied} tentative={tentative} known={!!known} compact />)}
        </div>
        <CalendarLegend />
        {error && <div className="availability__error"><p role="status">{error}</p><button className="calendar-button" onClick={() => setRefresh(value => value + 1)}>Спробувати ще раз</button></div>}
      </div>
    </section>
  )
}
