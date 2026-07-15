import '@testing-library/jest-dom'
import { afterEach, beforeEach, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import {
    fetchPaymentsSucceeded,
    fetchStudentsSucceeded,
    resetStudentState,
    store,
} from '../store/store'
import { buildFixturePayments, fixtureStudents } from './fixtures'

beforeEach(() => {
    // Reset the URL before each test so BrowserRouter-based renders always start
    // from the dashboard route and don't leak navigation state between tests.
    window.history.pushState({}, '', '/')

    // Give each test a clean store, pre-loaded with fixture data so component
    // assertions have data synchronously. The app still dispatches its
    // saga-fetch actions on mount; the fetch mock below serves that re-fetch.
    store.dispatch(resetStudentState())
    store.dispatch(fetchStudentsSucceeded(fixtureStudents))
    store.dispatch(fetchPaymentsSucceeded(buildFixturePayments()))

    // Default API mock. Individual tests may override with their own fetch stub.
    vi.stubGlobal(
        'fetch',
        vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input)
            const body = url.includes('/payments')
                ? buildFixturePayments()
                : fixtureStudents
            return {
                ok: true,
                status: 200,
                json: async () => body,
            } as Response
        })
    )
})

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
})

vi.stubGlobal('expect', expect)
