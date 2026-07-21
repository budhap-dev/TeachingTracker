import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    deleteTestimonial,
    fetchApprovedTestimonials,
    fetchPendingTestimonials,
    setTestimonialStatus,
    submitTestimonial,
} from './reviews'
import type { TestimonialInput } from './reviews'

const jsonResponse = (body: unknown) =>
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body })

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

const sampleInput: TestimonialInput = {
    authorName: 'Jo',
    role: 'Parent',
    subject: 'Mathematics',
    year: '10',
    rating: 5,
    quote: 'Wonderful.',
    website: '',
}

describe('reviews api', () => {
    it('fetches approved reviews from /testimonials', async () => {
        const fetchMock = jsonResponse([{ id: 1 }])
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchApprovedTestimonials()).resolves.toEqual([{ id: 1 }])
        expect(fetchMock).toHaveBeenCalledWith(
            '/testimonials',
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('fetches the pending queue from /testimonials/pending', async () => {
        const fetchMock = jsonResponse([{ id: 3 }])
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchPendingTestimonials()).resolves.toEqual([{ id: 3 }])
        expect(fetchMock).toHaveBeenCalledWith(
            '/testimonials/pending',
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('submits a review via POST /testimonials and resolves void', async () => {
        const fetchMock = jsonResponse({ ok: true })
        vi.stubGlobal('fetch', fetchMock)

        await expect(submitTestimonial(sampleInput)).resolves.toBeUndefined()
        expect(fetchMock).toHaveBeenCalledWith(
            '/testimonials',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(sampleInput),
            })
        )
    })

    it('moderates a review via PUT /testimonials/{id}', async () => {
        const fetchMock = jsonResponse({ id: 4, status: 'Approved' })
        vi.stubGlobal('fetch', fetchMock)

        await expect(
            setTestimonialStatus(4, 'Approved')
        ).resolves.toMatchObject({ status: 'Approved' })
        expect(fetchMock).toHaveBeenCalledWith(
            '/testimonials/4',
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({ status: 'Approved' }),
            })
        )
    })

    it('deletes a review via DELETE /testimonials/{id} and returns the id', async () => {
        const fetchMock = jsonResponse({ id: 7 })
        vi.stubGlobal('fetch', fetchMock)

        await expect(deleteTestimonial(7)).resolves.toBe(7)
        expect(fetchMock).toHaveBeenCalledWith(
            '/testimonials/7',
            expect.objectContaining({ method: 'DELETE' })
        )
    })
})
