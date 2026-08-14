import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { registerServiceWorker } from './serviceWorker'
// The noticeboard's handwriting (REQ-008 free-form section) — self-hosted,
// so the public page never reaches out to a font CDN.
import '@fontsource/caveat/400.css'
import '@fontsource/caveat/700.css'
import './styles.scss'

// The offline shell (REQ-044). The call itself defers to the window's load
// event, so installing a worker never competes with the first paint.
registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
