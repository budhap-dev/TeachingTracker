import { render, screen } from '@testing-library/react'
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

const outcomes = {
    studentsTaught: 9,
    sessionsDelivered: 120,
    hoursDelivered: 110,
    subjectsCount: 4,
    averageRating: 4.9,
    reviewCount: 12,
}

// The bundled default states 20 years of experience; this variant keeps a
// hero without it, for the strip's fully-empty case.
const contentWithoutExperience = {
    ...defaultSiteContent,
    hero: { ...defaultSiteContent.hero, experienceYears: undefined },
}

const renderHome = (
    testimonials: Testimonial[] = reviews,
    tallies: typeof outcomes | null = null,
    content = defaultSiteContent
) =>
    render(
        <MemoryRouter>
            <HomeView
                testimonials={testimonials}
                content={content}
                outcomes={tallies}
            />
        </MemoryRouter>
    )

describe('HomeView', () => {
    it('pitches with the hero and routes onward to the public pages', () => {
        renderHome()

        expect(
            screen.getByText(defaultSiteContent.hero.headline)
        ).toBeInTheDocument()
        // The default availability line is blank, so no line renders — the
        // teacher publishes one via the site editor when there is news.
        expect(
            document.querySelector('.offerings-availability')
        ).not.toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: /request a free assessment/i })
        ).toHaveAttribute('href', '/contact')
        expect(
            screen.getByRole('link', { name: /see what we offer/i })
        ).toHaveAttribute('href', '/offerings')
        expect(
            screen.getByRole('link', { name: /read all reviews/i })
        ).toHaveAttribute('href', '/reviews')
    })

    it('shows at most three reviews as proof', () => {
        renderHome()

        expect(screen.getByText('Quote number 1.')).toBeInTheDocument()
        expect(screen.getByText('Quote number 3.')).toBeInTheDocument()
        expect(screen.queryByText('Quote number 4.')).not.toBeInTheDocument()
    })

    it('drops the proof strip entirely when there are no reviews yet', () => {
        renderHome([])

        expect(screen.queryByText(/what families say/i)).not.toBeInTheDocument()
        // The journey still shows.
        expect(screen.getByText(/how it works/i)).toBeInTheDocument()
        expect(
            screen.getByText(defaultSiteContent.journey[0].title)
        ).toBeInTheDocument()
    })

    it('shows the outcomes strip: experience first, then the live tallies (REQ-020)', () => {
        renderHome(reviews, outcomes)

        const strip = screen.getByRole('list', {
            name: /teaching record so far/i,
        })
        expect(strip).toHaveTextContent(
            '20+years of tutoring experience'
        )
        expect(strip).toHaveTextContent('9students taught')
        expect(strip).toHaveTextContent('120classes delivered')
        expect(strip).toHaveTextContent('110hours of teaching')
        expect(strip).toHaveTextContent('4.9★from 12 family reviews')
    })

    it('keeps the experience tile even while tallies are missing', () => {
        // Tallies not yet loaded (or the API is away): the teacher-stated
        // experience still shows — it comes from site content, not the API.
        renderHome()
        const strip = screen.getByRole('list', {
            name: /teaching record so far/i,
        })
        expect(strip).toHaveTextContent('years of tutoring experience')
        expect(strip).not.toHaveTextContent('students taught')
    })

    it('hides empty tiles, and the whole strip when there is nothing to show', () => {
        // A roster with no held classes yet brags about nothing but the roster.
        renderHome(
            reviews,
            {
                ...outcomes,
                sessionsDelivered: 0,
                hoursDelivered: 0,
                averageRating: 0,
                reviewCount: 0,
            },
            contentWithoutExperience
        )
        const strip = screen.getByRole('list', {
            name: /teaching record so far/i,
        })
        expect(strip).toHaveTextContent('students taught')
        expect(strip).not.toHaveTextContent('classes delivered')
        expect(strip).not.toHaveTextContent('family reviews')
        expect(strip).not.toHaveTextContent('years of tutoring experience')

        // No experience stated, no students taught: no strip at all.
        renderHome(
            reviews,
            { ...outcomes, studentsTaught: 0 },
            contentWithoutExperience
        )
        expect(
            screen.queryAllByRole('list', { name: /teaching record so far/i })
        ).toHaveLength(1) // only the earlier render's strip, not a new one
    })

    it('sets the page title and description while mounted, restoring after', () => {
        // jsdom has no index.html head; create the tag the hook updates.
        const meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        meta.setAttribute('content', 'default description')
        document.head.appendChild(meta)

        const { unmount } = renderHome()
        expect(document.title).toMatch(/springboard tutoring/i)
        expect(meta.getAttribute('content')).toMatch(/personal tutoring/i)
        unmount()
        expect(document.title).toMatch(/springboard tutoring/i)
        expect(meta.getAttribute('content')).toMatch(/personal tutoring/i)
        meta.remove()
    })

    it('keeps teacher sign-in as a quiet afterline', async () => {
        const user = userEvent.setup()
        renderHome()

        await user.click(
            screen.getByRole('button', { name: /sign in with microsoft/i })
        )
        expect(signIn).toHaveBeenCalled()
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

        // Hero renders immediately, without waiting on the fetch.
        expect(
            screen.getByText(defaultSiteContent.hero.headline)
        ).toBeInTheDocument()
        // The mocked API's approved reviews arrive as proof.
        expect(
            await screen.findByText(/what families say/i)
        ).toBeInTheDocument()
    })
})
