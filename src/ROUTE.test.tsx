import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { resetStudentState, store } from './store/store'

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

describe('loading states', () => {
    it('waits for the fetch instead of redirecting a deep link while loading', async () => {
        // Empty + loading: the deep link must not bounce to the students list.
        store.dispatch(resetStudentState())
        window.history.pushState({}, '', '/students/1')
        render(<App />)

        expect(screen.getByText(/loading student/i)).toBeInTheDocument()

        // Once the mounted saga resolves, the student page renders.
        expect(
            await screen.findByRole('heading', { name: /asha perera/i })
        ).toBeInTheDocument()
    })

    it('renders the dashboard with zeroed stats before students load', async () => {
        store.dispatch(resetStudentState())
        window.history.pushState({}, '', '/')
        render(<App />)

        expect(
            screen.getByRole('heading', { name: /today at a glance/i })
        ).toBeInTheDocument()

        // Students arrive from the mounted saga.
        expect(
            await screen.findAllByRole('link', { name: /asha perera/i })
        ).not.toHaveLength(0)
    })
})
