import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { HomeReviews } from './HomeReviews'
import type { Testimonial } from '../data/students'

const review = (overrides: Partial<Testimonial> = {}): Testimonial => ({
    id: 1,
    authorName: 'Nadia D.',
    role: 'Parent',
    subject: 'Mathematics',
    year: '10',
    rating: 5,
    quote: 'My daughter went from dreading maths to volunteering answers.',
    status: 'Approved',
    submittedOn: '2026-05-12',
    ...overrides,
})

const renderStrip = (testimonials: Testimonial[]) =>
    render(
        <MemoryRouter>
            <HomeReviews testimonials={testimonials} />
        </MemoryRouter>
    )

/**
 * The rail as the browser would report it once laid out — jsdom reports 0 for
 * every measurement. `step` is the distance from one card to the next (gap
 * included), and `perView` how many of them the rail shows: one on a phone,
 * three on a desktop.
 */
const layOutRail = (step: number, perView = 1) => {
    const rail = document.querySelector('.home-review-grid') as HTMLDivElement
    Object.defineProperty(rail, 'clientWidth', {
        value: step * perView,
        configurable: true,
    })
    Object.defineProperty(rail, 'scrollWidth', {
        value: step * rail.children.length,
        configurable: true,
    })
    ;[...rail.children].forEach((card, index) => {
        Object.defineProperty(card, 'offsetLeft', {
            value: index * step,
            configurable: true,
        })
    })
    return rail
}

describe('HomeReviews', () => {
    it('renders the chosen reviews with their attribution and the link', () => {
        renderStrip([review({ id: 1, featured: true })])

        expect(screen.getByText(/what families say/i)).toBeInTheDocument()
        expect(
            screen.getByText(/dreading maths to volunteering answers/i)
        ).toBeInTheDocument()
        expect(screen.getByText('Nadia D.')).toBeInTheDocument()
        expect(
            screen.getByText('Parent · Mathematics · Year 10')
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: /read all reviews/i })
        ).toBeInTheDocument()
    })

    it('shows nothing at all when there are no approved reviews', () => {
        const { container } = renderStrip([])

        expect(container).toBeEmptyDOMElement()
    })

    // The height treatment: one fixed card height, type sized to the quote.
    it('marks each card with its length bucket', () => {
        renderStrip([
            review({ id: 1, quote: 'Reliable, patient and genuinely invested.' }),
            review({ id: 2, quote: 'x'.repeat(200) }),
            review({ id: 3, quote: 'x'.repeat(400) }),
        ])

        expect(document.querySelectorAll('.home-review.is-short')).toHaveLength(1)
        expect(document.querySelectorAll('.home-review.is-mid')).toHaveLength(1)
        expect(document.querySelectorAll('.home-review.is-long')).toHaveLength(1)
    })

    it('gives a clipped quote a way through to the whole of it', () => {
        renderStrip([review({ id: 7, quote: 'x'.repeat(400) })])

        expect(document.querySelector('.home-review.is-clipped')).toBeTruthy()
        expect(
            screen.getByRole('link', { name: /read this review/i })
        ).toHaveAttribute('href', '/reviews#review-7')
    })

    // A middling quote overflows the card too — it is what clips, not what
    // sets small, that earns the link.
    it('gives a middling quote the same way through', () => {
        renderStrip([review({ id: 8, quote: 'x'.repeat(200) })])

        expect(document.querySelector('.home-review.is-mid')).toBeTruthy()
        expect(
            screen.getByRole('link', { name: /read this review/i })
        ).toHaveAttribute('href', '/reviews#review-8')
    })

    it('leaves a quote that fits without that link — nothing is cut', () => {
        renderStrip([review({ quote: 'Brilliant.' })])

        expect(document.querySelector('.home-review.is-clipped')).toBeNull()

        expect(
            screen.queryByRole('link', { name: /read this review/i })
        ).not.toBeInTheDocument()
    })

    // A recommendation (Professional/Personal) carries no star rating.
    it('shows no stars for a review that has no rating', () => {
        renderStrip([
            review({
                role: 'Professional',
                rating: undefined,
                subject: undefined,
                year: undefined,
                quote: 'A colleague I would send my own children to.',
            }),
        ])

        expect(screen.queryByRole('img')).not.toBeInTheDocument()
        expect(screen.getByText('Professional')).toBeInTheDocument()
    })

    // The phone rail's dots (owner ask, 2026-08-16) — how many cards there
    // are, said before the visitor swipes.
    it('shows one dot per card, the first current', () => {
        renderStrip([review({ id: 1 }), review({ id: 2 }), review({ id: 3 })])

        const dots = screen.getAllByRole('button', { name: /review \d of 3/i })
        expect(dots).toHaveLength(3)
        expect(dots[0]).toHaveAttribute('aria-current', 'true')
        expect(dots[1]).toHaveAttribute('aria-current', 'false')
    })

    it('shows no dots for a single review — there is nowhere to swipe', () => {
        renderStrip([review()])

        expect(
            screen.queryByRole('button', { name: /review 1 of/i })
        ).not.toBeInTheDocument()
    })

    it('scrolls the rail to the card a dot names, and marks it current', () => {
        renderStrip([review({ id: 1 }), review({ id: 2 }), review({ id: 3 })])
        const rail = layOutRail(390)

        fireEvent.click(screen.getByRole('button', { name: /review 3 of 3/i }))

        expect(rail.scrollLeft).toBe(780)
        expect(
            screen.getByRole('button', { name: /review 3 of 3/i })
        ).toHaveAttribute('aria-current', 'true')
    })

    // Desktop shows three cards to a screen, so the step is one CARD, not the
    // width of the rail — dividing by the rail would only ever be right on a
    // phone.
    it('steps by one card even when three are on screen', () => {
        renderStrip([1, 2, 3, 4, 5].map((id) => review({ id })))
        const rail = layOutRail(308, 3)

        fireEvent.click(screen.getByRole('button', { name: /review 2 of 5/i }))

        expect(rail.scrollLeft).toBe(308)
        expect(
            screen.getByRole('button', { name: /review 2 of 5/i })
        ).toHaveAttribute('aria-current', 'true')
    })

    // The dots read the rail rather than driving it, so a swipe moves them too.
    it('follows a swipe', () => {
        renderStrip([review({ id: 1 }), review({ id: 2 }), review({ id: 3 })])
        const rail = layOutRail(390)


        rail.scrollLeft = 390
        fireEvent.scroll(rail)

        expect(
            screen.getByRole('button', { name: /review 2 of 3/i })
        ).toHaveAttribute('aria-current', 'true')
    })

    // Three picks on a wide screen all fit, and dots for a rail that cannot
    // move are furniture. The rerender re-runs the measuring effect now that
    // the rail reports a width.
    it('drops the dots when there is nothing to scroll to', () => {
        const three = [review({ id: 1 }), review({ id: 2 }), review({ id: 3 })]
        const { rerender } = renderStrip(three)
        layOutRail(300, 3)

        rerender(
            <MemoryRouter>
                <HomeReviews testimonials={[...three, review({ id: 4 })]} />
            </MemoryRouter>
        )

        expect(
            screen.queryByRole('button', { name: /review 1 of/i })
        ).not.toBeInTheDocument()
    })

    it('ignores a scroll before the rail has been laid out', () => {
        renderStrip([review({ id: 1 }), review({ id: 2 })])
        const rail = document.querySelector(
            '.home-review-grid'
        ) as HTMLDivElement

        // clientWidth is 0 here; dividing by it would make the dot NaN.
        fireEvent.scroll(rail)

        expect(
            screen.getByRole('button', { name: /review 1 of 2/i })
        ).toHaveAttribute('aria-current', 'true')
    })
})
