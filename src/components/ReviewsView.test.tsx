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

        await user.type(screen.getByLabelText('Your name'), 'Jo')
        await user.click(screen.getByRole('combobox', { name: /you are a/i }))
        await user.click(screen.getByRole('option', { name: 'Student' }))
        await user.type(screen.getByLabelText(/subject/i), 'Physics')
        await user.type(screen.getByLabelText(/year/i), '11')
        await user.click(screen.getByRole('button', { name: '5 Stars' }))
        await user.type(screen.getByLabelText('Your review'), 'Superb lessons.')
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

        await user.type(screen.getByLabelText('Your name'), 'Pat')
        await user.click(screen.getByRole('button', { name: '3 Stars' }))
        await user.type(screen.getByLabelText('Your review'), 'Good.')
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
                await user.type(screen.getByLabelText('Your name'), 'Jo')
            },
        ],
        [
            'name and words but no rating',
            async (user: ReturnType<typeof userEvent.setup>) => {
                await user.type(screen.getByLabelText('Your name'), 'Jo')
                await user.type(
                    screen.getByLabelText('Your review'),
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

    it('disables the button while a submission is in flight', () => {
        render(
            <ReviewsView testimonials={[]} saving onSubmit={vi.fn()} />
        )
        const button = screen.getByRole('button', { name: /sending/i })
        expect(button).toBeDisabled()
    })
})
