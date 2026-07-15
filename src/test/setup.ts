import '@testing-library/jest-dom'
import { afterEach, beforeEach, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import {
    fetchPaymentsSucceeded,
    fetchSessionsSucceeded,
    fetchStudentsSucceeded,
    resetStudentState,
    store,
} from '../store/store'
import {
    buildFixturePaymentsByMonth,
    buildFixtureSessions,
    fixtureStudents,
} from './fixtures'

beforeEach(() => {
    // Reset the URL before each test so BrowserRouter-based renders always start
    // from the dashboard route and don't leak navigation state between tests.
    window.history.pushState({}, '', '/')

    // Give each test a clean store, pre-loaded with fixture data so component
    // assertions have data synchronously. The app still dispatches its
    // saga-fetch actions on mount; the fetch mock below serves that re-fetch.
    store.dispatch(resetStudentState())
    store.dispatch(fetchStudentsSucceeded(fixtureStudents))
    store.dispatch(fetchPaymentsSucceeded(buildFixturePaymentsByMonth()))
    store.dispatch(fetchSessionsSucceeded(buildFixtureSessions()))

    // Default API mock, routed by path/method. Individual tests may override it.
    vi.stubGlobal(
        'fetch',
        vi.fn(async (input: RequestInfo | URL, init: RequestInit) => {
            const url = String(input)
            let body: unknown = fixtureStudents
            if (url.includes('/payments')) {
                body = buildFixturePaymentsByMonth()
            } else if (url.includes('/sessions')) {
                // POST echoes back the created session, as the API does.
                body =
                    init.method === 'POST'
                        ? { id: 999, ...JSON.parse(String(init.body)) }
                        : buildFixtureSessions()
            } else if (init.method === 'POST' || init.method === 'PUT') {
                // Upserting a student echoes the saved record back. Spreading
                // the payload last keeps its id on an update, and falls back to
                // a generated one when creating.
                body = { id: 999, ...JSON.parse(String(init.body)) }
            }
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
