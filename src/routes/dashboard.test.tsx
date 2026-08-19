import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { DashboardRoute } from './dashboard'
import { fetchRemindersSucceeded, store } from '../store/store'
import { toDateKey } from '../utils/calendar'

const dayFromToday = (offset: number): string => {
    const date = new Date()
    date.setDate(date.getDate() + offset)
    return toDateKey(date)
}

const renderDashboard = () =>
    render(
        <Provider store={store}>
            <MemoryRouter>
                <DashboardRoute />
            </MemoryRouter>
        </Provider>
    )

// REQ-062 — a passed reminder leaves "what's coming up" and waits in
// "Past reminders". Left unfiltered, last week's "order the workbooks" led
// the list for ever, and a list that keeps what the teacher has dealt with
// stops being read.
describe('reminders that have passed', () => {
    const comingUp = () =>
        within(screen.getByRole('list', { name: /what's coming up/i }))

    it('keeps yesterday’s out of what is coming up', () => {
        store.dispatch(
            fetchRemindersSucceeded([
                { id: 1, date: dayFromToday(-1), text: 'Order the workbooks' },
                { id: 2, date: dayFromToday(0), text: 'Call about Tuesday' },
                { id: 3, date: dayFromToday(1), text: 'Book the hall' },
            ])
        )

        renderDashboard()

        expect(
            comingUp().queryByText('Order the workbooks')
        ).not.toBeInTheDocument()
        expect(comingUp().getByText('Call about Tuesday')).toBeInTheDocument()
        expect(comingUp().getByText('Book the hall')).toBeInTheDocument()
    })

    // The whole point of moving rather than deleting: it can still be found.
    it('keeps it where the teacher can look back at it', () => {
        store.dispatch(
            fetchRemindersSucceeded([
                { id: 1, date: dayFromToday(-1), text: 'Order the workbooks' },
                { id: 6, date: dayFromToday(-9), text: 'Chase the invoice' },
            ])
        )

        renderDashboard()

        expect(
            screen.getByText(/past reminders \(2\)/i)
        ).toBeInTheDocument()
        const earlier = within(
            screen.getByRole('list', { name: /past reminders/i })
        )
        expect(earlier.getByText('Order the workbooks')).toBeInTheDocument()
        // Newest first: the most recently missed is met first.
        expect(
            earlier.getAllByText(/order the workbooks|chase the invoice/i)[0]
        ).toHaveTextContent('Order the workbooks')
    })

    // An untimed reminder belongs to the whole day — "Thursday" is a real
    // reminder, and midnight would retire it before Thursday had started.
    it('keeps an untimed reminder up all day', () => {
        store.dispatch(
            fetchRemindersSucceeded([
                { id: 4, date: dayFromToday(0), text: 'Sometime today' },
            ])
        )

        renderDashboard()

        expect(comingUp().getByText('Sometime today')).toBeInTheDocument()
    })

    it('offers no section at all when nothing has passed', () => {
        store.dispatch(
            fetchRemindersSucceeded([
                { id: 7, date: dayFromToday(2), text: 'Still to come' },
            ])
        )

        renderDashboard()

        expect(screen.queryByText(/past reminders/i)).not.toBeInTheDocument()
    })
})
