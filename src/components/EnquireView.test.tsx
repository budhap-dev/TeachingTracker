import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EnquireView } from './EnquireView'

const renderView = (
    props: Partial<Parameters<typeof EnquireView>[0]> = {}
) => {
    const onSubmit = vi.fn()
    const utils = render(
        <EnquireView
            saving={false}
            submitted={false}
            onSubmit={onSubmit}
            {...props}
        />
    )
    return { onSubmit, ...utils }
}

/** Fills every required field with valid values. */
const fillValid = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/your name/i), 'Priya Sharma')
    await user.type(screen.getByLabelText(/email/i), 'priya@example.com')
    await user.click(screen.getByRole('combobox', { name: /child's year/i }))
    await user.click(screen.getByRole('option', { name: 'Year 10' }))
    await user.click(screen.getByRole('combobox', { name: /subject/i }))
    await user.click(screen.getByRole('option', { name: 'Mathematics' }))
    await user.keyboard('{Escape}')
    await user.type(
        screen.getByLabelText(/what would you like tutoring to achieve/i),
        'Confidence before mocks.'
    )
}

describe('EnquireView', () => {
    it('submits a completed enquiry, honeypot included', async () => {
        const user = userEvent.setup()
        const { onSubmit, container } = renderView()

        await fillValid(user)
        // Fill the honeypot to exercise its handler; the API drops these.
        fireEvent.change(container.querySelector('.enquire-website')!, {
            target: { value: 'http://bot.example' },
        })
        await user.click(screen.getByRole('button', { name: /send enquiry/i }))

        expect(onSubmit).toHaveBeenCalledWith({
            parentName: 'Priya Sharma',
            email: 'priya@example.com',
            phone: undefined,
            year: '10',
            subjects: ['Mathematics'],
            goal: 'Confidence before mocks.',
            mode: 'Either',
            website: 'http://bot.example',
        })
    })

    it('offers the published subjects, never unpublished ones', async () => {
        const user = userEvent.setup()
        renderView({ subjectChoices: ['Mathematics', 'Computer Science'] })

        await user.click(screen.getByRole('combobox', { name: /subject/i }))
        expect(
            screen.getByRole('option', { name: 'Computer Science' })
        ).toBeInTheDocument()
        // English was never taught here (owner report, 2026-08-10).
        expect(
            screen.queryByRole('option', { name: 'English' })
        ).not.toBeInTheDocument()
    })

    it('accepts phone as the only contact, with a chosen mode', async () => {
        const user = userEvent.setup()
        const { onSubmit } = renderView()

        await user.type(screen.getByLabelText(/your name/i), 'Tom Riley')
        await user.type(screen.getByLabelText(/phone/i), '+44 7700 900456')
        await user.click(
            screen.getByRole('combobox', { name: /preferred lessons/i })
        )
        await user.click(screen.getByRole('option', { name: 'Online' }))
        await user.click(
            screen.getByRole('combobox', { name: /child's year/i })
        )
        await user.click(screen.getByRole('option', { name: 'Year 8' }))
        await user.click(screen.getByRole('combobox', { name: /subject/i }))
        await user.click(screen.getByRole('option', { name: 'Chemistry' }))
        await user.keyboard('{Escape}')
        await user.type(
            screen.getByLabelText(/what would you like tutoring to achieve/i),
            'Essay structure.'
        )
        await user.click(screen.getByRole('button', { name: /send enquiry/i }))

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                parentName: 'Tom Riley',
                phone: '+44 7700 900456',
                email: undefined,
                mode: 'Online',
            })
        )
    })

    it('blocks an empty submit with inline errors on each missed field', async () => {
        const user = userEvent.setup()
        const { onSubmit } = renderView()

        await user.click(screen.getByRole('button', { name: /send enquiry/i }))

        expect(onSubmit).not.toHaveBeenCalled()
        expect(screen.getByText(/your name is required/i)).toBeInTheDocument()
        expect(
            screen.getByText(/give me an email or a phone number/i)
        ).toBeInTheDocument()
        expect(
            screen.getByText(/child's year is required/i)
        ).toBeInTheDocument()
        expect(
            screen.getByText(/pick at least one subject/i)
        ).toBeInTheDocument()
        expect(
            screen.getByText(/about the goal is required/i)
        ).toBeInTheDocument()
    })

    it('rejects a malformed email or phone with a format message', async () => {
        const user = userEvent.setup()
        const { onSubmit } = renderView()

        await fillValid(user)
        const email = screen.getByLabelText(/email/i)
        await user.clear(email)
        await user.type(email, 'not-an-email')
        await user.click(screen.getByRole('button', { name: /send enquiry/i }))
        expect(onSubmit).not.toHaveBeenCalled()
        expect(
            screen.getByText(/valid email address/i)
        ).toBeInTheDocument()

        await user.clear(email)
        await user.type(screen.getByLabelText(/phone/i), '12ab')
        await user.click(screen.getByRole('button', { name: /send enquiry/i }))
        expect(onSubmit).not.toHaveBeenCalled()
        expect(
            screen.getByText(/at least 7 digits/i)
        ).toBeInTheDocument()
    })

    it('disables the button while the enquiry is in flight', () => {
        renderView({ saving: true })
        expect(
            screen.getByRole('button', { name: /sending/i })
        ).toBeDisabled()
    })

    it('shows the thanks card once submitted', () => {
        renderView({ submitted: true })
        expect(
            screen.getByText(/thank you — your enquiry is in/i)
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: /send enquiry/i })
        ).not.toBeInTheDocument()
    })
})
