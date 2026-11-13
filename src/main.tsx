import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { Consent } from './app/screens/Account'
import { Privacy, Terms } from './app/screens/Legal'
import { startCloud } from './app/cloud'
import './index.css'

// The classic app stays reachable at ?legacy until its data is migrated to per-user accounts.
// It is lazy-loaded so its Supabase setup never runs (or throws) inside the new app.
const Legacy = lazy(() => import('./TrainingProgram'))
const isLegacy = new URLSearchParams(window.location.search).has('legacy')
// ChatGPT/Claude connector sign-in: Supabase's OAuth server redirects here for consent.
const path = window.location.pathname
const isConsent = path.startsWith('/oauth/consent')
if (!isLegacy) startCloud()

// Offline shell + reminders. Only in production builds: in dev it would cache Vite's modules.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* the app works without it */
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isLegacy ? (
      <Suspense fallback={null}>
        <Legacy />
      </Suspense>
    ) : isConsent ? (
      <Consent />
    ) : path === '/privacy' ? (
      <Privacy />
    ) : path === '/terms' ? (
      <Terms />
    ) : (
      <App />
    )}
  </React.StrictMode>,
)
