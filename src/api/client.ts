/**
 * Thin fetch wrapper for the Teaching Tracker API.
 *
 * The only environment-specific knob is `VITE_API_BASE_URL`, baked in at build
 * time (one build per environment). When it is empty the app runs entirely on
 * local seed data — this keeps tests and offline dev working with no backend.
 *
 * Components never reference a hostname; they call typed helpers in
 * `students.ts` / `payments.ts`, which route through `apiRequest` here. To move
 * to a same-origin setup (e.g. a Static Web Apps linked backend) later, set
 * `VITE_API_BASE_URL` to an empty string so requests become relative `/api/...`.
 */

/** Configured API base URL, e.g. `https://func-teachtracker-dev-xxxx.azurewebsites.net/api`. */
export const getApiBaseUrl = (): string =>
    import.meta.env.VITE_API_BASE_URL ?? ''

/** Whether a backend is configured. When false, callers fall back to seed data. */
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

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
