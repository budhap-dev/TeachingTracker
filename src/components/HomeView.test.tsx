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

const renderHome = (testimonials: Testimonial[] = reviews) =>
    render(
        <MemoryRouter>
            <HomeView
                testimonials={testimonials}
                content={defaultSiteContent}
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
