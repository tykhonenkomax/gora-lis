import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ArrowLeft, LogOut } from 'lucide-react'
import { bookingClient, bookingError, type Reservation } from '../data/bookingApi'
import { formatDay, monthStart, nightsBetween, overlaps, parseDay, rangeError, todayKey } from '../data/bookingDates'
import { brand, houses, type House } from '../data/site'
import { BookingCalendar, HouseSwitch } from '../components/Availability'
import { href } from '../router'

function ReservationManager() {
  const [slug, setSlug] = useState<House['slug']>('zrub')
  const [month, setMonth] = useState(() => monthStart(parseDay(todayKey())))
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [status, setStatus] = useState<Reservation['status']>('confirmed')
  const [rows, setRows] = useState<Reservation[]>([])
  const [loadedVersion, setLoadedVersion] = useState(-1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const loaded = loadedVersion === refresh

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { data, error: failure } = await bookingClient!.from('reservations').select('id,house_slug,check_in,check_out,status').gt('check_out', todayKey()).order('check_in')
        if (failure) throw failure
        if (active) { setRows(data ?? []); setLoadedVersion(refresh) }
      } catch {
        if (active) setError('Не вдалося оновити бронювання. Перевірте інтернет і натисніть «Оновити список».')
      }
    })()
    return () => { active = false }
  }, [refresh])

  const reservations = rows.filter(row => row.house_slug === slug)
  const occupied = new Set(reservations.flatMap(row => nightsBetween(row.check_in, row.check_out)))
  const tentative = new Set(reservations.filter(row => row.status === 'tentative').flatMap(row => nightsBetween(row.check_in, row.check_out)))
  const houseName = houses.find(house => house.slug === slug)!.name

  function changeHouse(value: House['slug']) {
    setSlug(value); setStart(''); setEnd(''); setError(''); setNotice(''); setConfirm(null)
  }

  function pick(day: string) {
    if (busy) return
    setError(''); setNotice('')
    if (!start || end || day <= start) {
      if (occupied.has(day)) { setError('На цю ніч уже є бронювання. Оберіть вільний день заїзду.'); return }
      setStart(day); setEnd('')
    } else setEnd(day)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (busy || !loaded) return
    setNotice('')
    const invalid = rangeError(start, end)
    if (invalid) { setError(invalid); return }
    if (reservations.some(row => overlaps(start, end, row.check_in, row.check_out))) {
      setError('У вибраному періоді є зайняті ночі. Оберіть інші дати.'); return
    }
    setBusy(true); setError('')
    try {
      const { error: failure } = await bookingClient!.from('reservations').insert({ house_slug: slug, check_in: start, check_out: end, status })
      if (failure) { setError(bookingError(failure.code)); return }
      setNotice(`${houseName}: ${formatDay(start)} — ${formatDay(end)}. Збережено!`)
      setStart(''); setEnd('')
    } catch { setError(bookingError()) }
    finally { setBusy(false); setRefresh(value => value + 1) }
  }

  async function cancel(id: string) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const { data, error: failure } = await bookingClient!.from('reservations').delete().eq('id', id).select('id')
      if (failure) { setError(bookingError(failure.code)); return }
      setNotice(data?.length ? 'Бронювання скасовано. Дати знову вільні.' : 'Це бронювання вже видалено. Список оновлено.')
      setConfirm(null)
    } catch { setError(bookingError()) }
    finally { setBusy(false); setRefresh(value => value + 1) }
  }

  async function confirmBooking(id: string) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const { data, error: failure } = await bookingClient!.from('reservations').update({ status: 'confirmed' }).eq('id', id).select('id')
      if (failure) { setError(bookingError(failure.code)); return }
      setNotice(data?.length ? 'Бронювання підтверджено ❤️' : 'Бронювання вже видалено. Оновлюємо список.')
    } catch { setError(bookingError()) }
    finally { setBusy(false); setRefresh(value => value + 1) }
  }

  return (
    <>
      <HouseSwitch value={slug} onChange={changeHouse} disabled={busy} />
      <div className="admin-panel__layout">
        <BookingCalendar month={month} onMonth={setMonth} occupied={occupied} tentative={tentative} known={loaded} start={start} end={end} onPick={busy ? undefined : pick} />
        <form className="admin-panel__form" onSubmit={save}>
          <h2>Додати бронювання</h2>
          <p>Натисніть у календарі день заїзду, потім день виїзду. Або введіть дати нижче.</p>
          <label>Заїзд<input type="date" required min={todayKey()} value={start} disabled={busy} onChange={event => { setStart(event.target.value); setEnd(''); if (event.target.value) setMonth(monthStart(parseDay(event.target.value))) }} /></label>
          <label>Виїзд<input type="date" required min={start || todayKey()} value={end} disabled={busy} onChange={event => setEnd(event.target.value)} /></label>
          <fieldset className="admin-panel__status"><legend>Статус бронювання</legend>
            <label><input type="radio" name="status" value="confirmed" checked={status === 'confirmed'} disabled={busy} onChange={() => setStatus('confirmed')} /> ❤️ Підтверджене</label>
            <label><input type="radio" name="status" value="tentative" checked={status === 'tentative'} disabled={busy} onChange={() => setStatus('tentative')} /> 🌲 Попереднє</label>
          </fieldset>
          <p>День виїзду не блокується: на цю дату можна прийняти наступних гостей.</p>
          <button className="calendar-button calendar-button--primary" disabled={busy || !loaded || !start || !end}>{busy ? 'Зберігаємо…' : status === 'tentative' ? 'Позначити попереднє 🌲' : 'Позначити зайнятими ❤️'}</button>
        </form>
      </div>
      {error && <p className="admin-panel__error" role="alert">{error}</p>}
      {notice && <p className="admin-panel__success" role="status">{notice}</p>}
      <section className="admin-panel__bookings">
        <div className="admin-panel__list-heading"><h2>Бронювання · {houseName}</h2><button className="calendar-button" disabled={busy} onClick={() => { setError(''); setRefresh(value => value + 1) }}>Оновити список</button></div>
        {!loaded ? <p role="status">Завантажуємо бронювання…</p> : reservations.length === 0 ? <p>Майбутніх бронювань поки немає.</p> : (
          <ul>{reservations.map(row => (
            <li key={row.id}>
              <div><strong>{formatDay(row.check_in)} — {formatDay(row.check_out)}</strong><p>Заїзд — виїзд · {nightsBetween(row.check_in, row.check_out).length} ноч.</p><p>{row.status === 'tentative' ? '🌲 Попереднє' : '❤️ Підтверджене'}</p></div>
              {row.status === 'tentative' && <button className="calendar-button" disabled={busy} onClick={() => void confirmBooking(row.id)}>Підтвердити ❤️</button>}
              {confirm === row.id ? <div className="admin-panel__cancel"><p>Звільнити ці дати?</p><button className="calendar-button calendar-button--danger" disabled={busy} onClick={() => void cancel(row.id)}>Так, скасувати</button><button className="calendar-button" disabled={busy} onClick={() => setConfirm(null)}>Залишити</button></div> : <button className="calendar-button" disabled={busy} onClick={() => setConfirm(row.id)}>Скасувати бронювання</button>}
            </li>
          ))}</ul>
        )}
      </section>
    </>
  )
}

export function Admin() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [accessResult, setAccessResult] = useState<{ key: string; status: 'allowed' | 'denied' | 'error' } | null>(null)
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  const accessKey = `${session?.user.id}:${retry}`
  const access = accessResult?.key === accessKey ? accessResult.status : 'checking'

  useEffect(() => {
    document.title = `Керування бронюваннями — ${brand.name}`
    return () => { document.title = `${brand.name} — котеджі у Верховині` }
  }, [])

  useEffect(() => {
    if (!bookingClient) return
    const { data } = bookingClient.auth.onAuthStateChange((_event, current) => { setSession(current); setReady(true) })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session || !bookingClient) return
    let active = true
    void (async () => {
      try {
        const { data, error: failure } = await bookingClient!.from('booking_admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
        if (active) setAccessResult({ key: accessKey, status: failure ? 'error' : data ? 'allowed' : 'denied' })
      } catch { if (active) setAccessResult({ key: accessKey, status: 'error' }) }
    })()
    return () => { active = false }
  }, [session, accessKey])

  async function login(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const email = `${loginName.trim().toLowerCase()}@owners.gora-lis.invalid`
      const { error: failure } = await bookingClient!.auth.signInWithPassword({ email, password })
      if (failure) setError('Не вдалося увійти. Перевірте логін, пароль та підключення до інтернету.')
      else setPassword('')
    } catch { setError('Не вдалося з’єднатися. Спробуйте ще раз.') }
    finally { setBusy(false) }
  }

  async function logout() {
    setError('')
    const { error: failure } = await bookingClient!.auth.signOut({ scope: 'local' })
    if (failure) setError('Не вдалося вийти. Спробуйте ще раз.')
  }

  return (
    <main className="admin-panel">
      <div className="container">
        <div className="admin-panel__top"><a href={href('home')}><ArrowLeft size={18} /> На сайт</a>{session && <button className="calendar-button" onClick={() => void logout()}><LogOut size={18} /> Вийти</button>}</div>
        <p className="kicker kicker--dark">{brand.name} · для власника</p>
        <h1 className="display display--sm display--dark">Керування бронюваннями</h1>
        {!bookingClient ? <div className="admin-panel__setup"><h2>Панель готова до підключення</h2><p>Потрібно один раз підключити базу бронювань і створити вхід власника. Після налаштування тут з’явиться форма входу.</p></div> : !ready ? <p role="status">Перевіряємо вхід…</p> : !session ? (
          <form className="admin-panel__form admin-panel__login" onSubmit={login}>
            <h2>Вхід власника</h2><p>Увійдіть один раз на своєму телефоні — наступного разу панель відкриється без повторного введення пароля, доки вхід залишається активним.</p>
            <label>Логін<input type="text" required autoComplete="username" autoCapitalize="none" spellCheck={false} pattern="[A-Za-z0-9._\-]{3,32}" title="Від 3 до 32 символів: латинські літери, цифри, крапка, дефіс або підкреслення" placeholder="admin" value={loginName} onChange={event => setLoginName(event.target.value)} /></label>
            <label>Пароль<input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
            <button className="calendar-button calendar-button--primary" disabled={busy}>{busy ? 'Входимо…' : 'Увійти'}</button>
          </form>
        ) : access === 'checking' ? <p role="status">Перевіряємо доступ…</p> : access === 'allowed' ? <ReservationManager key={session.user.id} /> : <div className="admin-panel__setup"><p>{access === 'denied' ? 'Цей акаунт не має доступу власника. Увійдіть іншим акаунтом або зверніться до того, хто налаштовує сайт.' : 'Не вдалося перевірити доступ. Перевірте підключення.'}</p><button className="calendar-button" onClick={() => setRetry(value => value + 1)}>Перевірити ще раз</button></div>}
        {error && <p className="admin-panel__error" role="alert">{error}</p>}
      </div>
    </main>
  )
}
