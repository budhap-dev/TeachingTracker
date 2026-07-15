import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev Function App's CORS allowlist holds only its paired Static Web App
// origin, so a browser on localhost cannot call it directly. Proxying makes the
// call from the dev server instead, where CORS does not apply.
const DEV_API_ORIGIN = 'https://func-teachtracker-dev-pjlmrq.azurewebsites.net'

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 3000,
        // Only reached when VITE_API_BASE_URL is unset, which leaves the client
        // requesting a relative `/api/...`. Setting it to an absolute URL (e.g.
        // a local func host) bypasses this proxy.
        proxy: {
            '/api': {
                target: DEV_API_ORIGIN,
                changeOrigin: true,
            },
        },
    },
})
