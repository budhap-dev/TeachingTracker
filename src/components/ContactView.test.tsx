import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContactView } from './ContactView'
import { toTelHref, toWhatsAppHref } from '../data/siteContent'

describe('ContactView', () => {
    it('shows email plus call and WhatsApp actions for the phone', () => {
        render(<ContactView email="tutor@example.com" phone="+44 7700 900123" />)

        expect(
            screen.getByRole('heading', { name: /contact us/i })
        ).toBeInTheDocument()

        const email = screen.getByRole('link', { name: 'tutor@example.com' })
        expect(email).toHaveAttribute('href', 'mailto:tutor@example.com')

        // The number is shown as text, with a call and a WhatsApp icon link.
        expect(screen.getByText('+44 7700 900123')).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Call +44 7700 900123' })
        ).toHaveAttribute('href', 'tel:+447700900123')
        expect(
            screen.getByRole('link', { name: 'WhatsApp +44 7700 900123' })
        ).toHaveAttribute('href', 'https://wa.me/447700900123')
    })

    it('renders whatever details it is given', () => {
        render(<ContactView email="other@school.org" phone="020 7946 0000" />)

        expect(
            screen.getByRole('link', { name: 'other@school.org' })
        ).toHaveAttribute('href', 'mailto:other@school.org')
        expect(
            screen.getByRole('link', { name: 'Call 020 7946 0000' })
        ).toHaveAttribute('href', 'tel:02079460000')
        expect(
            screen.getByRole('link', { name: 'WhatsApp 020 7946 0000' })
        ).toHaveAttribute('href', 'https://wa.me/02079460000')
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
