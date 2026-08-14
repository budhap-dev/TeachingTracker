import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev Function App's CORS allowlist holds only its paired Static Web App
// origin, so a browser on localhost cannot call it directly. Proxying makes the
// call from the dev server instead, where CORS does not apply.
const DEV_API_ORIGIN = 'https://func-teachtracker-dev-pjlmrq.azurewebsites.net'

/**
 * Writes the shell's precache list for the service worker (REQ-044).
 *
 * Runtime caching alone is not enough: on a first visit the page loads before
 * the worker takes control, so its own asset requests never pass through it —
 * a visitor who installs and immediately loses signal would get a blank page
 * (observed, 2026-08-14). The worker reads this list on install instead, so
 * one online visit is enough to make every route work offline.
 *
 * Only entry assets: the hashed JS/CSS the shell cannot boot without. Images
 * and fonts stay on-demand — they degrade to a missing picture, not a blank
 * screen, and precaching them would cost every casual visitor the download.
 */
const precacheManifest = () => ({
    name: 'precache-manifest',
    apply: 'build' as const,
    generateBundle(_options: unknown, bundle: Record<string, unknown>) {
        // (regex, not endsWith: tsconfig.node's lib predates it — same
        // reason the manualChunks below uses indexOf.)
        const files = Object.keys(bundle)
            .filter((name) => /\.(?:js|css)$/.test(name))
            .map((name) => `/${name}`)
        this.emitFile({
            type: 'asset',
            fileName: 'precache.json',
            source: JSON.stringify(['/', ...files], null, 2),
        })
    },
})

export default defineConfig({
    plugins: [react(), precacheManifest()],
    css: {
        // Silences the legacy-js-api deprecation the default bridge prints on
        // every build; sass's modern API is the supported path.
        preprocessorOptions: {
            scss: { api: 'modern-compiler' },
        },
    },
    build: {
        rollupOptions: {
            output: {
                // Third-party code split out of the app chunk — MUI separately,
                // it alone outweighs everything else — so no chunk crosses the
                // 500 kB warning line and vendor updates don't re-download the app.
                // (indexOf: tsconfig.node's lib predates String.includes.)
                manualChunks: (id) => {
                    if (id.indexOf('node_modules') === -1) return undefined
                    return id.indexOf('@mui') !== -1 ||
                        id.indexOf('@emotion') !== -1
                        ? 'mui'
                        : 'vendor'
                },
            },
        },
    },
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
