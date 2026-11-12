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
        // Student details and lesson files share the contract basis.
        expect(
            screen.getAllByText(/contract — delivering the tutoring/i)
        ).toHaveLength(2)
        // The sections the checklist demands, by heading.
        ;[
            /who i am/i,
            /children's information/i,
            /how long i keep it/i,
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
        // Lesson files (REQ-063): named, with their terms, residency and
        // the stripped photo metadata stated plainly.
        expect(
            screen.getByText(/photos and documents from lessons — for example/i)
        ).toBeInTheDocument()
        expect(
            screen.getByText(/consumer terms rather than the business terms/i)
        ).toBeInTheDocument()
        expect(screen.getByText(/outside the uk/i)).toBeInTheDocument()
        expect(
            screen.getByText(/location and camera details removed/i)
        ).toBeInTheDocument()
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
