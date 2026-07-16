import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'
import {
    createSessionSucceeded,
    saveStudentFailed,
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
    it('renders nothing until something happens', () => {
        renderWithStore()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('announces a success and clears when dismissed', async () => {
        const user = userEvent.setup()
        const store = renderWithStore()

        store.dispatch(createSessionSucceeded(session))
        expect(await screen.findByText('Class booked.')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /close/i }))
        await waitFor(() =>
            expect(store.getState().students.notice).toBeNull()
        )
    })

    it('dismisses on Escape (a deliberate close, unlike clickaway)', async () => {
        const user = userEvent.setup()
        const store = renderWithStore()

        store.dispatch(createSessionSucceeded(session))
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
})
