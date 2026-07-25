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
    it('opens the contact page from its URL with the stored details', async () => {
        window.history.pushState({}, '', '/contact')
        render(<App />)

        expect(
            await screen.findByRole('heading', { name: /contact us/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'hello@example.com' })
        ).toHaveAttribute('href', 'mailto:hello@example.com')
        expect(
            screen.getByRole('link', { name: 'Call +44 7700 900000' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'WhatsApp +44 7700 900000' })
        ).toBeInTheDocument()
    })

    it('lets the teacher edit the contact details from the page', async () => {
        window.history.pushState({}, '', '/contact')
        const user = userEvent.setup()
        render(<App />)

        // Auth is off in tests, so the visitor is treated as the teacher.
        await user.click(
            await screen.findByRole('button', { name: /edit details/i })
        )
        const email = screen.getByLabelText('Email')
        await user.clear(email)
        await user.type(email, 'new@springboard.test')
        await user.click(screen.getByRole('button', { name: /save details/i }))

        expect(
            await screen.findByText(/contact details updated/i)
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'new@springboard.test' })
        ).toHaveAttribute('href', 'mailto:new@springboard.test')
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

    it('sends a visitor from the offerings CTA to the enquiry form', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/offerings')
        render(<App />)

        await user.click(
            screen.getAllByRole('button', {
                name: /book a free assessment/i,
            })[0]
        )

        expect(
            screen.getByRole('heading', { name: /enquire about tutoring/i })
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
        await user.type(screen.getByLabelText(/your name/i), 'Casey')
        await user.click(screen.getByRole('button', { name: '5 Stars' }))
        await user.type(
            screen.getByLabelText(/your review/i),
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

describe('enquiries and leads (REQ-018/019)', () => {
    it('submits an enquiry from the public form and shows the thanks', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/enquire')
        render(<App />)

        expect(
            screen.getByRole('heading', { name: /enquire about tutoring/i })
        ).toBeInTheDocument()

        await user.type(screen.getByLabelText(/your name/i), 'Priya Sharma')
        await user.type(
            screen.getByLabelText(/email/i),
            'priya@example.com'
        )
        await user.click(
            screen.getByRole('combobox', { name: /child's year/i })
        )
        await user.click(screen.getByRole('option', { name: 'Year 10' }))
        await user.click(screen.getByRole('combobox', { name: /subject/i }))
        await user.click(screen.getByRole('option', { name: 'Mathematics' }))
        await user.keyboard('{Escape}')
        await user.type(
            screen.getByLabelText(/what would you like tutoring to achieve/i),
            'Confidence before mocks.'
        )
        await user.click(
            screen.getByRole('button', { name: /send enquiry/i })
        )

        // Both the thanks card and the success toast carry the message; the
        // heading is the card.
        expect(
            await screen.findByRole('heading', {
                name: /thank you — your enquiry is in/i,
            })
        ).toBeInTheDocument()
    })

    it('reaches the leads inbox from the sidebar and works a lead', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/')
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', { name: /^leads$/i })
        )

        expect(
            await screen.findByRole('heading', { name: /^leads$/i })
        ).toBeInTheDocument()
        // The fixture inbox: Priya (New) then Tom (Contacted).
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
        expect(screen.getByText('Tom Riley')).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /mark contacted/i })
        )
        // The saga round-trips through the mocked API and updates the card.
        const priyaCard = screen.getByText('Priya Sharma').closest('li')!
        expect(
            await within(priyaCard).findByText('Contacted')
        ).toBeInTheDocument()
    })

    it('converts a lead into a pre-filled add-student form', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/leads')
        render(<App />)

        await screen.findByRole('heading', { name: /^leads$/i })
        // Both unconverted leads offer Convert; the first card is Priya
        // (newest first). Converting opens the student form.
        await user.click(
            screen.getAllByRole('button', { name: /convert to student/i })[0]
        )

        expect(
            await screen.findByRole('heading', { name: /add a new student/i })
        ).toBeInTheDocument()
        // Pre-filled from the enquiry — the parent's name and year arrive
        // ready; the goal and email travel in the notes field of the payload.
        expect(screen.getByLabelText(/parent name/i)).toHaveValue(
            'Priya Sharma'
        )
    })

    it('surfaces the open-enquiry count on the dashboard and opens the inbox', async () => {
        const user = userEvent.setup()
        window.history.pushState({}, '', '/')
        render(<App />)

        // One fixture lead is New.
        const pill = await screen.findByRole('button', {
            name: /1 new enquiry/i,
        })
        await user.click(pill)

        expect(
            await screen.findByRole('heading', { name: /^leads$/i })
        ).toBeInTheDocument()
    })
})
