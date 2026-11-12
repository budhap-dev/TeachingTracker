import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The dev Function App's CORS allowlist holds only its paired Static Web App
// origin, so a browser on localhost cannot call it directly. Proxying makes the
// call from the dev server instead, where CORS does not apply.
const DEV_API_ORIGIN = 'https://func-teachtracker-dev-pjlmrq.azurewebsites.net'

/** What only the About page's editing uses (see LazyEditors.tsx). */
const EDITOR_PACKAGES =
    /node_modules\/(@tiptap|tiptap-markdown|prosemirror-|markdown-it|linkify|orderedmap|rope-sequence|w3c-keyname|mdurl|uc\.micro|punycode|entities|crelt|react-easy-crop|normalize-wheel)/

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

/**
 * Wakes the API from the page's HTML (first-load work, 2026-11-12).
 *
 * The Function App sleeps when idle and takes ~3 s to answer its first
 * request; the app only asks after all its JavaScript has arrived, so the two
 * waits used to add up. This puts a connection hint and a tiny ping in the
 * <head>, so the API wakes while the app downloads. Only for a build pointed
 * at an absolute API URL — local dev (a relative /api) and tests get nothing.
 */
const warmApi = (apiBase: string) => ({
    name: 'warm-api',
    transformIndexHtml() {
        const origin = /^https:\/\/[^/]+/.exec(apiBase)?.[0]
        if (!origin) return []
        const base = apiBase.replace(/\/+$/, '')
        return [
            {
                tag: 'link',
                attrs: {
                    rel: 'preconnect',
                    href: origin,
                    crossorigin: '',
                },
                injectTo: 'head' as const,
            },
            {
                tag: 'script',
                attrs: {
                    src: '/warm-api.js',
                    async: true,
                    'data-url': `${base}/site-content`,
                },
                injectTo: 'head' as const,
            },
        ]
    },
})

export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        precacheManifest(),
        // loadEnv folds in shell variables (CI sets the URL that way),
        // which beat .env files, as everywhere in Vite.
        warmApi(loadEnv(mode, '.', 'VITE_').VITE_API_BASE_URL ?? ''),
    ],
    css: {
        // Silences the legacy-js-api deprecation the default bridge prints on
        // every build; sass's modern API is the supported path.
        preprocessorOptions: {
            scss: { api: 'modern-compiler' },
        },
    },
    build: {
        // Every chunk on the first load stays well under 500 kB. The one
        // over it is the About page's editor, which loads only when the
        // teacher edits (LazyEditors.tsx), so it is not worth a warning.
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                // Third-party code split out of the app chunk — MUI separately,
                // it alone outweighs everything else — so no chunk crosses the
                // 500 kB warning line and vendor updates don't re-download the app.
                // (indexOf: tsconfig.node's lib predates String.includes.)
                manualChunks: (id) => {
                    if (id.indexOf('node_modules') === -1) return undefined
                    // The About page's editing tools load only when the
                    // teacher edits (LazyEditors.tsx): they get a chunk of
                    // their own, or 'vendor' would drag them into the first
                    // load again.
                    if (EDITOR_PACKAGES.test(id)) return 'editor'
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
}))
