import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OfferingsView } from './OfferingsView'
import type {
    ApproachPoint,
    JourneyStep,
    OfferingsHero,
    SubjectOffering,
} from '../data/siteContent'

const hero: OfferingsHero = {
    headline: 'Confident tutoring for Years 8 to 11.',
    subhead: 'One-to-one lessons matched to the exam board.',
    availability: 'Now taking Year 10 & 11 students.',
}

const subjects: SubjectOffering[] = [
    {
        name: 'Mathematics',
        keyStages: ['KS3', 'GCSE'],
        examBoards: ['AQA', 'Edexcel'],
        modes: ['Online', 'In person'],
    },
    // No optional detail — exercises the ChipRow "nothing to show" path.
    { name: 'History' },
]

const journey: JourneyStep[] = [
    { title: 'Enquire', detail: 'Tell us the subject and year.' },
    { title: 'Free assessment', detail: 'A no-obligation first session.' },
]

const approach: ApproachPoint[] = [
    { title: 'Grouped by year', detail: 'Matched to the right syllabus.' },
    { title: 'Progress recorded', detail: 'A written note every session.' },
]

const renderView = (overrides: Partial<Parameters<typeof OfferingsView>[0]> = {}) =>
    render(
        <OfferingsView
            hero={hero}
            subjects={subjects}
            journey={journey}
            approach={approach}
            onBookAssessment={vi.fn()}
            {...overrides}
        />
    )

describe('OfferingsView', () => {
    it('leads with a hero, its headline and an availability nudge', () => {
        renderView()

        expect(
            screen.getByRole('heading', { name: /offerings/i })
        ).toBeInTheDocument()
        expect(screen.getByText(hero.headline)).toBeInTheDocument()
        expect(screen.getByText(hero.subhead)).toBeInTheDocument()
        expect(screen.getByText(hero.availability)).toBeInTheDocument()
    })

    it('shows subjects as cards, with levels and boards where given', () => {
        renderView()

        expect(
            screen.getByRole('heading', { name: 'Mathematics' })
        ).toBeInTheDocument()
        expect(screen.getByText('AQA')).toBeInTheDocument()
        expect(screen.getByText('Edexcel')).toBeInTheDocument()
        // The bare subject still renders — just without chips.
        expect(
            screen.getByRole('heading', { name: 'History' })
        ).toBeInTheDocument()
    })

    it('lays out how it works as a numbered journey', () => {
        renderView()

        expect(
            screen.getByRole('heading', { name: /how it works/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Enquire' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Free assessment' })
        ).toBeInTheDocument()
    })

    it('keeps the selling points below the journey', () => {
        renderView()

        expect(
            screen.getByRole('heading', { name: 'Grouped by year' })
        ).toBeInTheDocument()
        expect(
            screen.getByText('A written note every session.')
        ).toBeInTheDocument()
    })

    it('omits the availability line when there is none', () => {
        renderView({ hero: { ...hero, availability: '' } })
        expect(
            screen.queryByText(hero.availability)
        ).not.toBeInTheDocument()
    })

    it('invites contact instead of an empty list when no subjects are set', () => {
        renderView({ subjects: [] })
        expect(
            screen.getByText(/subject list coming soon/i)
        ).toBeInTheDocument()
        // The journey and selling points still stand on their own.
        expect(
            screen.getByRole('heading', { name: 'Enquire' })
        ).toBeInTheDocument()
    })

    it('flips a subject card on tap, and back again', async () => {
        const user = userEvent.setup()
        renderView()

        const card = screen
            .getByRole('heading', { name: 'Mathematics' })
            .closest('.offerings-subject-card') as HTMLElement
        expect(card).not.toHaveClass('flipped')

        await user.click(card)
        expect(card).toHaveClass('flipped')

        await user.click(card)
        expect(card).not.toHaveClass('flipped')
    })

    it('starts the assessment from either call-to-action', async () => {
        const onBookAssessment = vi.fn()
        const user = userEvent.setup()
        renderView({ onBookAssessment })

        const buttons = screen.getAllByRole('button', {
            name: /book a free assessment/i,
        })
        expect(buttons).toHaveLength(2)
        await user.click(buttons[0])
        await user.click(buttons[1])
        expect(onBookAssessment).toHaveBeenCalledTimes(2)
    })
})
