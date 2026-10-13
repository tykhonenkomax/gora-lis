import { useState, type FormEvent } from 'react'
import { bookingClient } from '../data/bookingApi'
import { refreshPricing, usePricing } from '../data/pricing'
import { formatDay, todayKey } from '../data/bookingDates'
import { houses, type House } from '../data/site'
import { validDate } from '../../supabase/functions/_shared/bookingRules'
import type { HousePrice, SeasonPrice } from '../../supabase/functions/_shared/pricing'
import { HouseSwitch } from './Availability'

const money = (value: number) => `${value.toLocaleString('uk-UA')} грн`
const message = (code?: string) => code === '23P01'
  ? 'Цей період перетинається з іншим сезонним тарифом. Змініть дати або відредагуйте наявний сезон.'
  : 'Не вдалося зберегти. Оновіть ціни й перевірте доступ та інтернет.'

function PriceForms({ house, base, seasons, onBusyChange }: { house: House; base: HousePrice; seasons: SeasonPrice[]; onBusyChange: (value: boolean) => void }) {
  const [basePrice, setBasePrice] = useState(String(base.base_price))
  const [extraPrice, setExtraPrice] = useState(String(base.extra_guest_price))
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('Високий сезон')
  const [start, setStart] = useState(todayKey())
  const [end, setEnd] = useState(todayKey())
  const [seasonPrice, setSeasonPrice] = useState(String(base.base_price))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [removeId, setRemoveId] = useState<string | null>(null)

  const amountValid = (value: string, allowZero = false) => /^\d+$/.test(value) && +value >= (allowZero ? 0 : 1) && +value <= 1000000
  const resetSeason = () => { setEditId(null); setName('Високий сезон'); setStart(todayKey()); setEnd(todayKey()); setSeasonPrice(String(base.base_price)) }

  async function saveBase(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (!amountValid(basePrice) || !amountValid(extraPrice, true)) { setError('Вкажіть цілі суми у гривнях. Ціна за ніч має бути більшою за нуль.'); return }
    setBusy(true); onBusyChange(true); setError(''); setNotice('')
    try {
      const { data, error: failure } = await bookingClient!.from('house_prices').update({ base_price: +basePrice, extra_guest_price: house.extraGuest ? +extraPrice : 0 }).eq('house_slug', house.slug).select('house_slug')
      if (failure || data?.length !== 1) throw failure ?? new Error('No access')
      setNotice('Звичайну ціну збережено. Сайт уже використовує новий тариф.')
      await refreshPricing()
    } catch { setError(message()) }
    finally { setBusy(false); onBusyChange(false) }
  }

  async function saveSeason(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (!name.trim() || !validDate(start) || !validDate(end) || end < start || (Date.parse(end) - Date.parse(start)) / 86400000 > 1095 || !amountValid(seasonPrice)) {
      setError('Перевірте назву, дати сезону (до 3 років) та ціну за ніч.'); return
    }
    if (seasons.some(row => row.id !== editId && start <= row.ends_on && end >= row.starts_on)) { setError(message('23P01')); return }
    setBusy(true); onBusyChange(true); setError(''); setNotice('')
    try {
      const values = { name: name.trim(), starts_on: start, ends_on: end, nightly_price: +seasonPrice }
      const operation = editId
        ? bookingClient!.from('seasonal_prices').update(values).eq('id', editId).eq('house_slug', house.slug)
        : bookingClient!.from('seasonal_prices').insert({ ...values, house_slug: house.slug })
      const { data, error: failure } = await operation.select('id')
      if (failure || data?.length !== 1) { setError(message(failure?.code)); return }
      resetSeason()
      setNotice('Сезонний тариф збережено. Він застосовується лише до ночей у вибраному періоді.')
      await refreshPricing()
    } catch { setError(message()) }
    finally { setBusy(false); onBusyChange(false) }
  }

  async function removeSeason(id: string) {
    if (busy) return
    setBusy(true); onBusyChange(true); setError(''); setNotice('')
    try {
      const { data, error: failure } = await bookingClient!.from('seasonal_prices').delete().eq('id', id).eq('house_slug', house.slug).select('id')
      if (failure || data?.length !== 1) throw failure ?? new Error('No change')
      if (editId === id) resetSeason()
      setRemoveId(null)
      setNotice('Сезон видалено. Для цих ночей діє звичайна ціна.')
      await refreshPricing()
    } catch { setError(message()) }
    finally { setBusy(false); onBusyChange(false) }
  }

  function editSeason(row: SeasonPrice) {
    setEditId(row.id); setName(row.name); setStart(row.starts_on); setEnd(row.ends_on); setSeasonPrice(String(row.nightly_price)); setError(''); setNotice('')
    document.getElementById('season-price-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return <>
    <div className="admin-panel__layout">
      <form className="admin-panel__form" onSubmit={saveBase}>
        <h2>Звичайна ціна · {house.name}</h2>
        <p>Діє в усі дати, для яких не задано сезонний тариф. Зараз на сайті: {money(base.base_price)} / ніч.</p>
        <label>Ціна за ніч, грн<input type="number" inputMode="numeric" required min="1" max="1000000" step="1" value={basePrice} disabled={busy} onChange={event => setBasePrice(event.target.value)} /></label>
        {house.extraGuest && <label>Доплата за гостя після 4-го, грн / ніч<input type="number" inputMode="numeric" required min="0" max="1000000" step="1" value={extraPrice} disabled={busy} onChange={event => setExtraPrice(event.target.value)} /></label>}
        <button className="calendar-button calendar-button--primary" disabled={busy}>Зберегти звичайну ціну</button>
      </form>
      <form className="admin-panel__form" id="season-price-form" onSubmit={saveSeason}>
        <h2>{editId ? 'Редагувати сезон' : 'Додати сезонну ціну'}</h2>
        <label>Назва сезону<input required maxLength={60} value={name} disabled={busy} onChange={event => setName(event.target.value)} /></label>
        <label>Перша ніч сезону<input type="date" required value={start} disabled={busy} onChange={event => setStart(event.target.value)} /></label>
        <label>Остання ніч сезону (включно)<input type="date" required min={start} value={end} disabled={busy} onChange={event => setEnd(event.target.value)} /></label>
        <label>Сезонна ціна за ніч, грн<input type="number" inputMode="numeric" required min="1" max="1000000" step="1" value={seasonPrice} disabled={busy} onChange={event => setSeasonPrice(event.target.value)} /></label>
        <p>Обидві дати включені. Наприклад, сезон до 7 січня охоплює ніч з 7 на 8 січня. Доплата за додаткових гостей залишається звичайною.</p>
        <button className="calendar-button calendar-button--primary" disabled={busy}>{editId ? 'Зберегти зміни сезону' : 'Додати сезон'}</button>
        {editId && <button className="calendar-button" type="button" disabled={busy} onClick={resetSeason}>Скасувати редагування</button>}
      </form>
    </div>
    {error && <p className="admin-panel__error" role="alert">{error}</p>}
    {notice && <p className="admin-panel__success" role="status">{notice}</p>}
    <section className="admin-panel__bookings">
      <div className="admin-panel__list-heading"><h2>Сезонні тарифи</h2><button className="calendar-button" disabled={busy} onClick={() => void refreshPricing()}>Оновити ціни</button></div>
      {!seasons.length ? <p>Сезонних тарифів немає — діє звичайна ціна.</p> : <ul>{seasons.map(row => <li key={row.id}>
        <div><strong>{row.name} · {money(row.nightly_price)} / ніч</strong><p>{formatDay(row.starts_on)} — {formatDay(row.ends_on)} включно</p></div>
        <div className="admin-panel__cancel">
          {removeId === row.id ? <><p>Прибрати цей сезонний тариф?</p><button className="calendar-button calendar-button--danger" disabled={busy} onClick={() => void removeSeason(row.id)}>Так, видалити</button><button className="calendar-button" disabled={busy} onClick={() => setRemoveId(null)}>Залишити</button></> : <><button className="calendar-button" disabled={busy} onClick={() => editSeason(row)}>Редагувати</button><button className="calendar-button" disabled={busy} onClick={() => setRemoveId(row.id)}>Видалити</button></>}
        </div>
      </li>)}</ul>}
    </section>
  </>
}

export function PricingManager() {
  const [slug, setSlug] = useState<House['slug']>('zrub')
  const [busy, setBusy] = useState(false)
  const pricing = usePricing()
  return <section aria-label="Керування цінами">
    <p>Ціни автоматично змінюються в картках будинків, формі та повідомленнях про нові заявки. Перезбирати сайт не потрібно.</p>
    <HouseSwitch value={slug} onChange={setSlug} disabled={busy} />
    {!pricing.data ? <div className="admin-panel__setup"><p role="status">{pricing.loading ? 'Завантажуємо ціни…' : pricing.error}</p>{!pricing.loading && <button className="calendar-button" onClick={() => void refreshPricing()}>Повторити завантаження</button>}</div> : <PriceForms key={slug} house={houses.find(house => house.slug === slug)!} base={pricing.data.houses.find(row => row.house_slug === slug)!} seasons={pricing.data.seasons.filter(row => row.house_slug === slug)} onBusyChange={setBusy} />}
  </section>
}
