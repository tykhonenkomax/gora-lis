import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/lora'
import '@fontsource-variable/onest'
import './styles.css'
import './styles/mobile.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
