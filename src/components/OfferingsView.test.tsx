import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OfferingsView } from './OfferingsView'
import type {
    ApproachPoint,
    JourneyStep,
    OfferingsHero,
    SiteContent,
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

/** A document from the test fixtures above, with per-test overrides. */
const buildContent = (overrides: Partial<SiteContent> = {}): SiteContent => ({
    siteName: 'Springboard Tutoring',
    hero,
    subjects,
    journey,
    approach,
    bio: {
        heading: '',
        body: '',
        qualifications: [],
        dbsChecked: false,
        safeguarding: '',
        experience: [],
        education: [],
        expectations: [],
        sections: [],
    },
    faq: [],
    services: [
        'One-to-One Personalised Tutoring',
        'Flexible In-Person and Online Sessions',
    ],
    freeform: { heading: '', markdown: '' },
    sectionOrder: [
        'hero',
        'subjects',
        'journey',
        'approach',
        'bio',
        'faq',
        'freeform',
    ],
    ...overrides,
})

const renderView = (
    overrides: Partial<SiteContent> = {},
    onBookAssessment = vi.fn()
) => {
    render(
        <OfferingsView
            content={buildContent(overrides)}
            onBookAssessment={onBookAssessment}
        />
    )
    return { onBookAssessment }
}

describe('OfferingsView', () => {
    it('leads with the page title and availability — the pitch is Home-only', () => {
        renderView()

        expect(
            screen.getByRole('heading', { name: /offerings/i })
        ).toBeInTheDocument()
        // The headline/subhead live on the Home band alone (owner call,
        // 2026-08-07) — repeating them here read as padding.
        expect(screen.queryByText(hero.headline)).not.toBeInTheDocument()
        expect(screen.queryByText(hero.subhead)).not.toBeInTheDocument()
        expect(screen.getByText(hero.availability)).toBeInTheDocument()
    })

    it('lists the owner services checklist inside the Offerings card', () => {
        renderView()

        expect(screen.getByText('What I offer')).toBeInTheDocument()
        expect(
            screen.getByText('One-to-One Personalised Tutoring')
        ).toBeInTheDocument()
        expect(
            screen.getByText('Flexible In-Person and Online Sessions')
        ).toBeInTheDocument()
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

    it('no longer renders the journey — it lives on the Home page (2026-08-04)', () => {
        renderView()

        expect(
            screen.queryByRole('heading', { name: /how it works/i })
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('heading', { name: 'Enquire' })
        ).not.toBeInTheDocument()
    })

    it('keeps the selling points', () => {
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
        // The selling points still stand on their own.
        expect(
            screen.getByRole('heading', { name: 'Grouped by year' })
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

    it('names the approach card after the published site name', () => {
        renderView({ siteName: 'Harbour Tuition' })
        expect(
            screen.getByRole('heading', {
                name: /why families choose harbour tuition/i,
            })
        ).toBeInTheDocument()
    })

    it('renders the free-form section from Markdown when one is written', () => {
        renderView({
            freeform: {
                heading: 'Term dates',
                markdown: 'Starts **7 September**.\n\n- Mocks in December',
            },
        })
        expect(
            screen.getByRole('heading', { name: 'Term dates' })
        ).toBeInTheDocument()
        expect(screen.getByText('7 September').tagName).toBe('STRONG')
        // Scoped: the journey renders list items of its own.
        const card = screen
            .getByRole('heading', { name: 'Term dates' })
            .closest('.offerings-freeform') as HTMLElement
        expect(within(card).getByRole('listitem')).toHaveTextContent(
            'Mocks in December'
        )
    })

    it('renders sections in the teacher-chosen order', () => {
        renderView({
            sectionOrder: [
                'approach',
                'hero',
                'subjects',
                'journey',
                'freeform',
            ],
        })
        const headings = screen
            .getAllByRole('heading')
            .map((heading) => heading.textContent)
        // The approach heading now precedes the hero's page heading.
        const approachIndex = headings.findIndex((text) =>
            text?.startsWith('Why families choose')
        )
        expect(approachIndex).toBeGreaterThanOrEqual(0)
        expect(approachIndex).toBeLessThan(headings.indexOf('Offerings'))
    })

    it('starts the assessment from the closing call-to-action only', async () => {
        const onBookAssessment = vi.fn()
        const user = userEvent.setup()
        renderView({}, onBookAssessment)

        // One door, at the end — the hero's CTAs were retired so the
        // subject cards lead the page (owner call, 2026-08-07).
        const buttons = screen.getAllByRole('button', {
            name: /request a free assessment/i,
        })
        expect(buttons).toHaveLength(1)
        expect(
            screen.queryByText(/see subjects/i)
        ).not.toBeInTheDocument()
        await user.click(buttons[0])
        expect(onBookAssessment).toHaveBeenCalledTimes(1)
    })

    it('no longer renders the bio — it lives on the About page (REQ-037)', () => {
        renderView({
            bio: {
                heading: 'Meet your tutor',
                body: 'Twenty years of teaching.',
                qualifications: ['PGCE'],
                dbsChecked: true,
                safeguarding: 'Kept safe.',
                experience: [],
                education: [],
                expectations: [],
                sections: [],
            },
        })
        expect(
            screen.queryByRole('heading', { name: /meet your tutor/i })
        ).not.toBeInTheDocument()
        expect(screen.queryByText(/dbs checked/i)).not.toBeInTheDocument()
    })

    it('no longer renders the FAQ — it lives on its own page (2026-08-04)', () => {
        renderView({
            faq: [
                { question: 'Are lessons online?', answer: 'Yes — live.' },
            ],
        })
        expect(
            screen.queryByText('Are lessons online?')
        ).not.toBeInTheDocument()
    })
})
