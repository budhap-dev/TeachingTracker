import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('routing fallbacks', () => {
    it('redirects unknown routes to the dashboard', () => {
        window.history.pushState({}, '', '/does-not-exist')
        render(<App />)

        expect(
            screen.getByRole('heading', { name: /today at a glance/i })
        ).toBeInTheDocument()
    })

    it('redirects to the students list when the student id is unknown', () => {
        window.history.pushState({}, '', '/students/9999999')
        render(<App />)

        expect(
            screen.getByRole('heading', { name: /view students/i })
        ).toBeInTheDocument()
    })

    it('opens a student detail page directly from its URL', () => {
        window.history.pushState({}, '', '/students/1')
        render(<App />)

        expect(
            screen.getByRole('heading', { name: /asha perera/i })
        ).toBeInTheDocument()
    })
})
