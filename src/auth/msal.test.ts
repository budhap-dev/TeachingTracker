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
        mockMsal.getActiveAccount.mockReturnValue({ username: 't@example.com', tenantId: 'tenant-1' })
        mockMsal.acquireTokenSilent.mockResolvedValue({ accessToken: 'tok-1' })
        expect(await msal.acquireApiToken()).toBe('tok-1')
        expect(mockMsal.acquireTokenSilent).toHaveBeenCalledWith({
            scopes: ['api://api-1/access_as_teacher'],
            account: { username: 't@example.com', tenantId: 'tenant-1' },
        })
    })

    it('falls back to the tenant account when none is active', async () => {
        const msal = await loadModule(configuredEnv)
        mockMsal.getActiveAccount.mockReturnValue(null)
        mockMsal.getAllAccounts.mockReturnValue([
            { username: 'a@example.com', tenantId: 'tenant-1' },
        ])
        mockMsal.acquireTokenSilent.mockResolvedValue({ accessToken: 'tok-2' })
        expect(await msal.acquireApiToken()).toBe('tok-2')
    })

    // REQ-063: with OneDrive connected the cache holds a personal account
    // too, and it may come first. The API must still get the tenant one.
    it('never sends the personal (OneDrive) account to the API', async () => {
        const msal = await loadModule(configuredEnv)
        const personal = { username: 'p@outlook.com', tenantId: msal.MSA_TENANT_ID }
        const tenant = { username: 't@example.com', tenantId: 'tenant-1' }
        mockMsal.getActiveAccount.mockReturnValue(personal)
        mockMsal.getAllAccounts.mockReturnValue([personal, tenant])
        mockMsal.acquireTokenSilent.mockResolvedValue({ accessToken: 'tok-3' })
        expect(await msal.acquireApiToken()).toBe('tok-3')
        expect(mockMsal.acquireTokenSilent).toHaveBeenCalledWith(
            expect.objectContaining({ account: tenant })
        )
    })

    it('has no API token when only the personal account is cached', async () => {
        const msal = await loadModule(configuredEnv)
        mockMsal.getActiveAccount.mockReturnValue(null)
        mockMsal.getAllAccounts.mockReturnValue([
            { username: 'p@outlook.com', tenantId: msal.MSA_TENANT_ID },
        ])
        expect(await msal.acquireApiToken()).toBeNull()
        expect(mockMsal.acquireTokenSilent).not.toHaveBeenCalled()
    })

    it('redirects when the session needs interaction, and yields null', async () => {
        const { InteractionRequiredAuthError } = await import(
            '@azure/msal-browser'
        )
        const msal = await loadModule(configuredEnv)
        mockMsal.getActiveAccount.mockReturnValue({ username: 't@example.com', tenantId: 'tenant-1' })
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
        mockMsal.getActiveAccount.mockReturnValue({ username: 't@example.com', tenantId: 'tenant-1' })
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

describe('OneDrive (REQ-063)', () => {
    const oneDriveEnv = { ...configuredEnv, VITE_ONEDRIVE_FILES: 'true' }
    const personal = {
        username: 'p@outlook.com',
        tenantId: '9188040d-6c67-4c5b-b112-36a304b66dad',
    }

    it('is off without the build switch, and every call is a safe no-op', async () => {
        const msal = await loadModule(configuredEnv)
        mockMsal.getAllAccounts.mockReturnValue([personal])
        expect(msal.isOneDriveEnabled()).toBe(false)
        expect(await msal.isOneDriveConnected()).toBe(false)
        expect(await msal.acquireGraphToken()).toBeNull()
        await msal.connectOneDrive()
        expect(mockMsal.loginRedirect).not.toHaveBeenCalled()
    })

    it('is off in auth-less mode even with the switch on', async () => {
        const msal = await loadModule({ VITE_ONEDRIVE_FILES: 'true' })
        expect(msal.isOneDriveEnabled()).toBe(false)
    })

    it('reports connected only when a personal account is cached', async () => {
        const msal = await loadModule(oneDriveEnv)
        mockMsal.getAllAccounts.mockReturnValue([
            { username: 't@example.com', tenantId: 'tenant-1' },
        ])
        expect(await msal.isOneDriveConnected()).toBe(false)
        mockMsal.getAllAccounts.mockReturnValue([personal])
        expect(await msal.isOneDriveConnected()).toBe(true)
    })

    it('gets a Graph token silently, for the personal account, from /consumers', async () => {
        const msal = await loadModule(oneDriveEnv)
        mockMsal.getAllAccounts.mockReturnValue([
            { username: 't@example.com', tenantId: 'tenant-1' },
            personal,
        ])
        mockMsal.acquireTokenSilent.mockResolvedValue({ accessToken: 'graph-1' })
        expect(await msal.acquireGraphToken()).toBe('graph-1')
        expect(mockMsal.acquireTokenSilent).toHaveBeenCalledWith({
            scopes: msal.GRAPH_SCOPES,
            authority: 'https://login.microsoftonline.com/consumers',
            account: personal,
        })
    })

    it('has no Graph token when OneDrive is not connected', async () => {
        const msal = await loadModule(oneDriveEnv)
        mockMsal.getAllAccounts.mockReturnValue([])
        expect(await msal.acquireGraphToken()).toBeNull()
    })

    it('yields null rather than redirecting when consent is needed again', async () => {
        const { InteractionRequiredAuthError } = await import(
            '@azure/msal-browser'
        )
        const msal = await loadModule(oneDriveEnv)
        mockMsal.getAllAccounts.mockReturnValue([personal])
        mockMsal.acquireTokenSilent.mockRejectedValue(
            new InteractionRequiredAuthError()
        )
        expect(await msal.acquireGraphToken()).toBeNull()
        expect(mockMsal.acquireTokenRedirect).not.toHaveBeenCalled()
        expect(mockMsal.loginRedirect).not.toHaveBeenCalled()
    })

    it('connects by sending the teacher to pick their personal account', async () => {
        const msal = await loadModule(oneDriveEnv)
        await msal.connectOneDrive()
        expect(mockMsal.loginRedirect).toHaveBeenCalledWith({
            scopes: msal.GRAPH_SCOPES,
            authority: 'https://login.microsoftonline.com/consumers',
            prompt: 'select_account',
            redirectStartPage: window.location.href,
        })
    })
})
