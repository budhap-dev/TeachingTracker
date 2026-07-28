import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PrivacyView } from './PrivacyView'

describe('PrivacyView', () => {
    it('covers the policy sections a GDPR checklist asks for', () => {
        render(<PrivacyView />)

        expect(
            screen.getByRole('heading', { name: /privacy policy/i })
        ).toBeInTheDocument()
        // The data inventory names every processing purpose and its basis.
        expect(
            screen.getByRole('columnheader', { name: /lawful basis/i })
        ).toBeInTheDocument()
        expect(screen.getByText(/student details/i)).toBeInTheDocument()
        expect(
            screen.getByText(/contract — delivering the tutoring/i)
        ).toBeInTheDocument()
        // The sections the checklist demands, by heading.
        ;[
            /who we are/i,
            /children's information/i,
            /how long we keep it/i,
            /where it lives/i,
            /cookies/i,
            /your rights/i,
        ].forEach((heading) => {
            expect(
                screen.getByRole('heading', { name: heading })
            ).toBeInTheDocument()
        })
        // No-tracker cookie position, UK residency, and the complaints route.
        expect(screen.getByText(/no cookie banner/i)).toBeInTheDocument()
        expect(screen.getByText(/uk south/i)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /ico\.org\.uk/i })).toHaveAttribute(
            'href',
            'https://ico.org.uk'
        )
        // Rights requests route through the Contact page.
        expect(
            screen.getAllByRole('link', { name: /contact page/i }).length
        ).toBeGreaterThan(0)
    })
})
