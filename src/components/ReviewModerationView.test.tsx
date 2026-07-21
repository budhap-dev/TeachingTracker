import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewModerationView } from './ReviewModerationView'
import type { Testimonial } from '../data/students'

const pending: Testimonial = {
    id: 3,
    authorName: 'Helen W.',
    role: 'Parent',
    subject: 'Chemistry',
    rating: 4,
    quote: 'Reliable and patient.',
    status: 'Pending',
    submittedOn: '2026-07-15',
}

describe('ReviewModerationView', () => {
    it('shows an empty state when nothing is waiting', () => {
        render(
            <ReviewModerationView
                pending={[]}
                onApprove={vi.fn()}
                onReject={vi.fn()}
                onDelete={vi.fn()}
            />
        )
        expect(screen.getByText(/no reviews waiting/i)).toBeInTheDocument()
    })

    it('includes the year in the attribution when present', () => {
        render(
            <ReviewModerationView
                pending={[{ ...pending, year: '9' }]}
                onApprove={vi.fn()}
                onReject={vi.fn()}
                onDelete={vi.fn()}
            />
        )
        expect(
            screen.getByText('Parent · Chemistry · Year 9')
        ).toBeInTheDocument()
    })

    it('lists a pending review and wires each action to its id', async () => {
        const onApprove = vi.fn()
        const onReject = vi.fn()
        const onDelete = vi.fn()
        const user = userEvent.setup()

        render(
            <ReviewModerationView
                pending={[pending]}
                onApprove={onApprove}
                onReject={onReject}
                onDelete={onDelete}
            />
        )

        expect(screen.getByText('Reliable and patient.')).toBeInTheDocument()
        expect(screen.getByText('Parent · Chemistry')).toBeInTheDocument()
        expect(screen.getByText(/submitted 2026-07-15/i)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /approve/i }))
        await user.click(screen.getByRole('button', { name: /reject/i }))
        await user.click(screen.getByRole('button', { name: /delete/i }))

        expect(onApprove).toHaveBeenCalledWith(3)
        expect(onReject).toHaveBeenCalledWith(3)
        expect(onDelete).toHaveBeenCalledWith(3)
    })
})
