import './assets/index.css'

import { StrictMode, lazy, Suspense, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

const OverlayView = lazy(() =>
  import('./views/OverlayView').then((m) => ({ default: m.OverlayView }))
)
const SettingsView = lazy(() =>
  import('./views/SettingsView').then((m) => ({ default: m.SettingsView }))
)

function App() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const handler = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  return (
    <Suspense fallback={<div className="h-screen w-screen bg-black" />}>
      {hash === '#/settings' ? <SettingsView /> : <OverlayView />}
    </Suspense>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
