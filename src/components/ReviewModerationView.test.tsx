import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MAX_FEATURED, ReviewModerationView } from './ReviewModerationView'
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

const published: Testimonial = {
    id: 1,
    authorName: 'Nadia D.',
    role: 'Parent',
    subject: 'Mathematics',
    rating: 5,
    quote: 'Wonderful tutor.',
    status: 'Approved',
    submittedOn: '2026-05-12',
    moderatedOn: '2026-05-13',
}

const renderView = (
    overrides: Partial<Parameters<typeof ReviewModerationView>[0]> = {}
) =>
    render(
        <ReviewModerationView
            pending={[]}
            published={[]}
            onApprove={vi.fn()}
            onReject={vi.fn()}
            onDelete={vi.fn()}
            onFeature={vi.fn()}
            {...overrides}
        />
    )

describe('ReviewModerationView', () => {
    it('shows empty states when nothing is waiting or published', () => {
        renderView()
        expect(screen.getByText(/no reviews waiting/i)).toBeInTheDocument()
        expect(
            screen.getByText(/no published reviews yet/i)
        ).toBeInTheDocument()
    })

    it('includes the year in the attribution when present', () => {
        renderView({ pending: [{ ...pending, year: '9' }] })
        expect(
            screen.getByText('Parent · Chemistry · Year 9')
        ).toBeInTheDocument()
    })

    it('badges a flagged review and leaves a clean one unbadged', () => {
        const { rerender } = render(
            <ReviewModerationView
                pending={[{ ...pending, flagged: true }]}
                published={[]}
                onApprove={vi.fn()}
                onReject={vi.fn()}
                onDelete={vi.fn()}
            />
        )
        expect(
            screen.getByText(/check for offensive language/i)
        ).toBeInTheDocument()

        rerender(
            <ReviewModerationView
                pending={[pending]}
                published={[]}
                onApprove={vi.fn()}
                onReject={vi.fn()}
                onDelete={vi.fn()}
            />
        )
        expect(
            screen.queryByText(/check for offensive language/i)
        ).not.toBeInTheDocument()
    })

    it('lists a pending review and wires each action to its id', async () => {
        const onApprove = vi.fn()
        const onReject = vi.fn()
        const onDelete = vi.fn()
        const user = userEvent.setup()

        renderView({ pending: [pending], onApprove, onReject, onDelete })

        expect(screen.getByText('Reliable and patient.')).toBeInTheDocument()
        expect(screen.getByText('Parent · Chemistry')).toBeInTheDocument()
        expect(screen.getByText(/submitted 2026-07-15/i)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /approve/i }))
        await user.click(screen.getByRole('button', { name: /reject/i }))
        // Delete asks first; confirming in the dialog removes it.
        await user.click(screen.getByRole('button', { name: 'Delete' }))
        await user.click(
            within(screen.getByRole('dialog')).getByRole('button', {
                name: /delete permanently/i,
            })
        )

        expect(onApprove).toHaveBeenCalledWith(3)
        expect(onReject).toHaveBeenCalledWith(3)
        expect(onDelete).toHaveBeenCalledWith(3)
    })

    it('lets the teacher delete a published review after confirming', async () => {
        const onDelete = vi.fn()
        const user = userEvent.setup()

        renderView({ published: [published], onDelete })

        expect(screen.getByText('Wonderful tutor.')).toBeInTheDocument()
        // Only the published card has actions here (pending is empty).
        await user.click(screen.getByRole('button', { name: 'Delete' }))
        await user.click(
            within(screen.getByRole('dialog')).getByRole('button', {
                name: /delete permanently/i,
            })
        )
        expect(onDelete).toHaveBeenCalledWith(1)
    })

    it('cancelling the delete dialog keeps the review to approve later', async () => {
        const onDelete = vi.fn()
        const user = userEvent.setup()

        renderView({ pending: [pending], onDelete })

        await user.click(screen.getByRole('button', { name: 'Delete' }))
        await user.click(
            within(screen.getByRole('dialog')).getByRole('button', {
                name: /cancel/i,
            })
        )

        expect(onDelete).not.toHaveBeenCalled()
        // The review is still there, ready to approve.
        expect(screen.getByText('Reliable and patient.')).toBeInTheDocument()
    })

    it('keeps the two lists separate', () => {
        renderView({ pending: [pending], published: [published] })
        // One Approve (pending only) and two Deletes (pending + published).
        expect(
            screen.getAllByRole('button', { name: /approve/i })
        ).toHaveLength(1)
        expect(
            screen.getAllByRole('button', { name: /delete/i })
        ).toHaveLength(2)
        // Sanity: the published quote sits under the Published heading's card.
        expect(screen.getByText('Wonderful tutor.')).toBeInTheDocument()
        expect(within(document.body).getByText(/published reviews/i)).toBeInTheDocument()
    })
})

// REQ-059 — which reviews lead the home page, chosen where reviews already
// get looked at.
describe('choosing reviews for the home page', () => {
    it('ticks a published review onto the home page', async () => {
        const onFeature = vi.fn()
        renderView({ published: [published], onFeature })

        await userEvent.click(
            screen.getByRole('checkbox', { name: /show on home page/i })
        )

        expect(onFeature).toHaveBeenCalledWith(published.id, true)
    })

    it('unticks one that is already there', async () => {
        const onFeature = vi.fn()
        renderView({
            published: [{ ...published, featured: true }],
            onFeature,
        })

        const box = screen.getByRole('checkbox', { name: /show on home page/i })
        expect(box).toBeChecked()

        await userEvent.click(box)

        expect(onFeature).toHaveBeenCalledWith(published.id, false)
    })

    it('counts how many are chosen', () => {
        renderView({
            published: [
                { ...published, id: 1, featured: true },
                { ...published, id: 2, featured: true },
                { ...published, id: 3 },
            ],
        })

        expect(
            screen.getByText(`2 of ${MAX_FEATURED} chosen`)
        ).toBeInTheDocument()
    })

    // At the cap the remaining boxes disable rather than letting the teacher
    // pick a fourth and be refused by the API.
    it('disables the rest once three are chosen, and says why', () => {
        renderView({
            published: [
                ...Array.from({ length: MAX_FEATURED }, (_, index) => ({
                    ...published,
                    id: index + 1,
                    featured: true,
                })),
                { ...published, id: 90 },
            ],
        })

        expect(
            screen.getByRole('checkbox', { name: /untick one to choose another/i })
        ).toBeDisabled()
        // The three already chosen stay tickable, so one can be swapped out.
        screen
            .getAllByRole('checkbox', { name: /show on home page/i })
            .forEach((box) => expect(box).toBeEnabled())
    })
})
