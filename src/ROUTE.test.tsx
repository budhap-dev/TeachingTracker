import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { resetStudentState, store } from './store/store'
import { siteContent } from './data/siteContent'

describe('routing fallbacks', () => {
    it('redirects unknown routes to the dashboard', async () => {
        window.history.pushState({}, '', '/does-not-exist')
        render(<App />)

        expect(
            await screen.findByRole('heading', { name: /today at a glance/i })
        ).toBeInTheDocument()
    })

    it('redirects to the students list when the student id is unknown', async () => {
        window.history.pushState({}, '', '/students/9999999')
        render(<App />)

        expect(
            await screen.findByRole('heading', { name: /view students/i })
        ).toBeInTheDocument()
    })

    it('opens a student detail page directly from its URL', async () => {
        window.history.pushState({}, '', '/students/1')
        render(<App />)

        expect(
            await screen.findByRole('heading', { name: /asha perera/i })
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

    it('opens the offerings page from its URL with the configured copy', () => {
        window.history.pushState({}, '', '/offerings')
        render(<App />)

        expect(
            screen.getByRole('heading', { name: /offerings/i })
        ).toBeInTheDocument()
        expect(
            screen.getByText(siteContent.offerings.subjects[0])
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', {
                name: siteContent.offerings.approach[0].title,
            })
        ).toBeInTheDocument()
    })

    it('reaches the offerings page from the sidebar', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/')
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', { name: /offerings/i })
        )

        expect(
            screen.getByRole('heading', { name: /offerings/i })
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

        // The page-shaped skeleton holds the spot while the fetch runs.
        expect(screen.getByLabelText('Loading')).toBeInTheDocument()

        // Once the mounted saga resolves, the student page renders.
        expect(
            await screen.findByRole('heading', { name: /asha perera/i })
        ).toBeInTheDocument()
    })

    it.each([
        ['/study-snapshot', /study snapshot/i],
        ['/payments', /monthly payment tracking/i],
        ['/scheduling', /class scheduling/i],
    ])(
        'holds %s behind a skeleton until its data lands',
        async (path, heading) => {
            store.dispatch(resetStudentState())
            window.history.pushState({}, '', path)
            render(<App />)

            expect(screen.getByLabelText('Loading')).toBeInTheDocument()
            expect(
                await screen.findByRole('heading', { name: heading })
            ).toBeInTheDocument()
        }
    )

    it('shows a loading skeleton until the dashboard data lands', async () => {
        store.dispatch(resetStudentState())
        window.history.pushState({}, '', '/')
        render(<App />)

        // No zeroed tiles any more: a skeleton holds the layout instead.
        expect(screen.getByLabelText('Loading')).toBeInTheDocument()
        expect(
            screen.queryByRole('heading', { name: /today at a glance/i })
        ).not.toBeInTheDocument()

        // Students arrive from the mounted saga.
        expect(
            await screen.findAllByRole('link', { name: /asha perera/i })
        ).not.toHaveLength(0)
    })
})
