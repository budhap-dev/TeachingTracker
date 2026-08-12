import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    createSessionSucceeded,
    saveStudentFailed,
    setSessionStatusSucceeded,
    studentReducer,
} from '../store/store'
import type { ScheduledSession } from '../data/students'
import { NoticeToast } from './NoticeToast'

const session: ScheduledSession = {
    id: 1,
    studentId: 1,
    studentName: 'Asha Perera',
    year: '10',
    subject: 'Mathematics',
    date: '2026-09-01',
    time: '16:00',
    durationMinutes: 60,
    notes: '',
    status: 'Scheduled',
}

/** A real store, so the toast exercises the actual reducer round-trip. */
const renderWithStore = () => {
    const store = configureStore({ reducer: { students: studentReducer } })
    render(
        <Provider store={store}>
            <NoticeToast />
        </Provider>
    )
    return store
}

describe('NoticeToast', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('renders nothing until something happens', () => {
        renderWithStore()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('announces a success and clears when dismissed', async () => {
        const user = userEvent.setup()
        const store = renderWithStore()

        store.dispatch(createSessionSucceeded([session]))
        expect(await screen.findByText('Class booked.')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /close/i }))
        await waitFor(() =>
            expect(store.getState().students.notice).toBeNull()
        )
    })

    it('dismisses on Escape (a deliberate close, unlike clickaway)', async () => {
        const user = userEvent.setup()
        const store = renderWithStore()

        store.dispatch(createSessionSucceeded([session]))
        expect(await screen.findByText('Class booked.')).toBeInTheDocument()

        await user.keyboard('{Escape}')
        await waitFor(() =>
            expect(store.getState().students.notice).toBeNull()
        )
    })

    it('keeps an error up through a stray click elsewhere', async () => {
        const user = userEvent.setup()
        const store = renderWithStore()

        store.dispatch(saveStudentFailed('Could not save student: API down'))
        expect(
            await screen.findByText(/could not save student/i)
        ).toBeInTheDocument()

        // A click on the page must not eat an unread error (clickaway guard).
        await user.click(document.body)
        expect(store.getState().students.notice).not.toBeNull()
        expect(
            screen.getByText(/could not save student/i)
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /close/i }))
        await waitFor(() =>
            expect(store.getState().students.notice).toBeNull()
        )
    })

    it('gives a second outcome its own full life, not the leftovers', () => {
        // Edit a class and cancel it moments later: MUI arms the auto-hide
        // timer on open, not on message change, so the second toast used to
        // inherit whatever was left of the first and could flash by.
        vi.useFakeTimers()
        const store = renderWithStore()

        act(() => {
            store.dispatch(createSessionSucceeded([session]))
        })
        expect(screen.getByText('Class booked.')).toBeInTheDocument()

        // 3s in — still inside the first toast's 3.5s — the next outcome.
        act(() => {
            vi.advanceTimersByTime(3000)
        })
        act(() => {
            store.dispatch(
                setSessionStatusSucceeded([
                    { ...session, status: 'Cancelled' },
                ])
            )
        })
        expect(screen.getByText('Class cancelled.')).toBeInTheDocument()

        // The first toast's timer would have fired here; the second has
        // only been up for 0.6s and must survive.
        act(() => {
            vi.advanceTimersByTime(600)
        })
        expect(store.getState().students.notice).not.toBeNull()

        // It still goes on its own schedule.
        act(() => {
            vi.advanceTimersByTime(3000)
        })
        expect(store.getState().students.notice).toBeNull()
    })
})
