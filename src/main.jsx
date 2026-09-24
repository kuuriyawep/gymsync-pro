import React from 'react'
import ReactDOM from 'react-dom/client'
import { Sentry } from '@/lib/sentry'
import '@/lib/posthog'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Sentry.ErrorBoundary fallback={<div className="min-h-screen flex items-center justify-center p-6 text-center">Something went wrong. Please refresh the page.</div>}>
    <App />
  </Sentry.ErrorBoundary>
)
