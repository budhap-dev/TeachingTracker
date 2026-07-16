import { afterEach, describe, expect, it, vi } from 'vitest'

// The mock instance every PublicClientApplication constructor call returns.
const mockMsal = {
    initialize: vi.fn().mockResolvedValue(undefined),
    getActiveAccount: vi.fn(),
    getAllAccounts: vi.fn().mockReturnValue([]),
    acquireTokenSilent: vi.fn(),
    acquireTokenRedirect: vi.fn().mockResolvedValue(undefined),
    loginRedirect: vi.fn().mockResolvedValue(undefined),
    logoutRedirect: vi.fn().mockResolvedValue(undefined),
}
const constructorSpy = vi.fn()

vi.mock('@azure/msal-browser', () => {
    class InteractionRequiredAuthError extends Error {}
    class PublicClientApplication {
        constructor(config: unknown) {
            constructorSpy(config)
            return mockMsal as unknown as PublicClientApplication
        }
    }
    return { InteractionRequiredAuthError, PublicClientApplication }
})

/** Imports a fresh copy of the module under the given env. */
const loadModule = async (env: Record<string, string>) => {
    vi.resetModules()
    for (const [key, value] of Object.entries(env)) {
        vi.stubEnv(key, value)
    }
    return import('./msal')
}

const configuredEnv = {
    VITE_ENTRA_TENANT_ID: 'tenant-1',
    VITE_ENTRA_SPA_CLIENT_ID: 'spa-1',
    VITE_ENTRA_API_SCOPE: 'api://api-1/access_as_teacher',
}

afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
})

describe('auth-less mode (no Entra config)', () => {
    it('reports unconfigured and returns no instance or token', async () => {
        const msal = await loadModule({})
        expect(msal.isAuthConfigured()).toBe(false)
        expect(msal.getMsalInstance()).toBeNull()
        expect(await msal.acquireApiToken()).toBeNull()
    })

    it('sign-in and sign-out are safe no-ops', async () => {
        const msal = await loadModule({})
        await msal.signIn()
        await msal.signOut()
        expect(mockMsal.loginRedirect).not.toHaveBeenCalled()
        expect(mockMsal.logoutRedirect).not.toHaveBeenCalled()
    })

    it('stays auth-less when the config is only partial', async () => {
        const msal = await loadModule({ VITE_ENTRA_TENANT_ID: 'tenant-only' })
        expect(msal.isAuthConfigured()).toBe(false)
    })
})

describe('configured mode', () => {
    it('creates one instance, against the tenant, with a trailing-slash redirect', async () => {
        const msal = await loadModule(configuredEnv)
        const first = msal.getMsalInstance()
        expect(first).not.toBeNull()
        expect(msal.getMsalInstance()).toBe(first)
        expect(constructorSpy).toHaveBeenCalledTimes(1)
        const config = constructorSpy.mock.calls[0][0]
        expect(config.auth.authority).toBe(
            'https://login.microsoftonline.com/tenant-1'
        )
        expect(config.auth.redirectUri).toMatch(/\/$/)
    })

    it('returns null with no signed-in account (after initialising)', async () => {
        const msal = await loadModule(configuredEnv)
        mockMsal.getActiveAccount.mockReturnValue(null)
        mockMsal.getAllAccounts.mockReturnValue([])
        expect(await msal.acquireApiToken()).toBeNull()
        expect(mockMsal.initialize).toHaveBeenCalled()
    })

    it('returns the token from a silent acquisition', async () => {
        const msal = await loadModule(configuredEnv)
        mockMsal.getActiveAccount.mockReturnValue({ username: 't@example.com' })
        mockMsal.acquireTokenSilent.mockResolvedValue({ accessToken: 'tok-1' })
        expect(await msal.acquireApiToken()).toBe('tok-1')
        expect(mockMsal.acquireTokenSilent).toHaveBeenCalledWith({
            scopes: ['api://api-1/access_as_teacher'],
            account: { username: 't@example.com' },
        })
    })

    it('falls back to the first known account when none is active', async () => {
        const msal = await loadModule(configuredEnv)
        mockMsal.getActiveAccount.mockReturnValue(null)
        mockMsal.getAllAccounts.mockReturnValue([{ username: 'a@example.com' }])
        mockMsal.acquireTokenSilent.mockResolvedValue({ accessToken: 'tok-2' })
        expect(await msal.acquireApiToken()).toBe('tok-2')
    })

    it('redirects when the session needs interaction, and yields null', async () => {
        const { InteractionRequiredAuthError } = await import(
            '@azure/msal-browser'
        )
        const msal = await loadModule(configuredEnv)
        mockMsal.getActiveAccount.mockReturnValue({ username: 't@example.com' })
        mockMsal.acquireTokenSilent.mockRejectedValue(
            new InteractionRequiredAuthError()
        )
        expect(await msal.acquireApiToken()).toBeNull()
        expect(mockMsal.acquireTokenRedirect).toHaveBeenCalledWith({
            scopes: ['api://api-1/access_as_teacher'],
        })
    })

    it('yields null on other acquisition failures without redirecting', async () => {
        const msal = await loadModule(configuredEnv)
        mockMsal.getActiveAccount.mockReturnValue({ username: 't@example.com' })
        mockMsal.acquireTokenSilent.mockRejectedValue(new Error('offline'))
        expect(await msal.acquireApiToken()).toBeNull()
        expect(mockMsal.acquireTokenRedirect).not.toHaveBeenCalled()
    })

    it('sign-in and sign-out drive the MSAL redirects', async () => {
        const msal = await loadModule(configuredEnv)
        await msal.signIn()
        expect(mockMsal.loginRedirect).toHaveBeenCalledWith({
            scopes: ['api://api-1/access_as_teacher'],
        })
        await msal.signOut()
        expect(mockMsal.logoutRedirect).toHaveBeenCalled()
    })
})
