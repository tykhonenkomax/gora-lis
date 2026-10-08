import { lazy, Suspense, useEffect } from 'react'
import { houses } from './data/site'
import { scrollToSection, useRoute } from './router'
import { Header } from './components/Header'
import { CallBar } from './components/CallBar'
import { Home } from './pages/Home'
import { HousePage } from './pages/HousePage'
import { Nearby } from './pages/Nearby'

const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })))

export default function App() {
  const route = useRoute()
  const house = houses.find((h) => h.slug === route.page)

  useEffect(() => {
    if (route.section) {
      const id = route.section
      requestAnimationFrame(() => scrollToSection(id))
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [route.page, route.section, route.nonce])

  if (route.page === 'admin') return <Suspense fallback={<main className="admin-panel">Завантажуємо панель…</main>}><Admin /></Suspense>

  return (
    <>
      <Header />
      {house ? <HousePage key={house.slug} house={house} /> : route.page === 'nearby' ? <Nearby /> : <Home />}
      {house ? <CallBar page={house.slug} section="booking" /> : <CallBar page="home" section="houses" />}
    </>
  )
}
