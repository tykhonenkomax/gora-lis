import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base — шлях репозиторію на GitHub Pages
export default defineConfig({
  base: '/maietok-pushkar/',
  plugins: [react()],
})
