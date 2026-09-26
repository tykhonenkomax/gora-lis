import { useState } from 'react'
import { Expand } from 'lucide-react'
import type { Photo } from '../data/site'
import { Img } from './Img'
import { Lightbox } from './Lightbox'

// Горизонтальна стрічка фото зі свайпом; тап відкриває фото на весь екран.
export function Carousel({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      <div className="carousel">
        {photos.map((p, i) => (
          <button key={p.lg + i} className="carousel__item" onClick={() => setOpen(i)} aria-label={`Відкрити: ${p.alt}`}>
            <Img photo={p} sizes="(max-width: 700px) 85vw, 40vw" />
            <Expand className="carousel__zoom" size={18} />
          </button>
        ))}
      </div>
      {open !== null && <Lightbox photos={photos} start={open} onClose={() => setOpen(null)} />}
    </>
  )
}
