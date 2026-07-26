import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSiteContent, updateSiteContent } from './siteContent'
import { defaultSiteContent } from '../data/siteContent'

const jsonResponse = (body: unknown) =>
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body })

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('site-content api (REQ-008)', () => {
    it('fetches the document from /site-content', async () => {
        const fetchMock = jsonResponse(defaultSiteContent)
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchSiteContent()).resolves.toEqual(defaultSiteContent)
        expect(fetchMock).toHaveBeenCalledWith(
            '/site-content',
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('publishes via PUT /site-content and returns the sanitised copy', async () => {
        const published = { ...defaultSiteContent, siteName: 'Harbour Tuition' }
        const fetchMock = jsonResponse(published)
        vi.stubGlobal('fetch', fetchMock)

        await expect(updateSiteContent(published)).resolves.toEqual(published)
        expect(fetchMock).toHaveBeenCalledWith(
            '/site-content',
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify(published),
            })
        )
    })
})
