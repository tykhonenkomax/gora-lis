import { useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock, Phone } from 'lucide-react'
import { brand, chan, contacts, home, houses, type House } from '../data/site'
import { Img } from '../components/Img'
import { Icon } from '../components/Icon'
import { Carousel } from '../components/Carousel'
import { BookingForm } from '../components/BookingForm'
import { Faq } from '../components/Faq'
import { Footer } from '../components/Footer'
import { href } from '../router'
import { Availability } from '../components/Availability'

const money = (n: number) => `${n.toLocaleString('uk-UA')} грн`

export function HousePage({ house }: { house: House }) {
  const other = houses.find((h) => h.slug !== house.slug)

  useEffect(() => {
    document.title = `${house.name} — ${brand.name}`
    return () => {
      document.title = `${brand.name} — котеджі у Верховині`
    }
  }, [house])

  return (
    <main className="house">
      <section className="house-hero">
        <Img className="house-hero__img" photo={house.cover} eager />
        <div className="slide__shade" />
        <div className="house-hero__content">
          <a className="back" href={href('home', 'houses')}>
            <ArrowLeft size={18} /> Усі будинки
          </a>
          <p className="kicker">{brand.name}</p>
          <h1 className="display">{house.name}</h1>
          <p className="lead">{house.subtitle}</p>
          <p className="house-hero__price">
            {house.extraGuest && 'від '}<b>{money(house.price)}</b> / ніч · до {house.guests} осіб
          </p>
          {house.extraGuest && (
            <p>
              Базова ціна за {house.extraGuest.included} гостей. За кожного наступного гостя — +{money(house.extraGuest.price)} / ніч.
            </p>
          )}
        </div>
      </section>

      <div className="chips">
        {house.facts.map((f) => (
          <span key={f.label} className="chip">
            <Icon name={f.icon} size={18} /> {f.label}
          </span>
        ))}
      </div>

      <section className="container section">
        <p className="intro-text">{house.intro}</p>
      </section>

      {house.floors.map((floor, i) => (
        <section key={floor.title} className="section floor">
          <div className="container">
            <p className="kicker kicker--dark">0{i + 1}</p>
            <h2 className="display display--sm display--dark">{floor.title}</h2>
            <p className="muted-dark">{floor.text}</p>
          </div>
          <Carousel photos={floor.photos} />
          <ul className="container checklist">
            {floor.items.map((it) => (
              <li key={it}>
                <Check size={18} /> {it}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="container section">
        <h2 className="display display--sm display--dark">Зручності</h2>
        <ul className="amenities">
          {house.amenities.map((a) => (
            <li key={a}>
              <Check size={16} /> {a}
            </li>
          ))}
        </ul>
      </section>

      <section className="banner">
        <Img className="banner__img" photo={chan.photo} />
        <div className="slide__shade" />
        <div className="banner__content">
          <p className="kicker">Додатково · {money(chan.price)}</p>
          <h2 className="display display--md">{chan.title}</h2>
          <p className="lead">{chan.lead}</p>
          {chan.paragraphs.map((p) => (
            <p key={p} className="banner__text">
              {p}
            </p>
          ))}
          <p className="banner__note">
            <Clock size={18} /> {chan.note}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="display display--sm display--dark">Територія</h2>
          <p className="muted-dark">Велика альтанка з мʼякими вікнами, мангали, гойдалка та чаша для вогню.</p>
        </div>
        <Carousel photos={home.territory} />
      </section>

      <Availability house={house} />

      <section className="section booking" id="booking">
        <div className="container">
          <h2 className="display display--sm">Бронювання</h2>
          <p className="muted">Найшвидше — зателефонувати. Або залиште заявку, і ми передзвонимо.</p>
          <a className="btn btn--light booking__call" href={`tel:${contacts.phone}`}>
            <Phone size={18} /> {contacts.phoneLabel}
          </a>
          <BookingForm house={house} />
        </div>
      </section>

      <section className="container section">
        <h2 className="display display--sm display--dark">Питання</h2>
        <Faq />
      </section>

      {other && (
        <a className="next-house" href={href(other.slug)}>
          <Img photo={other.cover} />
          <div className="slide__shade" />
          <div className="next-house__body">
            <p className="kicker">Інший будинок</p>
            <h3 className="display display--sm">{other.name}</h3>
            <span className="btn btn--light">
              Переглянути <ArrowRight size={18} />
            </span>
          </div>
        </a>
      )}

      <Footer />
    </main>
  )
}
