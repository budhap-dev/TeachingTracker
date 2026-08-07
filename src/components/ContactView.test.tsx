import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ContactView } from './ContactView'
import { toTelHref, toWhatsAppHref } from '../data/siteContent'
import type { Contact } from '../data/contact'

const both: Contact = { email: 'tutor@example.com', phone: '+44 7700 900123' }

const renderView = (props: Partial<Parameters<typeof ContactView>[0]> = {}) =>
    render(
        <ContactView
            contact={both}
            canEdit={false}
            saving={false}
            onSave={vi.fn()}
            {...props}
        />
    )

describe('ContactView', () => {
    it('shows email plus call and WhatsApp actions for the phone', () => {
        renderView()

        expect(
            screen.getByRole('heading', { name: /contact me/i })
        ).toBeInTheDocument()

        const email = screen.getByRole('link', { name: 'tutor@example.com' })
        expect(email).toHaveAttribute('href', 'mailto:tutor@example.com')

        // The number is shown as text on both phone rows — call and WhatsApp
        // are separate channels now, each with its own icon link.
        expect(screen.getAllByText('+44 7700 900123')).toHaveLength(2)
        expect(
            screen.getByRole('link', { name: 'Call +44 7700 900123' })
        ).toHaveAttribute('href', 'tel:+447700900123')
        expect(
            screen.getByRole('link', { name: 'WhatsApp +44 7700 900123' })
        ).toHaveAttribute('href', 'https://wa.me/447700900123')
        // A visitor gets no edit affordance.
        expect(
            screen.queryByRole('button', { name: /edit details/i })
        ).not.toBeInTheDocument()
    })

    it('hides the phone row when only an email is set', () => {
        renderView({ contact: { email: 'only@mail.com' } })

        expect(
            screen.getByRole('link', { name: 'only@mail.com' })
        ).toBeInTheDocument()
        expect(screen.queryByText(/^Phone$/)).not.toBeInTheDocument()
        expect(
            screen.queryByRole('link', { name: /^Call/ })
        ).not.toBeInTheDocument()
    })

    it('hides the email row when only a phone is set', () => {
        renderView({ contact: { phone: '020 7946 0000' } })

        expect(
            screen.getByRole('link', { name: 'Call 020 7946 0000' })
        ).toHaveAttribute('href', 'tel:02079460000')
        expect(screen.queryByText(/^Email$/)).not.toBeInTheDocument()
    })

    it('shows availability notes and puts the preferred channel first', () => {
        renderView({
            contact: {
                ...both,
                availability: {
                    email: 'Anytime — we reply within a day',
                    call: 'Evenings and weekends only',
                    whatsapp: 'As per availability',
                },
                preferred: 'whatsapp',
            },
        })

        expect(
            screen.getByText('Anytime — we reply within a day')
        ).toBeInTheDocument()
        expect(
            screen.getByText('Evenings and weekends only')
        ).toBeInTheDocument()
        expect(screen.getByText('As per availability')).toBeInTheDocument()

        // WhatsApp wears the pill and sorts to the top of the list.
        const items = screen.getAllByRole('listitem')
        expect(items[0]).toHaveTextContent('WhatsApp')
        expect(items[0]).toHaveTextContent('Preferred')
        expect(items[1]).toHaveTextContent('Email')
        expect(items[2]).toHaveTextContent('Call')
        expect(screen.getAllByText('Preferred')).toHaveLength(1)
    })

    it('saves availability notes and the preferred channel', async () => {
        const onSave = vi.fn()
        const user = userEvent.setup()
        renderView({ canEdit: true, onSave })

        await user.click(screen.getByRole('button', { name: /edit details/i }))
        await user.type(
            screen.getByLabelText('Call availability'),
            'Evenings and weekends only'
        )
        await user.type(
            screen.getByLabelText('WhatsApp availability'),
            'As per availability'
        )
        await user.click(
            screen.getByLabelText('Preferred contact method')
        )
        await user.click(screen.getByRole('option', { name: 'WhatsApp' }))
        await user.click(screen.getByRole('button', { name: /save details/i }))

        expect(onSave).toHaveBeenCalledWith({
            email: 'tutor@example.com',
            phone: '+44 7700 900123',
            availability: {
                email: '',
                call: 'Evenings and weekends only',
                whatsapp: 'As per availability',
            },
            preferred: 'whatsapp',
        })
    })

    it('seeds the editor with the stored notes and preference', async () => {
        const user = userEvent.setup()
        renderView({
            canEdit: true,
            contact: {
                ...both,
                availability: { call: 'Evenings only' },
                preferred: 'email',
            },
        })

        await user.click(screen.getByRole('button', { name: /edit details/i }))
        expect(screen.getByLabelText('Call availability')).toHaveValue(
            'Evenings only'
        )
        expect(
            screen.getByLabelText('Preferred contact method')
        ).toHaveTextContent('Email')
    })

    it('invites the teacher to add details when none are set', () => {
        renderView({ contact: {}, canEdit: true })

        expect(
            screen.getByText(/contact details will be available/i)
        ).toBeInTheDocument()
        // No rows, but the teacher can still open the editor.
        expect(
            screen.getByRole('button', { name: /edit details/i })
        ).toBeInTheDocument()
    })

    it('lets the teacher edit and save the details', async () => {
        const onSave = vi.fn()
        const user = userEvent.setup()
        renderView({ canEdit: true, onSave })

        await user.click(screen.getByRole('button', { name: /edit details/i }))
        // The form seeds from the current values.
        const email = screen.getByLabelText('Email')
        expect(email).toHaveValue('tutor@example.com')
        await user.clear(email)
        await user.type(email, 'new@example.com')
        await user.click(screen.getByRole('button', { name: /save details/i }))

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'new@example.com',
                phone: '+44 7700 900123',
            })
        )
        // The form closes back to the display, with the note visible again.
        expect(
            screen.queryByRole('button', { name: /save details/i })
        ).not.toBeInTheDocument()
    })

    it('sends blank fields through so a detail can be removed', async () => {
        const onSave = vi.fn()
        const user = userEvent.setup()
        renderView({ canEdit: true, onSave })

        await user.click(screen.getByRole('button', { name: /edit details/i }))
        await user.clear(screen.getByLabelText('Phone'))
        await user.click(screen.getByRole('button', { name: /save details/i }))

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'tutor@example.com',
                phone: '',
            })
        )
    })

    it('blocks saving a malformed email with an inline error (REQ-029)', async () => {
        const onSave = vi.fn()
        const user = userEvent.setup()
        renderView({ canEdit: true, onSave })

        await user.click(screen.getByRole('button', { name: /edit details/i }))
        const email = screen.getByLabelText('Email')
        await user.clear(email)
        await user.type(email, 'not-an-email')
        await user.click(screen.getByRole('button', { name: /save details/i }))

        // The save is refused; the field carries the red border + message.
        expect(onSave).not.toHaveBeenCalled()
        expect(email).toHaveAccessibleDescription(/valid email address/i)
        expect(email).toHaveAttribute('aria-invalid', 'true')
        // The form stays open for the fix.
        expect(
            screen.getByRole('button', { name: /save details/i })
        ).toBeInTheDocument()

        // Fixing the field clears the error and lets the save through.
        await user.clear(email)
        await user.type(email, 'fixed@example.com')
        await user.click(screen.getByRole('button', { name: /save details/i }))
        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'fixed@example.com',
                phone: '+44 7700 900123',
            })
        )
    })

    it('blocks saving a malformed phone with an inline error (REQ-029)', async () => {
        const onSave = vi.fn()
        const user = userEvent.setup()
        renderView({ canEdit: true, onSave })

        await user.click(screen.getByRole('button', { name: /edit details/i }))
        const phone = screen.getByLabelText('Phone')
        await user.clear(phone)
        await user.type(phone, '12ab34')
        await user.click(screen.getByRole('button', { name: /save details/i }))

        expect(onSave).not.toHaveBeenCalled()
        expect(phone).toHaveAttribute('aria-invalid', 'true')
        expect(phone).toHaveAccessibleDescription(/at least 7 digits/i)

        // Too few digits is also refused, even when the characters are legal.
        await user.clear(phone)
        await user.type(phone, '+44 123')
        await user.click(screen.getByRole('button', { name: /save details/i }))
        expect(onSave).not.toHaveBeenCalled()

        await user.clear(phone)
        await user.type(phone, '+44 7700 900123')
        await user.click(screen.getByRole('button', { name: /save details/i }))
        expect(onSave).toHaveBeenCalledTimes(1)
    })

    it('starts the editor empty when there are no details yet', async () => {
        const onSave = vi.fn()
        const user = userEvent.setup()
        renderView({ contact: {}, canEdit: true, onSave })

        await user.click(screen.getByRole('button', { name: /edit details/i }))
        expect(screen.getByLabelText('Email')).toHaveValue('')
        await user.type(screen.getByLabelText('Email'), 'fresh@example.com')
        await user.click(screen.getByRole('button', { name: /save details/i }))

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'fresh@example.com',
                phone: '',
            })
        )
    })

    it('cancels editing without saving', async () => {
        const onSave = vi.fn()
        const user = userEvent.setup()
        renderView({ canEdit: true, onSave })

        await user.click(screen.getByRole('button', { name: /edit details/i }))
        await user.type(screen.getByLabelText('Email'), 'ignored')
        await user.click(screen.getByRole('button', { name: /cancel/i }))

        expect(onSave).not.toHaveBeenCalled()
        // Back to the display, showing the original email untouched.
        expect(
            screen.getByRole('link', { name: 'tutor@example.com' })
        ).toBeInTheDocument()
    })

    it('shows a saving state on the button while an update is in flight', async () => {
        const user = userEvent.setup()
        renderView({ canEdit: true, saving: true })

        await user.click(screen.getByRole('button', { name: /edit details/i }))
        const save = screen.getByRole('button', { name: /saving/i })
        expect(save).toBeDisabled()
    })
})

describe('toTelHref', () => {
    it('keeps digits and a leading plus, dropping everything else', () => {
        expect(toTelHref('+44 7700 900123')).toBe('tel:+447700900123')
        expect(toTelHref('(020) 7946-0000')).toBe('tel:02079460000')
        expect(toTelHref('07700 900123')).toBe('tel:07700900123')
    })
})

describe('toWhatsAppHref', () => {
    it('keeps only digits, dropping the plus and spacing', () => {
        expect(toWhatsAppHref('+44 7700 900123')).toBe(
            'https://wa.me/447700900123'
        )
        expect(toWhatsAppHref('(020) 7946-0000')).toBe(
            'https://wa.me/02079460000'
        )
    })
})
