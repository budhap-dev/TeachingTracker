import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VisitsSnapshotView } from './VisitsSnapshotView'

const daily = [
    {
        date: '2026-08-15',
        visits: 4,
        pages: [
            { page: 'home' as const, visits: 4 },
            { page: 'pricing' as const, visits: 2 },
        ],
    },
    { date: '2026-08-14', visits: 1, pages: [{ page: 'home' as const, visits: 1 }] },
]

describe('VisitsSnapshotView', () => {
    it('reads day by day, page by page, in the teacher’s words', () => {
        render(<VisitsSnapshotView daily={daily} loading={false} />)

        expect(screen.getByText('Sat, 15 Aug 2026')).toBeInTheDocument()
        expect(screen.getByText('4 visits')).toBeInTheDocument()
        expect(screen.getByText('1 visit')).toBeInTheDocument()
        // Page keys are route ids; the teacher sees names.
        expect(screen.getAllByText('Home')).toHaveLength(2)
        expect(screen.getByText('Pricing')).toBeInTheDocument()
    })

    it('says visits, never users or people (REQ-058)', () => {
        // The whole design rests on counting tabs, not identifying anyone —
        // so the screen must not imply it knows who came.
        render(<VisitsSnapshotView daily={daily} loading={false} />)

        const page = document.body.textContent ?? ''
        expect(page).toMatch(/counts visits, not people/i)
        expect(page).not.toMatch(/\b(users|people)\s+visited\b/i)
    })

    it('says so plainly when nothing has been counted', () => {
        render(<VisitsSnapshotView daily={[]} loading={false} />)

        expect(
            screen.getByText(/no visits counted yet/i)
        ).toBeInTheDocument()
    })
})
