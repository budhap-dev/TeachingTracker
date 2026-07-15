import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { resetStudentState, store } from './store/store'
import { siteContent } from './data/siteContent'

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

describe('public pages', () => {
    it('opens the contact page from its URL with the configured details', () => {
        window.history.pushState({}, '', '/contact')
        render(<App />)

        expect(
            screen.getByRole('heading', { name: /contact us/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: siteContent.contact.email })
        ).toHaveAttribute('href', `mailto:${siteContent.contact.email}`)
        expect(
            screen.getByRole('link', { name: siteContent.contact.phone })
        ).toBeInTheDocument()
    })

    it('reaches the contact page from the sidebar', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/')
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', { name: /contact us/i })
        )

        expect(
            screen.getByRole('heading', { name: /contact us/i })
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
