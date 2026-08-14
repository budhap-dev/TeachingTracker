/*
 * AbhiTutor's service worker (REQ-044).
 *
 * The job is narrow: an installed app opened with no signal must show the
 * shell and an honest offline line instead of a white screen. It is NOT an
 * offline-first app — the data all comes from the API, and a cached page of
 * students would be worse than no page.
 *
 * The one rule that matters more than caching: a cached shell must never
 * outlive a deploy. Two mechanisms enforce that.
 *
 * 1. **The cache is named after the build.** The page registers this file as
 *    `/sw.js?v=<appVersion>`, so every deploy is a new script URL, installs a
 *    new worker, and `activate` deletes every cache that isn't this build's.
 * 2. **Navigations are network-first.** Online, the browser always gets the
 *    freshly deployed `index.html` and therefore the new hashed asset names —
 *    so a deploy reaches a client on its first reload. The cache only answers
 *    when the network does not.
 *
 * `/version.json` — the deploy's own freshness stamp — is never cached, so
 * "what is live here?" always answers from the server.
 *
 * Nothing about the dev/prod identity is hardcoded: the icons and badge are
 * cached under whatever paths this origin serves, and the dev deploy rewrites
 * those to `/icons-dev/` before the files ever reach a browser. The yellow
 * ring survives caching because the worker never names an icon.
 */

const build = new URL(self.location.href).searchParams.get('v') || 'local'
const CACHE = `abhitutor-shell-${build}`

/** The app shell: one entry, because the SPA renders every route from it. */
const SHELL = '/'

/** Immutable enough to serve from cache first — hashed bundles and assets. */
const isStaticAsset = (url) =>
    url.pathname.startsWith('/assets/') ||
    /\.(?:css|js|png|jpg|jpeg|gif|svg|ico|woff2?|webmanifest)$/.test(
        url.pathname
    )

/** Last resort: no network AND no cached shell (a first launch offline). */
const offlineFallback = () =>
    new Response(
        '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
            '<body style="font-family:system-ui;padding:2rem">' +
            "<h1>You're offline</h1>" +
            '<p>AbhiTutor needs a connection the first time it loads. ' +
            'Try again once you have signal.</p>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )

/**
 * The shell's entry assets, listed by the build (see vite.config.ts).
 *
 * Runtime caching alone would not do: on a first visit the page loads before
 * this worker controls it, so its own script and stylesheet requests never
 * reach the code below — and a visitor who then lost signal got a blank page
 * (observed, 2026-08-14). Precaching makes one online visit enough.
 */
const precacheList = () =>
    fetch('/precache.json', { cache: 'reload' })
        .then((response) => (response.ok ? response.json() : [SHELL]))
        // No manifest (a dev server, an older deploy): the shell alone still
        // beats nothing, and the worker must install either way.
        .catch(() => [SHELL])

self.addEventListener('install', (event) => {
    event.waitUntil(
        precacheList()
            .then((urls) =>
                caches.open(CACHE).then((cache) =>
                    // `reload` so each entry is taken from the network, never
                    // from an HTTP cache that may hold the previous deploy.
                    cache.addAll(
                        urls.map((url) => new Request(url, { cache: 'reload' }))
                    )
                )
            )
            // Take over straight away: waiting a generation would mean a
            // deploy needing two reloads to reach the client.
            .then(() => self.skipWaiting())
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((names) =>
                Promise.all(
                    names
                        .filter((name) => name !== CACHE)
                        .map((name) => caches.delete(name))
                )
            )
            .then(() => self.clients.claim())
    )
})

self.addEventListener('fetch', (event) => {
    const request = event.request
    if (request.method !== 'GET') {
        return
    }
    const url = new URL(request.url)
    // The API and the Microsoft sign-in flow are cross-origin: never ours to
    // cache, never ours to interfere with.
    if (url.origin !== self.location.origin) {
        return
    }
    // The freshness signal answers from the server or not at all.
    if (url.pathname === '/version.json') {
        return
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone()
                        caches.open(CACHE).then((cache) =>
                            cache.put(SHELL, copy)
                        )
                    }
                    return response
                })
                .catch(() =>
                    caches
                        .match(SHELL)
                        .then((cached) => cached || offlineFallback())
                )
        )
        return
    }

    if (isStaticAsset(url)) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((response) => {
                        if (response.ok) {
                            const copy = response.clone()
                            caches.open(CACHE).then((cache) =>
                                cache.put(request, copy)
                            )
                        }
                        return response
                    })
            )
        )
    }
})
