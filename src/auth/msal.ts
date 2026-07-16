import {
    InteractionRequiredAuthError,
    PublicClientApplication,
} from '@azure/msal-browser'

/**
 * Entra ID sign-in (REQ-004, T3).
 *
 * Everything auth knows lives here, keyed off three build-time variables. When
 * they are absent — local `npm start`, tests, the verify skill — the app runs
 * in the auth-less mode it always had: no sign-in screen, no token attached,
 * which pairs with the API's AUTH_ENFORCED=false rollout phase. When baked in
 * (deployed dev/prod), MSAL signs the teacher in against the environment's SPA
 * app registration and every API call carries a bearer token.
 *
 * This module is deliberately React-free so `api/client.ts` (plain fetch) can
 * acquire tokens; the React layer wraps it via MsalProvider in App.tsx.
 */

export const authConfig = {
    tenantId: import.meta.env.VITE_ENTRA_TENANT_ID ?? '',
    clientId: import.meta.env.VITE_ENTRA_SPA_CLIENT_ID ?? '',
    apiScope: import.meta.env.VITE_ENTRA_API_SCOPE ?? '',
}

/** Whether this build carries Entra config. False => auth-less mode. */
export const isAuthConfigured = (): boolean =>
    authConfig.tenantId !== '' &&
    authConfig.clientId !== '' &&
    authConfig.apiScope !== ''

let instance: PublicClientApplication | undefined
let initialised: Promise<void> | undefined

/** The MSAL instance, or null in auth-less mode. Lazily created. */
export const getMsalInstance = (): PublicClientApplication | null => {
    if (!isAuthConfigured()) {
        return null
    }
    instance ??= new PublicClientApplication({
        auth: {
            clientId: authConfig.clientId,
            authority: `https://login.microsoftonline.com/${authConfig.tenantId}`,
            // Must byte-match a registered redirect URI — they are stored with
            // a trailing slash (Entra requires it on pathless URIs).
            redirectUri: `${window.location.origin}/`,
            postLogoutRedirectUri: `${window.location.origin}/`,
        },
        cache: { cacheLocation: 'sessionStorage' },
    })
    return instance
}

/**
 * MSAL v3+ refuses all calls before initialize(); MsalProvider initialises
 * too, but the sagas' first fetches can race it — both paths await this one
 * promise instead.
 */
const ensureInitialised = async (
    msal: PublicClientApplication
): Promise<void> => {
    initialised ??= msal.initialize()
    return initialised
}

/**
 * Access token for the API, or null when auth-less / not signed in yet.
 * Silent first (cache/refresh); an expired session falls back to a redirect,
 * which leaves the page — callers treat null as "request will not succeed".
 */
export const acquireApiToken = async (): Promise<string | null> => {
    const msal = getMsalInstance()
    if (!msal) {
        return null
    }
    await ensureInitialised(msal)

    const account = msal.getActiveAccount() ?? msal.getAllAccounts()[0]
    if (!account) {
        return null
    }

    try {
        const result = await msal.acquireTokenSilent({
            scopes: [authConfig.apiScope],
            account,
        })
        return result.accessToken
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            await msal.acquireTokenRedirect({ scopes: [authConfig.apiScope] })
        }
        return null
    }
}

/** Starts the sign-in redirect. */
export const signIn = async (): Promise<void> => {
    const msal = getMsalInstance()
    if (!msal) {
        return
    }
    await ensureInitialised(msal)
    await msal.loginRedirect({ scopes: [authConfig.apiScope] })
}

/** Signs out and returns to the app's public face. */
export const signOut = async (): Promise<void> => {
    const msal = getMsalInstance()
    if (!msal) {
        return
    }
    await ensureInitialised(msal)
    await msal.logoutRedirect()
}
