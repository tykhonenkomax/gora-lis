# Маєток Пушкар

Сайт котеджів у Верховині: React + TypeScript + Vite. Деплой на GitHub Pages при кожному push у `main`.

## Розробка

```sh
pnpm install
pnpm dev
```

## Де що змінювати

- `src/data/site.ts` — тексти, ціни, будинки, чан, FAQ, телефон, фото.
- `src/data/nearby.ts` — сторінка «Поблизу».
- `public/photos/` — фото у WebP: `<name>-lg.webp` (~1600px) і `<name>-sm.webp` (~720px).
- `public/video/` — відео для головної (показується на телефоні).
