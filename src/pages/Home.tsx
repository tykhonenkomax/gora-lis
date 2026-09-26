import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { brand, home, houses, type Slide } from '../data/site'
import { nearby } from '../data/nearby'
import { Img } from '../components/Img'
import { useInView } from '../components/useInView'
import { href } from '../router'
import { Footer } from '../components/Footer'

const usePortrait = () => {
  const query = '(orientation: portrait)'
  const [portrait, setPortrait] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setPortrait(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return portrait
}

function Hero() {
  // Вертикальне відео гарно виглядає лише на телефоні; на широкому екрані — фото.
  const portrait = usePortrait()
  return (
    <section className="slide slide--hero in" id="top">
      {portrait ? (
        <video
          className="slide__media"
          src={home.heroVideo}
          poster={home.heroPoster.sm}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <Img className="slide__media" photo={home.heroWide} eager />
      )}
      <div className="slide__shade slide__shade--hero" />
      <div className="slide__content slide__content--center">
        <p className="kicker">Верховина · Карпати</p>
        <h1 className="display">{brand.name}</h1>
        <p className="lead">{brand.tagline}</p>
        <a className="btn btn--light" href={href('home', 'houses')}>
          Обрати будинок <ArrowRight size={18} />
        </a>
      </div>
      <a className="scroll-cue" href={href('home', home.slides[0].id)} aria-label="Гортати далі">
        <ChevronDown size={28} />
      </a>
    </section>
  )
}

function SlideSection({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  const [ref, inView] = useInView<HTMLElement>()
  return (
    <section className={`slide ${inView ? 'in' : ''}`} id={slide.id} ref={ref}>
      <Img className="slide__media" photo={slide.photo} />
      <div className="slide__shade" />
      <div className="slide__content">
        <p className="kicker">
          <span className="slide__count">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          {slide.kicker}
        </p>
        <h2 className="display display--md">{slide.title}</h2>
        <p className="lead">{slide.text}</p>
      </div>
    </section>
  )
}

function Houses() {
  return (
    <section className="houses" id="houses">
      <div className="container">
        <p className="kicker kicker--dark">Оренда</p>
        <h2 className="display display--md display--dark">Оберіть свій будинок</h2>
      </div>
      <div className="houses__grid">
        {houses.map((h) => (
          <a key={h.slug} className="house-card" href={href(h.slug)}>
            <Img photo={h.cover} sizes="(max-width: 700px) 100vw, 50vw" />
            <div className="house-card__shade" />
            <div className="house-card__body">
              <p className="kicker">до {h.guests} осіб</p>
              <h3>{h.name}</h3>
              <p>{h.subtitle}</p>
              <div className="house-card__foot">
                <span>
                  від <b>{h.price.toLocaleString('uk-UA')} грн</b> / ніч
                </span>
                <span className="house-card__arrow">
                  <ArrowRight size={20} />
                </span>
              </div>
            </div>
          </a>
        ))}
        <a className="house-card house-card--wide" href={href('nearby')}>
          <Img photo={nearby.hero} sizes="100vw" />
          <div className="house-card__shade" />
          <div className="house-card__body">
            <p className="kicker">Гори · ріки · смаки</p>
            <h3>Поблизу</h3>
            <div className="house-card__foot">
              <span>Що подивитись навколо</span>
              <span className="house-card__arrow">
                <ArrowRight size={20} />
              </span>
            </div>
          </div>
        </a>
      </div>
    </section>
  )
}

export function Home() {
  // Ефект «презентації»: кожен слайд прилипає до екрана під час гортання.
  useEffect(() => {
    document.documentElement.classList.add('snap')
    return () => document.documentElement.classList.remove('snap')
  }, [])

  return (
    <main>
      <Hero />
      {home.slides.map((s, i) => (
        <SlideSection key={s.id} slide={s} index={i} total={home.slides.length} />
      ))}
      <div className="snap-end">
        <Houses />
        <Footer />
      </div>
    </main>
  )
}
