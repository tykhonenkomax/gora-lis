import { useEffect, useRef } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { brand, home, houses, type Slide } from '../data/site'
import { nearby } from '../data/nearby'
import { Img } from '../components/Img'
import { useInView } from '../components/useInView'
import { href } from '../router'
import { Footer } from '../components/Footer'
import { Availability } from '../components/Availability'

function Hero() {
  return (
    <section className="slide slide--hero in" id="top">
      <Img className="slide__media" photo={home.heroWide} eager />
      <div className="slide__shade slide__shade--hero" />
      <div className="slide__content slide__content--center">
        <p className="kicker">Верховина · Карпати</p>
        <h1 className="display">{brand.name}</h1>
        <p className="lead">{brand.tagline}</p>
        <a className="btn btn--light" href={href('home', 'houses')}>
          Обрати будинок <ArrowRight size={18} />
        </a>
      </div>
      <a className="scroll-cue" href={href('home', 'houses')} aria-label="Переглянути будинки">
        <ChevronDown size={28} />
      </a>
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
  // Ефект «презентації»: кожен слайд прилипає до екрана під час гортання.
  useEffect(() => {
    document.documentElement.classList.add('snap')
    return () => document.documentElement.classList.remove('snap')
  }, [])

  return (
    <main>
      <Hero />
      <div className="snap-end">
        <Houses />
        <Availability />
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
