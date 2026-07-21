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
            screen.getByRole('link', {
                name: `Call ${siteContent.contact.phone}`,
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', {
                name: `WhatsApp ${siteContent.contact.phone}`,
            })
        ).toBeInTheDocument()
    })

    it('opens the offerings page from its URL with the configured copy', () => {
        window.history.pushState({}, '', '/offerings')
        render(<App />)

        expect(
            screen.getByRole('heading', { name: /offerings/i })
        ).toBeInTheDocument()
        expect(
            screen.getByText(siteContent.offerings.hero.headline)
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', {
                name: siteContent.offerings.subjects[0].name,
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', {
                name: siteContent.offerings.approach[0].title,
            })
        ).toBeInTheDocument()
    })

    it('sends a visitor from the offerings CTA to contact us', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/offerings')
        render(<App />)

        await user.click(
            screen.getAllByRole('button', {
                name: /book a free assessment/i,
            })[0]
        )

        expect(
            screen.getByRole('heading', { name: /contact us/i })
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

describe('reviews (REQ-027)', () => {
    it('shows approved reviews on the public reviews page', async () => {
        window.history.pushState({}, '', '/reviews')
        render(<App />)

        expect(
            await screen.findByRole('heading', { name: /^reviews$/i })
        ).toBeInTheDocument()
        expect(
            screen.getByText(
                /volunteering answers/i
            )
        ).toBeInTheDocument()
    })

    it('holds the reviews page behind a skeleton until data lands', async () => {
        store.dispatch(resetStudentState())
        window.history.pushState({}, '', '/reviews')
        render(<App />)

        expect(screen.getByLabelText('Loading')).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', { name: /^reviews$/i })
        ).toBeInTheDocument()
    })

    it('submits a review and confirms it will be reviewed', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/reviews')
        render(<App />)

        await screen.findByRole('heading', { name: /^reviews$/i })
        await user.type(screen.getByLabelText('Your name'), 'Casey')
        await user.click(screen.getByRole('button', { name: '5 Stars' }))
        await user.type(
            screen.getByLabelText('Your review'),
            'A wonderful year of progress.'
        )
        await user.click(
            screen.getByRole('button', { name: /submit review/i })
        )

        expect(
            await screen.findByText(/once it has been approved/i)
        ).toBeInTheDocument()
    })

    it('reaches the reviews page from the sidebar', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/')
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', { name: /^reviews$/i })
        )

        expect(
            await screen.findByRole('heading', { name: /^reviews$/i })
        ).toBeInTheDocument()
    })

    it('moderates the queue: approving clears the pending review', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/reviews/moderation')
        render(<App />)

        expect(
            await screen.findByRole('heading', { name: /review moderation/i })
        ).toBeInTheDocument()
        // The seeded pending review is shown.
        expect(screen.getByText(/reliable, patient/i)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /approve/i }))

        expect(
            await screen.findByText(/review approved and published/i)
        ).toBeInTheDocument()
    })

    it('holds the moderation page behind a skeleton until data lands', async () => {
        store.dispatch(resetStudentState())
        window.history.pushState({}, '', '/reviews/moderation')
        render(<App />)

        expect(screen.getByLabelText('Loading')).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', { name: /review moderation/i })
        ).toBeInTheDocument()
    })

    it('rejects and deletes from the moderation queue', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/reviews/moderation')
        render(<App />)

        await screen.findByRole('heading', { name: /review moderation/i })
        await user.click(screen.getByRole('button', { name: /reject/i }))
        expect(
            await screen.findByText(/review rejected/i)
        ).toBeInTheDocument()
    })

    it('reaches moderation from the sidebar and deletes a review', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/')
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', {
                name: /review moderation/i,
            })
        )
        await screen.findByRole('heading', { name: /review moderation/i })

        // Both the pending queue and the published list carry Delete buttons;
        // deleting the first (the pending review) removes it either way.
        await user.click(
            screen.getAllByRole('button', { name: 'Delete' })[0]
        )
        // Delete now asks for confirmation before it removes anything.
        await user.click(
            within(screen.getByRole('dialog')).getByRole('button', {
                name: /delete permanently/i,
            })
        )
        expect(
            await screen.findByText(/review deleted/i)
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
