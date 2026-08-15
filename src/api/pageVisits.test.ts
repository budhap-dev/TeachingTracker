import { afterEach, describe, expect, it, vi } from 'vitest'

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }))
vi.mock('./client', () => ({ apiRequest }))

import { countPageVisit, fetchDailyVisits } from './pageVisits'

afterEach(() => {
    apiRequest.mockReset()
})

describe('countPageVisit', () => {
    it('posts the visit and the page, and nothing else', () => {
        apiRequest.mockResolvedValue(undefined)

        countPageVisit('tab-1', 'pricing')

        expect(apiRequest).toHaveBeenCalledWith('/events', {
            method: 'POST',
            body: { visitId: 'tab-1', page: 'pricing' },
        })
    })

    it('swallows a failure — a visitor must never see counting break', async () => {
        apiRequest.mockRejectedValue(new Error('offline'))

        expect(() => countPageVisit('tab-1', 'home')).not.toThrow()
        // Let the rejection settle; an unhandled one would fail the run.
        await new Promise((resolve) => setTimeout(resolve, 0))
    })
})

describe('fetchDailyVisits', () => {
    it('asks for the default window', async () => {
        apiRequest.mockResolvedValue([])

        await fetchDailyVisits()

        expect(apiRequest).toHaveBeenCalledWith('/events/daily')
    })

    it('passes a narrower window through', async () => {
        apiRequest.mockResolvedValue([])

        await fetchDailyVisits(7)

        expect(apiRequest).toHaveBeenCalledWith('/events/daily?days=7')
    })
})
