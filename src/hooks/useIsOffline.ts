import { useEffect, useState } from 'react'

/**
 * Whether the app can currently reach its own origin (REQ-044).
 *
 * `navigator.onLine` is not enough on its own, and the case it gets wrong is
 * precisely the one this story is about: a launch with no signal, served from
 * the service worker's cache, reports `onLine === true` (verified in Chrome —
 * the page never touched the network, so nothing told it the network is
 * gone). Trusting it would mean the offline launch shows no offline line.
 *
 * So the flag is a hint and the probe is the answer: fetch `/version.json`,
 * the deploy stamp the worker deliberately never caches, so it can only be
 * answered by the server. Any response at all — including a 404 on a dev
 * machine where nothing stamped it — proves the server is reachable. Only a
 * rejected request means offline.
 */
export const useIsOffline = (): boolean => {
    const [offline, setOffline] = useState(() => navigator.onLine === false)

    useEffect(() => {
        let cancelled = false
        const settle = (value: boolean) => {
            if (!cancelled) {
                setOffline(value)
            }
        }
        const probe = () => {
            fetch('/version.json', { cache: 'no-store' })
                .then(() => settle(false))
                .catch(() => settle(true))
        }
        probe()

        // The events are still worth listening to: they are instant, while a
        // probe costs a round trip. A regained connection re-probes, because
        // "the OS sees a network" is not "the site is reachable".
        const goOnline = () => {
            settle(false)
            probe()
        }
        const goOffline = () => settle(true)
        window.addEventListener('online', goOnline)
        window.addEventListener('offline', goOffline)
        return () => {
            cancelled = true
            window.removeEventListener('online', goOnline)
            window.removeEventListener('offline', goOffline)
        }
    }, [])

    return offline
}
