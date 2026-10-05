import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base — шлях репозиторію на GitHub Pages
export default defineConfig({
  base: '/gora-lis/',
  plugins: [react()],
})
