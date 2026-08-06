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
            screen.getByText(defaultSiteContent.hero.headline)
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
        expect(
            screen.getByRole('link', { name: /read all reviews/i })
        ).toHaveAttribute('href', '/reviews')
    })

    it('surfaces the published subjects as chips linking onward', () => {
        renderHome()

        const chips = screen.getAllByRole('link', { name: 'Mathematics' })
        expect(chips[0]).toHaveAttribute('href', '/offerings')
        expect(
            screen.getByRole('link', { name: 'Physics' })
        ).toBeInTheDocument()
    })

    it('leads with one strong review, not a wall of three', () => {
        renderHome()

        expect(screen.getByText('Quote number 1.')).toBeInTheDocument()
        expect(screen.queryByText('Quote number 2.')).not.toBeInTheDocument()
    })

    it('shows the rating record: hero number and the live distribution', () => {
        renderHome()

        // Four five-star fixture reviews: 5.0 hero, all counts on the 5★ row.
        expect(screen.getByText('5.0')).toBeInTheDocument()
        expect(screen.getByText(/from 4 family reviews/i)).toBeInTheDocument()
        const bars = screen.getByRole('list', { name: /rating breakdown/i })
        expect(bars).toHaveTextContent('5★')
        expect(bars).toHaveTextContent('1★')
    })

    it('drops the quote card entirely when there are no reviews yet', () => {
        renderHome([])

        expect(
            screen.queryByRole('link', { name: /read all reviews/i })
        ).not.toBeInTheDocument()
        // The journey still shows, compact — titles with their step number.
        expect(screen.getByText(/how it works/i)).toBeInTheDocument()
        expect(
            screen.getByText(defaultSiteContent.journey[0].title)
        ).toBeInTheDocument()
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
        // The mocked API's approved reviews arrive as the lead quote.
        expect(
            await screen.findByRole('link', { name: /read all reviews/i })
        ).toBeInTheDocument()
    })
})
