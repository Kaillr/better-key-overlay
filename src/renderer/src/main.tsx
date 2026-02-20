import './assets/index.css'

import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

const OverlayView = lazy(() =>
  import('./views/OverlayView').then((m) => ({ default: m.OverlayView }))
)
const SettingsView = lazy(() =>
  import('./views/SettingsView').then((m) => ({ default: m.SettingsView }))
)

const isSettings = window.location.hash === '#/settings'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="h-screen w-screen bg-black" />}>
      {isSettings ? <SettingsView /> : <OverlayView />}
    </Suspense>
  </StrictMode>
)
