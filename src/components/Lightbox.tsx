import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Photo } from '../data/site'

type Props = { photos: Photo[]; start: number; onClose: () => void }

export function Lightbox({ photos, start, onClose }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(start)

  useEffect(() => {
    const el = track.current
    if (el) el.scrollLeft = start * el.clientWidth
    document.body.classList.add('lock')
    return () => document.body.classList.remove('lock')
  }, [start])

  const go = (d: number) => {
    const el = track.current
    if (el) el.scrollBy({ left: d * el.clientWidth, behavior: 'smooth' })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="lightbox" role="dialog" aria-modal="true">
      <div
        className="lightbox__track"
        ref={track}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {photos.map((p) => (
          <figure key={p.lg} className="lightbox__slide">
            <img src={p.lg} alt={p.alt} loading="lazy" />
            <figcaption>{p.alt}</figcaption>
          </figure>
        ))}
      </div>
      <div className="lightbox__bar">
        <span>
          {index + 1} / {photos.length}
        </span>
        <button className="icon-btn" onClick={onClose} aria-label="Закрити">
          <X size={26} />
        </button>
      </div>
      <button className="icon-btn lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label="Назад">
        <ChevronLeft size={30} />
      </button>
      <button className="icon-btn lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label="Далі">
        <ChevronRight size={30} />
      </button>
    </div>
  )
}
