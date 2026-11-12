import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    ApiError,
    apiRequest,
    getApiBaseUrl,
    isApiConfigured,
} from './client'
// The real module: in tests no Entra config exists, so it yields null (the
// auth-less path) — the token test spies on this exact binding instead.
import * as auth from '../auth/msal'

const mockFetch = (body: unknown, ok = true, status = 200) => {
    const fetchMock = vi.fn().mockResolvedValue({
        ok,
        status,
        json: async () => body,
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('api client', () => {
    it('reports the base url as empty and unconfigured by default', () => {
        expect(getApiBaseUrl()).toBe('')
        expect(isApiConfigured()).toBe(false)
    })

    it('reports the configured base url when the env var is set', () => {
        vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api')
        expect(getApiBaseUrl()).toBe('https://api.example.com/api')
        expect(isApiConfigured()).toBe(true)
    })

    it('performs a GET request (no body) against the base url', async () => {
        vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api')
        const fetchMock = mockFetch([{ id: 1 }])

        const result = await apiRequest<{ id: number }[]>('/students')

        expect(result).toEqual([{ id: 1 }])
        // No Content-Type without a body: a bare GET stays a "simple"
        // request, so the browser skips the CORS preflight round trip.
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.example.com/api/students',
            {
                method: 'GET',
                headers: {},
                body: undefined,
            }
        )
    })

    it('serialises the body for a POST request', async () => {
        const fetchMock = mockFetch({ id: 7 })

        await apiRequest('/students', { method: 'POST', body: { name: 'Jo' } })

        expect(fetchMock).toHaveBeenCalledWith('/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Jo' }),
        })
    })

    it('carries the bearer token once sign-in has produced one', async () => {
        vi.spyOn(auth, 'acquireApiToken').mockResolvedValueOnce('token-123')
        const fetchMock = mockFetch([])

        await apiRequest('/students')

        expect(fetchMock).toHaveBeenCalledWith('/students', {
            method: 'GET',
            headers: { Authorization: 'Bearer token-123' },
            body: undefined,
        })
    })

    it('resolves a 204 without trying to parse a body', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 204,
            json: async () => {
                throw new SyntaxError('Unexpected end of JSON input')
            },
        })
        vi.stubGlobal('fetch', fetchMock)
        await expect(
            apiRequest('/reminders/1', { method: 'DELETE' })
        ).resolves.toBeUndefined()
    })

    it('throws an ApiError on a non-ok response', async () => {
        mockFetch({ error: 'nope' }, false, 404)

        await expect(apiRequest('/students/999')).rejects.toMatchObject({
            name: 'ApiError',
            status: 404,
        })
        await expect(apiRequest('/students/999')).rejects.toBeInstanceOf(
            ApiError
        )
    })

    it("says what the API said, not just its status code", async () => {
        // A visitor lost a review to "failed with status 400" while the API
        // was explaining the problem in the body all along (2026-08-15).
        mockFetch({ error: 'quote must be 600 characters or fewer.' }, false, 400)

        await expect(apiRequest('/testimonials')).rejects.toThrow(
            'quote must be 600 characters or fewer.'
        )
    })

    it('falls back to the status when the API says nothing useful', async () => {
        mockFetch('<html>gateway timeout</html>', false, 504)

        await expect(apiRequest('/students')).rejects.toThrow(
            /failed with status 504/
        )
    })
})
