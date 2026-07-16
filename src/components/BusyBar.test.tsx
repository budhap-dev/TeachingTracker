import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'
import type { PaymentRecordInput, Student } from '../data/students'
import type { ScheduledSessionInput } from '../store/store'
import {
    createSessionRequested,
    createSessionFailed,
    fetchPaymentsSucceeded,
    fetchSessionsSucceeded,
    fetchStudentsSucceeded,
    savePaymentRequested,
    savePaymentFailed,
    saveStudentRequested,
    saveStudentFailed,
    studentReducer,
} from '../store/store'
import { BusyBar } from './BusyBar'

const renderWithStore = () => {
    const store = configureStore({ reducer: { students: studentReducer } })
    render(
        <Provider store={store}>
            <BusyBar />
        </Provider>
    )
    return store
}

type Store = ReturnType<typeof renderWithStore>

const settleInitialLoads = (store: Store) =>
    act(() => {
        store.dispatch(fetchStudentsSucceeded([]))
        store.dispatch(fetchPaymentsSucceeded([]))
        store.dispatch(fetchSessionsSucceeded([]))
    })

const barVisible = () => screen.queryByRole('progressbar') !== null

describe('BusyBar', () => {
    it('shows during the initial loads and clears when they settle', () => {
        const store = renderWithStore()
        // Fresh state: all three fetches are in flight.
        expect(barVisible()).toBe(true)

        settleInitialLoads(store)
        expect(barVisible()).toBe(false)
    })

    it('shows while any save is in flight', () => {
        const store = renderWithStore()
        settleInitialLoads(store)

        // Student save.
        act(() => {
            store.dispatch(saveStudentRequested({} as Omit<Student, 'id'>))
        })
        expect(barVisible()).toBe(true)
        act(() => {
            store.dispatch(saveStudentFailed('nope'))
        })
        expect(barVisible()).toBe(false)

        // Class save.
        act(() => {
            store.dispatch(createSessionRequested({} as ScheduledSessionInput))
        })
        expect(barVisible()).toBe(true)
        act(() => {
            store.dispatch(createSessionFailed('nope'))
        })
        expect(barVisible()).toBe(false)

        // Payment save.
        act(() => {
            store.dispatch(savePaymentRequested({} as PaymentRecordInput))
        })
        expect(barVisible()).toBe(true)
        act(() => {
            store.dispatch(savePaymentFailed('nope'))
        })
        expect(barVisible()).toBe(false)
    })
})
