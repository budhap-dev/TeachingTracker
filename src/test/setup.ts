import '@testing-library/jest-dom'
import { afterEach, beforeEach, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import {
    fetchPaymentsSucceeded,
    fetchPendingTestimonialsSucceeded,
    fetchSessionsSucceeded,
    fetchStudentsSucceeded,
    fetchTestimonialsSucceeded,
    resetStudentState,
    store,
} from '../store/store'
import {
    buildFixturePaymentsByMonth,
    buildFixtureSessions,
    buildFixtureTestimonials,
    fixtureStudents,
} from './fixtures'

const approvedTestimonials = () =>
    buildFixtureTestimonials().filter((t) => t.status === 'Approved')
const pendingTestimonials = () =>
    buildFixtureTestimonials().filter((t) => t.status === 'Pending')

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
    store.dispatch(fetchTestimonialsSucceeded(approvedTestimonials()))
    store.dispatch(fetchPendingTestimonialsSucceeded(pendingTestimonials()))

    // Default API mock, routed by path/method. Individual tests may override it.
    vi.stubGlobal(
        'fetch',
        vi.fn(async (input: RequestInfo | URL, init: RequestInit) => {
            const url = String(input)
            let body: unknown = fixtureStudents
            if (url.includes('/payments')) {
                body = buildFixturePaymentsByMonth()
            } else if (url.includes('/sessions')) {
                const memberMatch = url.match(/\/sessions\/(\d+)\/members$/)
                if (memberMatch && init.method === 'POST') {
                    // Adding a member returns the group's rows: the promoted
                    // lead (now with a groupId) and the joiner's new row.
                    const lead = Number(memberMatch[1])
                    const { studentId } = JSON.parse(String(init.body))
                    const leadRow = buildFixtureSessions().find(
                        (session) => session.id === lead
                    )
                    body = [
                        { ...leadRow, id: lead, groupId: `grp-${lead}` },
                        {
                            ...leadRow,
                            id: 9000 + studentId,
                            studentId,
                            studentName: `Student ${studentId}`,
                            groupId: `grp-${lead}`,
                        },
                    ]
                } else if (init.method === 'POST') {
                    // Creating echoes the new class back, as the API does.
                    body = { id: 999, ...JSON.parse(String(init.body)) }
                } else if (init.method === 'PUT') {
                    // Cancelling echoes the updated class, keyed by the id in
                    // the URL — /sessions/101 -> { id: 101, status }.
                    const id = Number(url.split('/sessions/')[1])
                    const existing = buildFixtureSessions().find(
                        (session) => session.id === id
                    )
                    body = { ...existing, ...JSON.parse(String(init.body)) }
                } else if (init.method === 'DELETE') {
                    // Deleting returns the removed ids — the whole group when
                    // the class is one.
                    const id = Number(url.split('/sessions/')[1])
                    const lead = buildFixtureSessions().find(
                        (session) => session.id === id
                    )
                    const ids = lead?.groupId
                        ? buildFixtureSessions()
                              .filter((s) => s.groupId === lead.groupId)
                              .map((s) => s.id)
                        : [id]
                    body = { ids }
                } else {
                    body = buildFixtureSessions()
                }
            } else if (url.includes('/testimonials')) {
                if (url.includes('/pending')) {
                    body = pendingTestimonials()
                } else if (init.method === 'POST') {
                    // Submitting acknowledges without echoing the record back.
                    body = { ok: true }
                } else if (init.method === 'PUT') {
                    // Moderating echoes the review with its new status.
                    const id = Number(url.split('/testimonials/')[1])
                    const existing = buildFixtureTestimonials().find(
                        (item) => item.id === id
                    )
                    body = {
                        ...existing,
                        ...JSON.parse(String(init.body)),
                        moderatedOn: '2026-07-21',
                    }
                } else if (init.method === 'DELETE') {
                    body = { id: Number(url.split('/testimonials/')[1]) }
                } else {
                    body = approvedTestimonials()
                }
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
