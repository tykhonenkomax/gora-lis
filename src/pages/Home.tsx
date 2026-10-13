import { useEffect, useRef } from 'react'
import { ArrowRight, MapPin, Phone } from 'lucide-react'
import { brand, contacts, home, houses, type Slide } from '../data/site'
import { nearby } from '../data/nearby'
import { Img } from '../components/Img'
import { useInView } from '../components/useInView'
import { href } from '../router'
import { Footer } from '../components/Footer'
import { Availability } from '../components/Availability'

function Hero() {
  return (
    <section className="hero slide--hero" id="top" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="hero__eyebrow"><span /> Ваш відпочинок у Карпатах</p>
        <h1 className="hero__title" id="hero-title">{brand.name}</h1>
        <p className="hero__tagline">Ближче до природи.<br />Ближче до себе.</p>
        <p className="hero__description">Два будинки у Верховині — для повільних ранків, теплих вечорів і відпочинку в чані просто неба.</p>
        <div className="hero__actions">
          <a className="btn hero__primary" href={href('home', 'houses')}>Обрати будинок <ArrowRight size={18} /></a>
          <a className="btn btn--outline" href={href('home', 'availability')}>Вільні дати</a>
        </div>
        <div className="hero__details">
          <div className="hero__facts"><span><strong>02</strong> будинки</span><span><strong>від 2</strong> ночей</span></div>
          <a className="hero__phone" href={`tel:${contacts.phone}`}><Phone size={17} />{contacts.phoneLabel}</a>
        </div>
      </div>
      <figure className="hero__visual">
        <Img className="slide__media" photo={home.heroWide} eager sizes="(max-width: 899px) 100vw, 58vw" />
        <figcaption className="hero__caption"><span>Atmosfera <span className="hero__caption-plus">+</span> Panorama</span><span><MapPin size={15} /> Верховина</span></figcaption>
      </figure>
    </section>
  )
}

function SlideSection({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  const [ref, inView] = useInView<HTMLElement>()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (inView) {
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [inView])

  return (
    <section className={`slide ${slide.video ? 'slide--video' : ''} ${inView ? 'in' : ''}`} id={slide.id} ref={ref}>
      {slide.video ? (
        <video
          ref={videoRef}
          className="slide__media"
          src={slide.video}
          poster={slide.photo.lg}
          muted
          loop
          playsInline
          preload="none"
          aria-label={slide.title}
        />
      ) : (
        <Img className="slide__media" photo={slide.photo} />
      )}
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
        {slide.description && <p className="slide__description">{slide.description}</p>}
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
  return (
    <main className="home">
      <Hero />
      <div className="snap-end">
        <Houses />
        <Availability showBooking />
      </div>
      {home.slides.map((s, i) => (
        <SlideSection key={s.id} slide={s} index={i} total={home.slides.length} />
      ))}
      <div className="snap-end">
        <Footer />
      </div>
    </main>
  )
}
