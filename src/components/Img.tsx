import type { Photo } from '../data/site'

type Props = { photo: Photo; eager?: boolean; className?: string; sizes?: string }

export function Img({ photo, eager, className, sizes = '100vw' }: Props) {
  return (
    <img
      className={className}
      src={photo.lg}
      srcSet={`${photo.sm} 720w, ${photo.lg} 1600w`}
      sizes={sizes}
      alt={photo.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      {...(eager ? { fetchPriority: 'high' as const } : {})}
    />
  )
}
