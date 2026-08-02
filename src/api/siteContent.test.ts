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

    it('normalises a document from an older API: empty bio/faq, keys appended', async () => {
        // A published document from before REQ-021/025 — no bio, no faq,
        // five-key section order.
        const {
            bio: _bio,
            faq: _faq,
            ...older
        } = defaultSiteContent
        const fetchMock = jsonResponse({
            ...older,
            sectionOrder: [
                'hero',
                'subjects',
                'journey',
                'approach',
                'freeform',
            ],
        })
        vi.stubGlobal('fetch', fetchMock)

        const served = await fetchSiteContent()
        // Empty — never the bundled drafts the owner hasn't approved.
        expect(served.faq).toEqual([])
        expect(served.bio.dbsChecked).toBe(false)
        expect(served.bio.heading).toBe('')
        expect(served.sectionOrder).toEqual([
            'hero',
            'subjects',
            'journey',
            'approach',
            'freeform',
            'bio',
            'faq',
        ])
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
