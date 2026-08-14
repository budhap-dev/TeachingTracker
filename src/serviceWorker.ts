import { appVersion } from './version'

/**
 * Registers the offline shell worker (REQ-044).
 *
 * The version rides in the URL: a new deploy is a new script URL, so the
 * browser installs a fresh worker and `sw.js` names its cache after the same
 * build — the mechanism that stops a cached shell outliving a deploy.
 *
 * Never in `npm run dev`: vite serves modules straight from source there, and
 * a worker sitting in front of them turns every edit into a cache mystery.
 *
 * Registration failing is not worth a broken app — an uninstalled worker just
 * means no offline shell, which is where the app was before this story.
 */
export const registerServiceWorker = () => {
    // Captured now, not inside the listener: the decision to register was
    // made here, so the container this call meant is the one it uses.
    const container = navigator.serviceWorker
    if (!import.meta.env.PROD || !container) {
        return
    }
    window.addEventListener('load', () => {
        void container
            .register(`/sw.js?v=${encodeURIComponent(appVersion)}`)
            .catch(() => undefined)
    })
}
