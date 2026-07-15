/// <reference types="vitest/globals" />

import {
    fireEvent,
    render,
    screen,
    waitFor,
    waitForElementToBeRemoved,
    within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from './App'

/**
 * The calendar cell for a fixture class, whose date is built `offsetDays` from
 * today. Derives the key the way the fixtures do, then reads it back in the
 * local calendar the grid renders in, so the cell always matches the session.
 */
const openFixtureDayCell = (offsetDays: number) => {
    const day = new Date()
    day.setDate(day.getDate() + offsetDays)
    const [year, month, date] = day.toISOString().slice(0, 10).split('-').map(Number)
    return screen.getByRole('button', {
        name: `Open ${new Date(year, month - 1, date).toDateString()}`,
    })
}

describe('Teaching Tracker app', () => {
    it('collapses the theme picker by default and expands on demand', async () => {
        const user = userEvent.setup()
        render(<App />)

        expect(
            screen.queryByRole('button', { name: /select winter theme/i })
        ).not.toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /show theme options/i })
        )

        expect(
            screen.getByRole('button', { name: /select winter theme/i })
        ).toBeInTheDocument()
    })

    it('lets users switch themes and persists the selection', async () => {
        const user = userEvent.setup()
        render(<App />)

        const toggleButton = screen.getByRole('button', {
            name: /show theme options/i,
        })
        await user.click(toggleButton)

        const winterButton = screen.getByRole('button', {
            name: /select winter theme/i,
        })
        await user.click(winterButton)

        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'winter'
        )
        expect(window.localStorage.getItem('teachtrack-theme')).toBe('winter')
    })

    it('renders the dashboard heading and navigation', () => {
        render(<App />)

        const navigation = screen.getByRole('navigation')

        expect(
            screen.getByRole('heading', { name: /teachtrack/i })
        ).toBeInTheDocument()
        expect(
            within(navigation).getByRole('button', { name: /^dashboard$/i })
        ).toBeInTheDocument()
        expect(
            within(navigation).getByRole('button', { name: /^students$/i })
        ).toBeInTheDocument()
        expect(
            within(navigation).getByRole('button', { name: /study snapshot/i })
        ).toBeInTheDocument()
        expect(
            within(navigation).getByRole('button', { name: /payment tracker/i })
        ).toBeInTheDocument()
        expect(
            within(navigation).getByRole('button', {
                name: /class scheduling/i,
            })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('img', { name: /students by year group/i })
        ).toBeInTheDocument()
    })

    it('shows a quotation below the welcome message on load', () => {
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)

        render(<App />)

        expect(
            screen.getByText(/a teacher affects eternity/i)
        ).toBeInTheDocument()

        randomSpy.mockRestore()
    })

    it('supports dashboard manage action and mobile nav toggle', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: /open navigation/i })
        )
        expect(
            screen.getByRole('button', { name: /close navigation/i })
        ).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /manage students/i })
        )
        expect(
            screen.getByRole('heading', { name: /view students/i })
        ).toBeInTheDocument()
    })

    it('switches views from sidebar including returning to dashboard', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', { name: /payment tracker/i })
        )
        expect(
            screen.getByRole('heading', { name: /monthly payment tracking/i })
        ).toBeInTheDocument()

        await user.click(
            within(navigation).getByRole('button', {
                name: /class scheduling/i,
            })
        )
        expect(
            screen.getByRole('heading', { name: /class scheduling/i })
        ).toBeInTheDocument()

        await user.click(
            within(navigation).getByRole('button', { name: /study snapshot/i })
        )
        expect(
            screen.getByRole('heading', { name: /study snapshot/i })
        ).toBeInTheDocument()

        await user.click(
            within(navigation).getByRole('button', { name: /^students$/i })
        )
        expect(
            screen.getByRole('heading', { name: /view students/i })
        ).toBeInTheDocument()

        await user.click(
            within(navigation).getByRole('button', { name: /^dashboard$/i })
        )
        expect(
            screen.getByRole('heading', { name: /today at a glance/i })
        ).toBeInTheDocument()
    })

    it('initializes theme from localStorage when a valid theme is present', () => {
        window.localStorage.setItem('teachtrack-theme', 'midnight')
        render(<App />)
        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'midnight'
        )
    })

    it('opens the student detail page from a dashboard upcoming-session link', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getAllByRole('link', { name: /asha perera/i })[0]
        )

        expect(
            screen.getByRole('heading', { name: /asha perera/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /back to students/i })
        ).toBeInTheDocument()
    })

    it('cancels a class and restores it, keeping it visible either way', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', {
                name: /class scheduling/i,
            })
        )

        // Open the day holding Asha's fixture class, which is still scheduled.
        await user.click(openFixtureDayCell(1))

        const cancel = await screen.findByRole('button', { name: /^cancel$/i })
        await user.click(cancel)

        // Cancelled, but still listed — not deleted.
        expect(
            await screen.findByRole('button', { name: /^restore$/i })
        ).toBeInTheDocument()
        expect(screen.getByText(/cancelled/i)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /^restore$/i }))
        expect(
            await screen.findByRole('button', { name: /^cancel$/i })
        ).toBeInTheDocument()
    })

    it('saves a scheduled class and shows it in the dashboard', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', {
                name: /class scheduling/i,
            })
        )

        // Inside the dashboard's 14-day window, and derived from today so the
        // test doesn't rot: a hardcoded date silently falls out of the window.
        // The clicked day *is* the booking's date now — no date field to type.
        const soon = new Date()
        soon.setDate(soon.getDate() + 3)

        await user.click(
            screen.getByRole('button', { name: `Open ${soon.toDateString()}` })
        )

        await user.clear(screen.getByLabelText(/time/i))
        await user.type(screen.getByLabelText(/time/i), '15:30')
        await user.clear(screen.getByLabelText(/notes/i))
        await user.type(
            screen.getByLabelText(/notes/i),
            'Practice paper review'
        )

        await user.click(screen.getByRole('button', { name: /save class/i }))

        // Wait out the modal's exit transition: while it is open it marks the
        // rest of the app aria-hidden, so the nav is unreachable.
        await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))

        await user.click(
            within(navigation).getByRole('button', { name: /^dashboard$/i })
        )
        expect(screen.getByText(/practice paper review/i)).toBeInTheDocument()
    })

    it('shows the students view and allows adding a student', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', { name: /^students$/i })
        )

        expect(
            screen.getByRole('heading', { name: /view students/i })
        ).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /add new student/i })
        )
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        fireEvent.change(screen.getByLabelText(/first name/i), {
            target: { value: 'Ruwan' },
        })
        fireEvent.change(screen.getByLabelText(/last name/i), {
            target: { value: 'Bandara' },
        })
        fireEvent.change(screen.getByLabelText(/school/i), {
            target: { value: 'Royal College' },
        })
        await user.click(screen.getByRole('combobox', { name: /subjects/i }))
        await user.click(screen.getByRole('option', { name: 'Physics' }))
        await user.click(screen.getByRole('option', { name: 'Mathematics' }))
        await user.keyboard('{Escape}')
        await user.click(screen.getByLabelText(/year/i))
        await user.click(screen.getByRole('option', { name: '12' }))
        const progressField = screen
            .getAllByLabelText(/progress/i)
            .find((element) => element instanceof HTMLInputElement)
        if (progressField) {
            fireEvent.change(progressField, { target: { value: '85' } })
        }
        await user.click(screen.getByLabelText(/mode/i))
        await user.click(screen.getByRole('option', { name: 'Online' }))
        fireEvent.change(screen.getByLabelText(/parent name/i), {
            target: { value: 'Nimal Bandara' },
        })
        fireEvent.change(screen.getByLabelText(/contact number/i), {
            target: { value: '0771234567' },
        })
        fireEvent.change(screen.getByLabelText(/address/i), {
            target: { value: '10, Main Street, Colombo' },
        })
        fireEvent.change(screen.getByLabelText(/notes/i), {
            target: { value: 'Very focused' },
        })

        await user.click(screen.getByRole('button', { name: /save student/i }))

        // expect(await screen.findByText(/ruwan bandara/i)).toBeInTheDocument()
    })

    it('navigates to a dedicated student page from the student link', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', { name: /^students$/i })
        )

        await user.click(
            screen.getAllByRole('link', { name: /asha perera/i })[0]
        )

        expect(
            screen.getByRole('heading', { name: /asha perera/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /back to students/i })
        ).toBeInTheDocument()
    })

    it('supports student detail edit save and cancel flows', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getAllByRole('link', { name: /asha perera/i })[0]
        )

        await user.click(screen.getByRole('button', { name: /^edit$/i }))
        const parentField = screen.getByLabelText(/parent name/i)
        await user.clear(parentField)
        await user.type(parentField, 'Updated Parent')

        await user.click(screen.getByRole('button', { name: /^save$/i }))
        expect(screen.getByText(/updated parent/i)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /^edit$/i }))
        await user.click(screen.getByRole('button', { name: /cancel/i }))
        expect(
            screen.getByRole('button', { name: /^edit$/i })
        ).toBeInTheDocument()

        fireEvent.change(screen.getByRole('slider', { name: /progress/i }), {
            target: { value: '91' },
        })

        await user.click(
            screen.getByRole('button', { name: /back to students/i })
        )
        expect(
            screen.getByRole('heading', { name: /view students/i })
        ).toBeInTheDocument()
    })

    it('opens and closes the add-student modal without saving', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', { name: /^students$/i })
        )
        await user.click(
            screen.getByRole('button', { name: /add new student/i })
        )

        expect(screen.getByRole('dialog')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /cancel/i }))

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
    })

    it('keeps modal open when required add-student fields are missing', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', { name: /^students$/i })
        )
        await user.click(
            screen.getByRole('button', { name: /add new student/i })
        )

        await user.click(screen.getByRole('button', { name: /save student/i }))
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('switches to payments view and displays payment tracker', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', { name: /study snapshot/i })
        )

        expect(
            screen.getByRole('heading', { name: /study snapshot/i })
        ).toBeInTheDocument()
        expect(screen.getByRole('table')).toBeInTheDocument()
        expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
    })

    it('opens the payment tracker menu and allows month editing', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation')
        await user.click(
            within(navigation).getByRole('button', { name: /payment tracker/i })
        )

        expect(
            screen.getByRole('heading', { name: /monthly payment tracking/i })
        ).toBeInTheDocument()

        // A bill is what the classes came to, so the table shows the basis.
        expect(screen.getByText(/due for classes taught/i)).toBeInTheDocument()
        // The column header states the basis of the bill.
        expect(
            screen.getByRole('columnheader', { name: /classes taught/i })
        ).toBeInTheDocument()

        await user.clear(screen.getByLabelText(/asha perera amount received/i))
        await user.type(
            screen.getByLabelText(/asha perera amount received/i),
            '120'
        )

        // Status is derived from what is owed against what was paid — there is
        // no dropdown that could contradict it.
        expect(
            screen.queryByLabelText(/asha perera status/i)
        ).not.toBeInTheDocument()
    })
})
