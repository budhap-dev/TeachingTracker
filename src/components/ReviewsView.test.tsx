import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewsView } from './ReviewsView'
import type { Testimonial } from '../data/students'

const withMeta: Testimonial = {
    id: 1,
    authorName: 'Nadia D.',
    role: 'Parent',
    subject: 'Mathematics',
    year: '10',
    rating: 5,
    quote: 'Brilliant tutor.',
    status: 'Approved',
    submittedOn: '2026-05-12',
}

const bare: Testimonial = {
    id: 2,
    authorName: 'Sam',
    role: 'Student',
    rating: 4,
    quote: 'Really helpful.',
    status: 'Approved',
    submittedOn: '2026-06-01',
}

describe('ReviewsView', () => {
    it('shows approved reviews with full and minimal attribution', () => {
        render(
            <ReviewsView
                testimonials={[withMeta, bare]}
                saving={false}
                onSubmit={vi.fn()}
            />
        )
        expect(screen.getByText('Brilliant tutor.')).toBeInTheDocument()
        expect(
            screen.getByText('Parent · Mathematics · Year 10')
        ).toBeInTheDocument()
        // No subject or year: just the role.
        expect(screen.getByText('Student')).toBeInTheDocument()
    })

    it('invites the first review when the list is empty', () => {
        render(
            <ReviewsView testimonials={[]} saving={false} onSubmit={vi.fn()} />
        )
        expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument()
    })

    it('submits a completed review with all fields', async () => {
        const onSubmit = vi.fn()
        const user = userEvent.setup()
        const { container } = render(
            <ReviewsView testimonials={[]} saving={false} onSubmit={onSubmit} />
        )

        await user.type(screen.getByLabelText(/your name/i), 'Jo')
        await user.click(screen.getByRole('combobox', { name: /you are a/i }))
        await user.click(screen.getByRole('option', { name: 'Student' }))
        await user.click(screen.getByRole('combobox', { name: /subject/i }))
        await user.click(screen.getByRole('option', { name: 'Physics' }))
        // Multi-select keeps the menu open — close it before the next field.
        await user.keyboard('{Escape}')
        await user.click(screen.getByRole('combobox', { name: /year/i }))
        await user.click(screen.getByRole('option', { name: 'Year 11' }))
        await user.click(screen.getByRole('button', { name: '5 Stars' }))
        await user.type(screen.getByLabelText(/your review/i), 'Superb lessons.')
        // Fill the honeypot to exercise its handler; the API drops these.
        fireEvent.change(container.querySelector('.review-website')!, {
            target: { value: 'http://bot.example' },
        })

        await user.click(screen.getByRole('button', { name: /submit review/i }))

        expect(onSubmit).toHaveBeenCalledWith({
            authorName: 'Jo',
            role: 'Student',
            subject: 'Physics',
            year: '11',
            rating: 5,
            quote: 'Superb lessons.',
            website: 'http://bot.example',
        })
    })

    it('omits the optional subject and year when left blank', async () => {
        const onSubmit = vi.fn()
        const user = userEvent.setup()
        render(
            <ReviewsView testimonials={[]} saving={false} onSubmit={onSubmit} />
        )

        await user.type(screen.getByLabelText(/your name/i), 'Pat')
        await user.click(screen.getByRole('button', { name: '3 Stars' }))
        await user.type(screen.getByLabelText(/your review/i), 'Good.')
        await user.click(screen.getByRole('button', { name: /submit review/i }))

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                authorName: 'Pat',
                role: 'Parent',
                subject: undefined,
                year: undefined,
                rating: 3,
            })
        )
    })

    it.each([
        ['nothing filled', async () => {}],
        [
            'a name but no words',
            async (user: ReturnType<typeof userEvent.setup>) => {
                await user.type(screen.getByLabelText(/your name/i), 'Jo')
            },
        ],
        [
            'name and words but no rating',
            async (user: ReturnType<typeof userEvent.setup>) => {
                await user.type(screen.getByLabelText(/your name/i), 'Jo')
                await user.type(
                    screen.getByLabelText(/your review/i),
                    'Some words.'
                )
            },
        ],
    ])('blocks submitting with %s', async (_label, fill) => {
        const onSubmit = vi.fn()
        const user = userEvent.setup()
        render(
            <ReviewsView testimonials={[]} saving={false} onSubmit={onSubmit} />
        )

        await fill(user)
        await user.click(screen.getByRole('button', { name: /submit review/i }))

        expect(onSubmit).not.toHaveBeenCalled()
        expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('submits a Professional recommendation without a rating (2026-08-05)', async () => {
        const onSubmit = vi.fn()
        const user = userEvent.setup()
        render(
            <ReviewsView testimonials={[]} saving={false} onSubmit={onSubmit} />
        )

        await user.type(screen.getByLabelText(/your name/i), 'Head of Maths')
        await user.click(screen.getByRole('combobox', { name: /you are a/i }))
        await user.click(
            screen.getByRole('option', { name: /professional — colleague/i })
        )
        // The star input leaves for recommendations.
        expect(
            screen.queryByRole('button', { name: '5 Stars' })
        ).not.toBeInTheDocument()
        await user.type(
            screen.getByLabelText(/your review/i),
            'A dedicated, knowledgeable colleague.'
        )
        await user.click(screen.getByRole('button', { name: /submit review/i }))

        expect(onSubmit).toHaveBeenCalledWith({
            authorName: 'Head of Maths',
            role: 'Professional',
            subject: undefined,
            year: undefined,
            quote: 'A dedicated, knowledgeable colleague.',
            website: '',
        })
    })

    it('shows recommendations in their own section, without stars', () => {
        const recommendation: Testimonial = {
            id: 3,
            authorName: 'Mr T. Clarke',
            role: 'Professional',
            quote: 'An outstanding mentor to our students.',
            status: 'Approved',
            submittedOn: '2026-07-01',
        }
        render(
            <ReviewsView
                testimonials={[withMeta, recommendation]}
                saving={false}
                onSubmit={vi.fn()}
            />
        )

        expect(
            screen.getByRole('heading', {
                name: /professional & personal recommendations/i,
            })
        ).toBeInTheDocument()
        expect(
            screen.getByText('An outstanding mentor to our students.')
        ).toBeInTheDocument()
        // The family review still shows in its own grid.
        expect(screen.getByText('Brilliant tutor.')).toBeInTheDocument()
    })

    it('marks each missing required field inline on submit (REQ-029)', async () => {
        const user = userEvent.setup()
        render(
            <ReviewsView testimonials={[]} saving={false} onSubmit={vi.fn()} />
        )

        // Nothing shows before a submit is attempted.
        expect(
            screen.queryByText('Your name is required')
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /submit review/i }))

        // Each required field names its own problem, and the rating (a custom
        // control) carries its message too.
        expect(
            screen.getByText('Your name is required')
        ).toBeInTheDocument()
        expect(screen.getByText('Please add a few words')).toBeInTheDocument()
        expect(screen.getByText('A rating is required')).toBeInTheDocument()

        // Filling a field clears its inline error on the next submit.
        await user.type(screen.getByLabelText(/your name/i), 'Jo')
        await user.click(screen.getByRole('button', { name: /submit review/i }))
        expect(
            screen.queryByText('Your name is required')
        ).not.toBeInTheDocument()
        expect(screen.getByText('A rating is required')).toBeInTheDocument()
    })

    it('disables the button while a submission is in flight', () => {
        render(
            <ReviewsView testimonials={[]} saving onSubmit={vi.fn()} />
        )
        const button = screen.getByRole('button', { name: /sending/i })
        expect(button).toBeDisabled()
    })
})

describe('the review form protects what people write (2026-08-15)', () => {
    /** Renders the public form the way the page does. */
    const renderForm = (props: { sent?: number } = {}) => {
        const onSubmit = vi.fn()
        const view = render(
            <ReviewsView
                testimonials={[]}
                saving={false}
                onSubmit={onSubmit}
                {...props}
            />
        )
        return { onSubmit, ...view }
    }

    const fill = async (quote: string) => {
        fireEvent.change(screen.getByLabelText(/your name/i), {
            target: { value: 'Priya Sharma' },
        })
        fireEvent.click(screen.getByRole('button', { name: /^5 stars$/i }))
        fireEvent.change(screen.getByLabelText(/your review/i), {
            target: { value: quote },
        })
    }

    it('counts down as they write, the way the server counts', () => {
        renderForm()

        expect(screen.getByText('600 characters left')).toBeInTheDocument()

        fireEvent.change(screen.getByLabelText(/your review/i), {
            target: { value: 'Brilliant tutor' },
        })
        expect(screen.getByText('585 characters left')).toBeInTheDocument()

        // An emoji is two characters to JavaScript AND to the API's cap, so
        // the count must agree with the server rather than flatter the
        // visitor and let the submission be refused.
        fireEvent.change(screen.getByLabelText(/your review/i), {
            target: { value: '😀' },
        })
        expect(screen.getByText('598 characters left')).toBeInTheDocument()
    })

    it('will not let them exceed what the API accepts', () => {
        renderForm()

        const review = screen.getByLabelText(/your review/i)
        expect(review).toHaveAttribute('maxlength', '600')
        expect(screen.getByLabelText(/your name/i)).toHaveAttribute(
            'maxlength',
            '80'
        )
    })

    it('keeps their words when the submission is refused', async () => {
        // The reported bug: the form cleared on submit, so a rejected review
        // took the visitor's paragraph with it.
        const { onSubmit } = renderForm()
        await fill('They actually enjoy maths now, which I never expected.')

        fireEvent.click(screen.getByRole('button', { name: /submit review/i }))

        expect(onSubmit).toHaveBeenCalled()
        expect(screen.getByLabelText(/your review/i)).toHaveValue(
            'They actually enjoy maths now, which I never expected.'
        )
        expect(screen.getByLabelText(/your name/i)).toHaveValue('Priya Sharma')
    })

    it('clears once the submission has actually landed', async () => {
        const { rerender } = renderForm()
        await fill('Wonderful with my daughter.')

        fireEvent.click(screen.getByRole('button', { name: /submit review/i }))
        // The store records it; only now is it safe to empty the form.
        rerender(
            <ReviewsView
                testimonials={[]}
                saving={false}
                onSubmit={vi.fn()}
                sent={1}
            />
        )

        expect(screen.getByLabelText(/your review/i)).toHaveValue('')
        expect(screen.getByLabelText(/your name/i)).toHaveValue('')
    })
})

// REQ-060 — with twelve reviews the form's first field sits four screens down
// on a phone, and nothing above the wall said writing one was possible.
describe('finding the review form', () => {
    const renderPage = () =>
        render(
            <ReviewsView
                testimonials={[withMeta, bare]}
                saving={false}
                onSubmit={vi.fn()}
            />
        )

    it('offers a way to the form from the top of the page', () => {
        renderPage()

        expect(
            screen.getByRole('button', { name: /write a review/i })
        ).toBeInTheDocument()
    })

    it('takes the visitor there and puts the cursor in the first field', async () => {
        renderPage()
        const scrollIntoView = vi.fn()
        // jsdom implements neither; the component optional-chains both.
        const form = screen
            .getByRole('heading', { name: /share your experience/i })
            .closest('.card') as HTMLElement
        form.scrollIntoView = scrollIntoView

        await userEvent.click(
            screen.getByRole('button', { name: /write a review/i })
        )

        expect(scrollIntoView).toHaveBeenCalledWith(
            expect.objectContaining({ block: 'start' })
        )
        // Focus is the half a scroll alone would leave behind.
        expect(screen.getByLabelText(/your name/i)).toHaveFocus()
    })

    it('does not animate the scroll for a reduced-motion visitor', async () => {
        renderPage()
        const scrollIntoView = vi.fn()
        const form = screen
            .getByRole('heading', { name: /share your experience/i })
            .closest('.card') as HTMLElement
        form.scrollIntoView = scrollIntoView
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockReturnValue({ matches: true })
        )

        await userEvent.click(
            screen.getByRole('button', { name: /write a review/i })
        )

        expect(scrollIntoView).toHaveBeenCalledWith(
            expect.objectContaining({ behavior: 'auto' })
        )
    })

    it('animates it for everyone else', async () => {
        renderPage()
        const scrollIntoView = vi.fn()
        const form = screen
            .getByRole('heading', { name: /share your experience/i })
            .closest('.card') as HTMLElement
        form.scrollIntoView = scrollIntoView
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockReturnValue({ matches: false })
        )

        await userEvent.click(
            screen.getByRole('button', { name: /write a review/i })
        )

        expect(scrollIntoView).toHaveBeenCalledWith(
            expect.objectContaining({ behavior: 'smooth' })
        )
    })
})
