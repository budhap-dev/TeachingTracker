// Wakes the API while the app is still downloading (first-load work,
// 2026-11-12). The Function App sleeps when idle and takes ~3 s to wake;
// started here — from the page's HTML, before any of the app's JavaScript —
// that wait overlaps the download instead of following it. The answer is
// not used, so the request is opaque (no-cors) and failures are ignored.
// The URL comes from the build (vite.config.ts), on this script's tag.
;(function () {
    var script = document.currentScript
    var url = script && script.getAttribute('data-url')
    if (url && window.fetch) {
        fetch(url, { mode: 'no-cors', cache: 'no-store' }).catch(function () {})
    }
})()
