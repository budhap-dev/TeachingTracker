import {
    type AccountInfo,
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

/**
 * Every personal Microsoft account signs in under this tenant id. The
 * teacher's OneDrive (REQ-063) is reached through such an account, which
 * sits in the MSAL cache beside the tenant one.
 */
export const MSA_TENANT_ID = '9188040d-6c67-4c5b-b112-36a304b66dad'
const CONSUMERS_AUTHORITY = 'https://login.microsoftonline.com/consumers'
/** The narrowest Graph scope: the app's own folder, nothing else. */
export const GRAPH_SCOPES = [
    'https://graph.microsoft.com/Files.ReadWrite.AppFolder',
]

/** Whether this build carries Entra config. False => auth-less mode. */
export const isAuthConfigured = (): boolean =>
    authConfig.tenantId !== '' &&
    authConfig.clientId !== '' &&
    authConfig.apiScope !== ''

/**
 * Whether files on classes (REQ-063) are switched on for this build. Off
 * wherever the SPA registration does not accept personal accounts yet.
 */
export const isOneDriveEnabled = (): boolean =>
    isAuthConfigured() && import.meta.env.VITE_ONEDRIVE_FILES === 'true'

/**
 * The teacher is the *tenant* account. Once OneDrive is connected the cache
 * also holds a personal account, so "any account" no longer means "the
 * teacher" — every check of who is signed in goes through this.
 */
export const isTeacherAccount = (account: AccountInfo): boolean =>
    account.tenantId === authConfig.tenantId

const isOneDriveAccount = (account: AccountInfo): boolean =>
    account.tenantId === MSA_TENANT_ID

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

    // Never "the first account": with OneDrive connected that may be the
    // personal one, and the API would see the wrong identity (REQ-063 spike).
    const active = msal.getActiveAccount()
    const account =
        active && isTeacherAccount(active)
            ? active
            : msal.getAllAccounts().find(isTeacherAccount)
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

/** Whether a personal account for OneDrive is in the cache. */
export const isOneDriveConnected = async (): Promise<boolean> => {
    const msal = getMsalInstance()
    if (!msal || !isOneDriveEnabled()) {
        return false
    }
    await ensureInitialised(msal)
    return msal.getAllAccounts().some(isOneDriveAccount)
}

/**
 * Graph token for the teacher's OneDrive app folder (REQ-063), or null when
 * OneDrive is not connected or needs the teacher again. Never redirects: a
 * redirect in the middle of an upload would throw away the picked files, so
 * the caller offers "Connect OneDrive" instead.
 */
export const acquireGraphToken = async (): Promise<string | null> => {
    const msal = getMsalInstance()
    if (!msal || !isOneDriveEnabled()) {
        return null
    }
    await ensureInitialised(msal)

    const account = msal.getAllAccounts().find(isOneDriveAccount)
    if (!account) {
        return null
    }
    try {
        const result = await msal.acquireTokenSilent({
            scopes: GRAPH_SCOPES,
            authority: CONSUMERS_AUTHORITY,
            account,
        })
        return result.accessToken
    } catch {
        return null
    }
}

/**
 * Sends the teacher to Microsoft to pick their personal account and consent
 * to the app folder — once, the first time they attach a file, not at
 * sign-in. Comes back to the page it left.
 */
export const connectOneDrive = async (): Promise<void> => {
    const msal = getMsalInstance()
    if (!msal || !isOneDriveEnabled()) {
        return
    }
    await ensureInitialised(msal)
    await msal.loginRedirect({
        scopes: GRAPH_SCOPES,
        authority: CONSUMERS_AUTHORITY,
        prompt: 'select_account',
        redirectStartPage: window.location.href,
    })
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
