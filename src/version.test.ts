import { afterEach, describe, expect, it, vi } from 'vitest'
import packageJson from '../package.json'

afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
})

describe('appVersion', () => {
    it('falls back to the package version when no build version is injected', async () => {
        vi.stubEnv('VITE_APP_VERSION', '')
        vi.resetModules()
        const { appVersion } = await import('./version')
        expect(appVersion).toBe(packageJson.version)
    })

    it('uses the CI-injected build version when present', async () => {
        vi.stubEnv('VITE_APP_VERSION', '1.0.42')
        vi.resetModules()
        const { appVersion } = await import('./version')
        expect(appVersion).toBe('1.0.42')
    })
})
