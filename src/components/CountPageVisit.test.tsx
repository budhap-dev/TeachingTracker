import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Hoisted, because vi.mock's factory runs before the file's own statements.
const { countPageVisit } = vi.hoisted(() => ({ countPageVisit: vi.fn() }))
vi.mock('../api/pageVisits', () => ({ countPageVisit }))
vi.mock('../auth/msal', () => ({ isAuthConfigured: () => false }))

import { CountPageVisit } from './CountPageVisit'

afterEach(() => {
    countPageVisit.mockClear()
})

describe('CountPageVisit', () => {
    it('counts nothing for the teacher — their own browsing is not data', () => {
        // An auth-less build IS the teacher (no Entra config), so a page the
        // teacher opens posts nothing at all.
        render(<CountPageVisit page="pricing" />)

        expect(countPageVisit).not.toHaveBeenCalled()
    })

    it('renders nothing at all', () => {
        const { container } = render(<CountPageVisit page="home" />)

        expect(container).toBeEmptyDOMElement()
    })
})
