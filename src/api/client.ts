/**
 * Thin fetch wrapper for the Teaching Tracker API.
 *
 * The only environment-specific knob is `VITE_API_BASE_URL`, baked in at build
 * time (one build per environment). It must include the `/api` suffix, because
 * callers pass bare paths (`/students`); an empty value would request
 * `/students`, which the dev server answers with `index.html`.
 *
 * Locally, `.env.development` sets it to `/api` so calls stay same-origin and
 * hit the dev-server proxy in `vite.config.ts`, which forwards to the dev API.
 *
 * Components never reference a hostname; they call typed helpers in
 * `students.ts` / `payments.ts`, which route through `apiRequest` here.
 */

import { acquireApiToken } from '../auth/msal'

/** Configured API base URL, e.g. `https://func-teachtracker-dev-xxxx.azurewebsites.net/api`. */
export const getApiBaseUrl = (): string =>
    import.meta.env.VITE_API_BASE_URL ?? ''

/** Whether an absolute API base URL is configured (false => relative requests). */
export const isApiConfigured = (): boolean => getApiBaseUrl() !== ''

/** Error thrown when the API responds with a non-2xx status. */
export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

interface RequestOptions {
    method?: string
    body?: unknown
}

/** Performs a JSON request against the configured API base URL. */
export async function apiRequest<T>(
    path: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = 'GET', body } = options

    // Null in auth-less mode (no Entra config baked in) — the request goes out
    // bare, exactly as before REQ-004.
    const token = await acquireApiToken()

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    })

    if (!response.ok) {
        throw new ApiError(
            response.status,
            `API ${method} ${path} failed with status ${response.status}`
        )
    }

    return (await response.json()) as T
}
