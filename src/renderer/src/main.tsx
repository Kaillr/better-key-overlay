import './assets/index.css'

import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { OverlayView } from './views/OverlayView'
import { SettingsView } from './views/SettingsView'

function App() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const handler = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  return hash === '#/settings' ? <SettingsView /> : <OverlayView />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
