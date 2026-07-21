import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchContact, updateContact } from './contact'

const jsonResponse = (body: unknown) =>
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body })

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('contact api', () => {
    it('fetches the contact details from /contact', async () => {
        const fetchMock = jsonResponse({ email: 'a@b.com', phone: '123' })
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchContact()).resolves.toEqual({
            email: 'a@b.com',
            phone: '123',
        })
        expect(fetchMock).toHaveBeenCalledWith(
            '/contact',
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('updates the details via PUT /contact and returns the saved record', async () => {
        const fetchMock = jsonResponse({ email: 'new@b.com' })
        vi.stubGlobal('fetch', fetchMock)

        const input = { email: 'new@b.com', phone: '' }
        await expect(updateContact(input)).resolves.toEqual({
            email: 'new@b.com',
        })
        expect(fetchMock).toHaveBeenCalledWith(
            '/contact',
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify(input),
            })
        )
    })
})
