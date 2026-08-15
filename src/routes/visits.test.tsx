import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { fetchDailyVisits } = vi.hoisted(() => ({ fetchDailyVisits: vi.fn() }))
vi.mock('../api/pageVisits', () => ({ fetchDailyVisits }))

import { VisitsRoute } from './visits'

afterEach(() => {
    fetchDailyVisits.mockReset()
})

describe('VisitsRoute', () => {
    it('loads the snapshot on mount', async () => {
        fetchDailyVisits.mockResolvedValue([
            { date: '2026-08-15', visits: 3, pages: [{ page: 'home', visits: 3 }] },
        ])

        render(<VisitsRoute />)

        expect(await screen.findByText('Sat, 15 Aug 2026')).toBeInTheDocument()
        expect(screen.getByText('3 visits')).toBeInTheDocument()
    })

    it('shows the empty snapshot rather than an error when the call fails', async () => {
        // A counting screen going down must not look like the app is broken.
        fetchDailyVisits.mockRejectedValue(new Error('nope'))

        render(<VisitsRoute />)

        await waitFor(() =>
            expect(screen.getByText(/no visits counted yet/i)).toBeInTheDocument()
        )
    })
})
