import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchOutcomes } from './outcomes'

const outcomes = {
    studentsTaught: 9,
    sessionsDelivered: 120,
    hoursDelivered: 110,
    subjectsCount: 4,
    averageRating: 4.9,
    reviewCount: 12,
}

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('outcomes api (REQ-020)', () => {
    it('fetches the tallies from /outcomes', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => outcomes,
        })
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchOutcomes()).resolves.toEqual(outcomes)
        expect(fetchMock).toHaveBeenCalledWith(
            '/outcomes',
            expect.objectContaining({ method: 'GET' })
        )
    })
})
