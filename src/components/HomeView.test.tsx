import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { HomeLanding, HomeView } from './HomeView'
import { signIn } from '../auth/msal'
import { defaultSiteContent } from '../data/siteContent'
import { store } from '../store/store'
import type { Testimonial } from '../data/students'

vi.mock('../auth/msal', () => ({
    isAuthConfigured: () => false,
    signIn: vi.fn(),
}))

const reviews: Testimonial[] = [1, 2, 3, 4].map((id) => ({
    id,
    authorName: `Parent ${id}`,
    role: 'Parent',
    rating: 5,
    quote: `Quote number ${id}.`,
    status: 'Approved',
    submittedOn: `2026-0${id}-01`,
}))

// The bundled default states 20 years of experience; this variant keeps a
// hero without it, for the strip's fully-empty case.
const contentWithoutExperience = {
    ...defaultSiteContent,
    hero: { ...defaultSiteContent.hero, experienceYears: undefined },
}

const renderHome = (
    testimonials: Testimonial[] = reviews,
    content = defaultSiteContent
) =>
    render(
        <MemoryRouter>
            <HomeView testimonials={testimonials} content={content} />
        </MemoryRouter>
    )

describe('HomeView', () => {
    it('pitches from the brand band and routes onward (D1, 2026-08-04)', () => {
        renderHome()

        expect(
            screen.getByRole('heading', {
                name: defaultSiteContent.hero.headline.replace('\n', ' '),
            })
        ).toBeInTheDocument()
        // The default availability line is blank, so no line renders — the
        // teacher publishes one via the site editor when there is news.
        expect(
            document.querySelector('.home-band-availability')
        ).not.toBeInTheDocument()
        // ONE call to action, straight to the enquiry form (REQ-018).
        expect(
            screen.getByRole('link', { name: /request a free assessment/i })
        ).toHaveAttribute('href', '/enquire')
        expect(
            screen.getByRole('link', { name: /explore subjects/i })
        ).toHaveAttribute('href', '/offerings')
    })

    it('shows the subjects as plain badges — no navigation (owner call)', () => {
        renderHome()

        // Visible, but not links (2026-08-11): the band's "Explore
        // subjects" button is the door.
        expect(screen.getByText('Mathematics')).toBeInTheDocument()
        expect(screen.getByText('Physics')).toBeInTheDocument()
        expect(
            screen.queryByRole('link', { name: 'Mathematics' })
        ).not.toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: /explore subjects/i })
        ).toBeInTheDocument()
    })

    it('retired the in-card rating record — the chip carries the number', () => {
        renderHome()

        // No hero "5.0" figure or distribution meter in the review card
        // (owner call, 2026-08-06); the ★ average lives in the trust chips.
        expect(screen.queryByText('5.0')).not.toBeInTheDocument()
        expect(
            screen.queryByRole('list', { name: /rating breakdown/i })
        ).not.toBeInTheDocument()
    })

    it('gives the hero highlights their own card (REQ-038)', () => {
        renderHome()

        const strip = screen.getByRole('list', { name: /why abhitutor/i })
        expect(strip).toHaveTextContent('Flexible scheduling')
        // UK spelling, and the merged communication/progress claims.
        expect(strip).toHaveTextContent('Personalised learning')
        expect(strip).toHaveTextContent('Clear communication with parents')
        // "Proven results" walks to its evidence (the evidence rule).
        expect(
            screen.getByRole('link', { name: /proven results/i })
        ).toHaveAttribute('href', '/reviews')
    })

    it('keeps parent quotes off the hero — the Reviews page owns them', () => {
        renderHome()

        // Quotes retired from the hero (owner call, 2026-08-06).
        expect(screen.queryByText('Quote number 1.')).not.toBeInTheDocument()
        expect(
            screen.queryByRole('link', { name: /read all reviews/i })
        ).not.toBeInTheDocument()
        // The journey still shows, compact — titles with their step number.
        expect(screen.getByText(/how it works/i)).toBeInTheDocument()
        expect(
            screen.getByText(defaultSiteContent.journey[0].title)
        ).toBeInTheDocument()
    })

    it('leads with the pinned note when one is written (owner call)', () => {
        renderHome(reviews, {
            ...defaultSiteContent,
            freeform: {
                heading: 'Term dates',
                markdown: 'Starts **7 September**.',
            },
        })
        expect(
            screen.getByRole('heading', { name: 'Term dates' })
        ).toBeInTheDocument()
        expect(screen.getByText('7 September').tagName).toBe('STRONG')
        // The default (empty) freeform renders nothing at all.
    })

    it('carries the trust chips inside the band (REQ-020 as D1 chips)', () => {
        renderHome()

        const chips = screen.getByRole('list', {
            name: /teaching record so far/i,
        })
        // Four approved five-star fixture reviews average to 5.
        expect(chips).toHaveTextContent('★ 5 · 4 families')
        expect(chips).toHaveTextContent('20+ years teaching')
        // Levels and boards derive from the published subjects.
        expect(chips).toHaveTextContent('KS3 · GCSE · A-level')
        expect(chips).toHaveTextContent('AQA · Edexcel · OCR')
        // No price chip: rates live on the Pricing page alone (owner
        // call, 2026-08-12).
        expect(chips).not.toHaveTextContent('From £')
    })

    it('hides chips with nothing to say, and the whole row when empty', () => {
        // No reviews yet: the rating chip stays out.
        renderHome([])
        const chips = screen.getByRole('list', {
            name: /teaching record so far/i,
        })
        expect(chips).toHaveTextContent('years teaching')
        expect(chips).not.toHaveTextContent('★')

        // No experience stated either — and no subjects to derive levels
        // from: the whole chip row disappears.
        renderHome([], {
            ...contentWithoutExperience,
            subjects: [],
        })
        expect(
            screen.queryAllByRole('list', { name: /teaching record so far/i })
        ).toHaveLength(1) // only the earlier render's row, no new one
    })

    it('sets the page title and description while mounted, restoring after', () => {
        // jsdom has no index.html head; create the tag the hook updates.
        const meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        meta.setAttribute('content', 'default description')
        document.head.appendChild(meta)

        const { unmount } = renderHome()
        expect(document.title).toMatch(/abhitutor/i)
        expect(meta.getAttribute('content')).toMatch(/personal tutoring/i)
        unmount()
        expect(document.title).toMatch(/abhitutor/i)
        expect(meta.getAttribute('content')).toMatch(/personal tutoring/i)
        meta.remove()
    })

    it('hides teacher sign-in until five quick taps on the badge', async () => {
        sessionStorage.clear()
        const user = userEvent.setup()
        renderHome()

        // Visitors see no sign-in chrome at all (owner ask, 2026-08-06).
        expect(
            screen.queryByRole('button', { name: /sign in with microsoft/i })
        ).not.toBeInTheDocument()

        // Five quick taps on the hero badge open the teacher door.
        const badge = document.querySelector('.home-badge-tap')!
        for (let tap = 0; tap < 5; tap += 1) {
            fireEvent.click(badge)
        }
        await user.click(
            screen.getByRole('button', { name: /sign in with microsoft/i })
        )
        expect(signIn).toHaveBeenCalled()
    })

    it('keeps the teacher door open for the rest of the session', () => {
        sessionStorage.setItem('teacher-door', 'open')
        renderHome()

        expect(
            screen.getByRole('button', { name: /sign in with microsoft/i })
        ).toBeInTheDocument()
        sessionStorage.clear()
    })
})

describe('HomeLanding', () => {
    it('loads the approved reviews itself and renders the landing', async () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <HomeLanding />
                </MemoryRouter>
            </Provider>
        )

        // The page waits for the published document (owner report,
        // 2026-08-11 — the pinned note used to pop in late), then paints
        // whole: hero and the ★ trust chip together.
        expect(
            await screen.findByRole('heading', {
                name: defaultSiteContent.hero.headline.replace('\n', ' '),
            })
        ).toBeInTheDocument()
        expect(await screen.findByText(/famil/i)).toBeInTheDocument()
    })
})
