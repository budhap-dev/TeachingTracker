import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from './serviceWorker'
import { appVersion } from './version'

/**
 * Vitest builds run with `import.meta.env.PROD` false — the same branch a
 * local `npm run dev` takes, which is exactly the guard worth pinning: a
 * worker in front of vite's module server turns every edit into a cache
 * mystery (REQ-044).
 */

const withRegister = () => {
    const register = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'serviceWorker', {
        value: { register },
        configurable: true,
    })
    return register
}

afterEach(() => {
    vi.unstubAllEnvs()
    Reflect.deleteProperty(navigator, 'serviceWorker')
})

describe('registerServiceWorker', () => {
    it('registers nothing in a dev build', () => {
        const register = withRegister()

        registerServiceWorker()
        window.dispatchEvent(new Event('load'))

        expect(register).not.toHaveBeenCalled()
    })

    it('registers the worker under the build version, so a deploy replaces it', () => {
        vi.stubEnv('PROD', true)
        const register = withRegister()

        registerServiceWorker()
        // Deferred to load: installing must not compete with the first paint.
        expect(register).not.toHaveBeenCalled()
        window.dispatchEvent(new Event('load'))

        expect(register).toHaveBeenCalledWith(
            `/sw.js?v=${encodeURIComponent(appVersion)}`
        )
    })

    it('survives a browser with no service worker support', () => {
        vi.stubEnv('PROD', true)

        expect(() => {
            registerServiceWorker()
            window.dispatchEvent(new Event('load'))
        }).not.toThrow()
    })
})
