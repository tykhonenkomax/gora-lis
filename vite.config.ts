import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages використовує підпапку, Netlify — корінь домену.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/gora-lis/',
  plugins: [react()],
})
