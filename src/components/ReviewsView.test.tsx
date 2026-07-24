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
