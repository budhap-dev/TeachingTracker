import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OfferingsView } from './OfferingsView'
import type { ApproachPoint } from '../data/siteContent'

const approach: ApproachPoint[] = [
    { title: 'Grouped by year', detail: 'Matched to the right syllabus.' },
    { title: 'Progress recorded', detail: 'A written note every session.' },
]

describe('OfferingsView', () => {
    it('lists the subjects taught and the approach behind them', () => {
        render(
            <OfferingsView
                intro="Tutoring for Years 8 to 11."
                subjects={['Mathematics', 'Physics']}
                approach={approach}
            />
        )

        expect(
            screen.getByRole('heading', { name: /offerings/i })
        ).toBeInTheDocument()
        expect(screen.getByText('Tutoring for Years 8 to 11.')).toBeInTheDocument()

        expect(screen.getByText('Mathematics')).toBeInTheDocument()
        expect(screen.getByText('Physics')).toBeInTheDocument()

        expect(
            screen.getByRole('heading', { name: 'Grouped by year' })
        ).toBeInTheDocument()
        expect(
            screen.getByText('Matched to the right syllabus.')
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Progress recorded' })
        ).toBeInTheDocument()
    })

    it('invites contact instead of showing an empty list when no subjects are set', () => {
        render(
            <OfferingsView intro="Intro." subjects={[]} approach={approach} />
        )

        expect(
            screen.getByText(/subject list coming soon/i)
        ).toBeInTheDocument()
        // The approach still stands on its own.
        expect(
            screen.getByRole('heading', { name: 'Grouped by year' })
        ).toBeInTheDocument()
    })
})
