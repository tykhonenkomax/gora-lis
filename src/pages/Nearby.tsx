import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, MapPin, Navigation } from 'lucide-react'
import { categories, credits, museums, nearby, places, retreat, type Category } from '../data/nearby'
import { brand } from '../data/site'
import { Img } from '../components/Img'
import { Footer } from '../components/Footer'
import { href } from '../router'

export function Nearby() {
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const shown = filter === 'all' ? places : places.filter((p) => p.category === filter)
  const label = (c: Category) => categories.find((x) => x.id === c)?.label

  useEffect(() => {
    document.title = `Поблизу — ${brand.name}`
    return () => {
      document.title = `${brand.name} — котеджі у Верховині`
    }
  }, [])

  return (
    <main className="house nearby">
      <section className="house-hero">
        <Img className="house-hero__img" photo={nearby.hero} eager />
        <div className="slide__shade" />
        <div className="house-hero__content">
          <a className="back" href={href('home')}>
            <ArrowLeft size={18} /> Головна
          </a>
          <p className="kicker">Верховина та околиці</p>
          <h1 className="display">{nearby.title}</h1>
          <p className="lead">{nearby.lead}</p>
        </div>
      </section>

      <div className="filters" role="tablist">
        {[{ id: 'all' as const, label: 'Усе' }, ...categories].map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={filter === c.id}
            className={`chip chip--btn ${filter === c.id ? 'chip--active' : ''}`}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <section className="places container">
        {shown.map((p) => (
          <article key={p.id} className={`place ${p.photo ? '' : 'place--text'}`}>
            {p.photo && (
              <div className="place__media">
                <Img photo={p.photo} sizes="(max-width: 700px) 100vw, 33vw" />
                <span className="place__badge">{label(p.category)}</span>
              </div>
            )}
            <div className="place__body">
              {!p.photo && <p className="kicker kicker--dark">{label(p.category)}</p>}
              <h2>{p.title}</h2>
              <p className="place__where">
                <MapPin size={15} /> {p.where}
              </p>
              <p className="place__text">{p.text}</p>
              <div className="place__facts">
                {p.facts.map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </div>
              <div className="place__links">
                {p.map && (
                  <a className="btn btn--dark" href={p.map} target="_blank" rel="noreferrer">
                    <Navigation size={16} /> На мапі
                  </a>
                )}
                {p.link && (
                  <a className="btn btn--line" href={p.link.url} target="_blank" rel="noreferrer">
                    {p.link.label} <ArrowUpRight size={16} />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {(filter === 'all' || filter === 'culture') && (
        <section className="container section museums">
          <h2 className="display display--sm display--dark">Гуцульські музеї</h2>
          <ol>
            {museums.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="banner">
        <Img className="banner__img" photo={retreat.photo} />
        <div className="slide__shade" />
        <div className="banner__content">
          <p className="kicker">{brand.name}</p>
          <h2 className="display display--md">{retreat.title}</h2>
          <p className="banner__text">{retreat.text}</p>
        </div>
      </section>

      <section className="container credits">
        <p>Фото місць:</p>
        <ul>
          {credits.map((c) => (
            <li key={c.what}>
              <a href={c.url} target="_blank" rel="noreferrer">
                {c.what}
              </a>{' '}
              — {c.author}, {c.license}
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  )
}
