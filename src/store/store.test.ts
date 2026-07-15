import { describe, expect, it } from 'vitest'
import type { PaymentRecord, ScheduledSession, Student } from '../data/students'
import {
    addStudent,
    createSessionFailed,
    createSessionRequested,
    createSessionSucceeded,
    fetchPaymentsFailed,
    fetchPaymentsRequested,
    fetchPaymentsSucceeded,
    fetchSessionsFailed,
    fetchSessionsRequested,
    fetchSessionsSucceeded,
    fetchStudentsFailed,
    fetchStudentsRequested,
    fetchStudentsSucceeded,
    resetStudentState,
    studentReducer,
    updatePaymentRecord,
    updateProgress,
    updateStudentDetails,
} from './store'

const buildStudent = (overrides: Partial<Student> = {}): Student => ({
    id: overrides.id ?? 1,
    studentId: overrides.studentId ?? 'STU-TEST01',
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'Student',
    dob: overrides.dob ?? '2010-01-01',
    subjects: overrides.subjects ?? ['Mathematics'],
    school: overrides.school ?? 'Test School',
    year: overrides.year ?? '10',
    progress: overrides.progress ?? 60,
    mode: overrides.mode ?? 'Online',
    notes: overrides.notes ?? 'Note',
    parentName: overrides.parentName ?? 'Parent Name',
    contactNumber: overrides.contactNumber ?? '0700000000',
    address: overrides.address ?? 'Test Address',
})

const buildPayment = (overrides: Partial<PaymentRecord> = {}): PaymentRecord => ({
    id: overrides.id ?? 1,
    studentId: overrides.studentId ?? 1,
    studentName: overrides.studentName ?? 'Test Student',
    month: overrides.month ?? '2026-01',
    monthlyFee: overrides.monthlyFee ?? 120,
    amountPaid: overrides.amountPaid ?? 0,
    status: overrides.status ?? 'Pending',
    notes: overrides.notes ?? '',
})

/** A month group mirroring the API's /payments/by-month shape. */
const buildGroup = (records: PaymentRecord[], month = '2026-01') => {
    const totalExpected = records.reduce((s, r) => s + r.monthlyFee, 0)
    const totalReceived = records.reduce((s, r) => s + r.amountPaid, 0)
    return {
        month,
        totalExpected,
        totalReceived,
        totalOutstanding: totalExpected - totalReceived,
        records,
    }
}

const buildSession = (overrides: Partial<ScheduledSession> = {}): ScheduledSession => ({
    id: overrides.id ?? 101,
    studentId: overrides.studentId ?? 1,
    studentName: overrides.studentName ?? 'Test Student',
    year: overrides.year ?? '10',
    subject: overrides.subject ?? 'Mathematics',
    date: overrides.date ?? '2026-08-01',
    time: overrides.time ?? '10:00',
    notes: overrides.notes ?? 'Revision',
})

/** Fresh initial state straight from the reducer. */
const initial = () => studentReducer(undefined, { type: '@@INIT' })

describe('student reducer', () => {
    it('starts empty and loading — all data comes from the API', () => {
        const state = initial()

        expect(state.students).toEqual([])
        expect(state.paymentsByMonth).toEqual([])
        expect(state.scheduledSessions).toEqual([])
        expect(state.loading).toBe(true)
        expect(state.paymentsLoading).toBe(true)
        expect(state.sessionsLoading).toBe(true)
        expect(state.error).toBeNull()
    })

    it('resets back to the initial state', () => {
        const loaded = studentReducer(
            initial(),
            fetchStudentsSucceeded([buildStudent()])
        )
        expect(loaded.students).toHaveLength(1)

        const reset = studentReducer(loaded, resetStudentState())
        expect(reset.students).toEqual([])
        expect(reset.loading).toBe(true)
    })

    describe('students fetch lifecycle', () => {
        it('marks loading on request and clears any previous error', () => {
            const failed = studentReducer(initial(), fetchStudentsFailed('boom'))
            expect(failed.error).toBe('boom')
            expect(failed.loading).toBe(false)

            const requested = studentReducer(failed, fetchStudentsRequested())
            expect(requested.loading).toBe(true)
            expect(requested.error).toBeNull()
        })

        it('replaces students on success when there are no local changes', () => {
            const state = studentReducer(
                initial(),
                fetchStudentsSucceeded([buildStudent({ id: 1 })])
            )

            expect(state.students).toHaveLength(1)
            expect(state.loading).toBe(false)
        })

        it('merges fetched students with local changes, updating and appending', () => {
            // A local add flips hasLocalStudentChanges, switching to merge mode.
            const withLocal = studentReducer(
                initial(),
                addStudent(buildStudent({ id: 99, firstName: 'Local' }))
            )
            const localId = withLocal.students[0].id

            const merged = studentReducer(
                withLocal,
                fetchStudentsSucceeded([
                    // Same id as the local student -> updated in place.
                    buildStudent({ id: localId, firstName: 'UpdatedLocal' }),
                    // New id -> appended.
                    buildStudent({ id: 4242, firstName: 'Remote' }),
                ])
            )

            expect(
                merged.students.find((s) => s.id === localId)?.firstName
            ).toBe('UpdatedLocal')
            expect(merged.students.find((s) => s.id === 4242)?.firstName).toBe(
                'Remote'
            )
        })

        it('records an error on failure', () => {
            const state = studentReducer(
                initial(),
                fetchStudentsFailed('network down')
            )
            expect(state.loading).toBe(false)
            expect(state.error).toBe('network down')
        })
    })

    describe('payments fetch lifecycle', () => {
        it('marks payments loading on request', () => {
            const state = studentReducer(initial(), fetchPaymentsRequested())
            expect(state.paymentsLoading).toBe(true)
        })

        it('stores month-grouped payments on success', () => {
            const state = studentReducer(
                initial(),
                fetchPaymentsSucceeded([buildGroup([buildPayment()])])
            )
            expect(state.paymentsByMonth).toHaveLength(1)
            expect(state.paymentsByMonth[0].month).toBe('2026-01')
            expect(state.paymentsLoading).toBe(false)
        })

        it('records an error on failure', () => {
            const state = studentReducer(
                initial(),
                fetchPaymentsFailed('payments down')
            )
            expect(state.paymentsLoading).toBe(false)
            expect(state.error).toBe('payments down')
        })
    })

    describe('sessions lifecycle', () => {
        it('marks sessions loading on request', () => {
            const state = studentReducer(initial(), fetchSessionsRequested())
            expect(state.sessionsLoading).toBe(true)
        })

        it('stores sessions on success', () => {
            const state = studentReducer(
                initial(),
                fetchSessionsSucceeded([buildSession()])
            )
            expect(state.scheduledSessions).toHaveLength(1)
            expect(state.sessionsLoading).toBe(false)
        })

        it('records an error when loading sessions fails', () => {
            const state = studentReducer(
                initial(),
                fetchSessionsFailed('sessions down')
            )
            expect(state.sessionsLoading).toBe(false)
            expect(state.error).toBe('sessions down')
        })

        it('clears the error when a create is requested', () => {
            const failed = studentReducer(
                initial(),
                createSessionFailed('previous failure')
            )
            expect(failed.error).toBe('previous failure')

            const requested = studentReducer(
                failed,
                createSessionRequested({
                    studentId: 1,
                    studentName: 'Test Student',
                    year: '10',
                    subject: 'Mathematics',
                    date: '2026-08-01',
                    time: '10:00',
                    notes: 'Revision',
                })
            )
            expect(requested.error).toBeNull()
        })

        it('appends the created session on success', () => {
            const state = studentReducer(
                initial(),
                createSessionSucceeded(buildSession({ notes: 'New class' }))
            )
            expect(state.scheduledSessions).toHaveLength(1)
            expect(state.scheduledSessions[0].notes).toBe('New class')
        })

        it('records an error when creating a session fails', () => {
            const state = studentReducer(
                initial(),
                createSessionFailed('create failed')
            )
            expect(state.error).toBe('create failed')
        })
    })

    describe('local mutations', () => {
        it('adds a student, generating a code when none is supplied', () => {
            const generated = studentReducer(
                initial(),
                addStudent(buildStudent({ studentId: '' }))
            )
            expect(generated.students.at(-1)?.studentId).toMatch(/^STU-/)
            expect(generated.hasLocalStudentChanges).toBe(true)

            const explicit = studentReducer(
                generated,
                addStudent(buildStudent({ studentId: 'STU-EXPLICIT' }))
            )
            expect(explicit.students.at(-1)?.studentId).toBe('STU-EXPLICIT')
        })

        it('updates progress for a known student and ignores unknown ids', () => {
            const loaded = studentReducer(
                initial(),
                fetchStudentsSucceeded([buildStudent({ id: 1, progress: 50 })])
            )

            const updated = studentReducer(
                loaded,
                updateProgress({ id: 1, progress: 77 })
            )
            expect(updated.students[0].progress).toBe(77)

            const ignored = studentReducer(
                updated,
                updateProgress({ id: -1, progress: 5 })
            )
            expect(ignored.students[0].progress).toBe(77)
        })

        it('updates student details for a known student and ignores unknown ids', () => {
            const loaded = studentReducer(
                initial(),
                fetchStudentsSucceeded([buildStudent({ id: 1 })])
            )

            const updated = studentReducer(
                loaded,
                updateStudentDetails({ id: 1, field: 'notes', value: 'Fresh' })
            )
            expect(updated.students[0].notes).toBe('Fresh')

            const ignored = studentReducer(
                updated,
                updateStudentDetails({ id: -1, field: 'notes', value: 'Nope' })
            )
            expect(ignored.students[0].notes).toBe('Fresh')
        })

        it('updates a payment record and recomputes that month’s totals', () => {
            const loaded = studentReducer(
                initial(),
                fetchPaymentsSucceeded([
                    buildGroup([
                        buildPayment({
                            studentId: 1,
                            month: '2026-01',
                            monthlyFee: 120,
                            amountPaid: 0,
                        }),
                        buildPayment({
                            id: 2,
                            studentId: 2,
                            month: '2026-01',
                            monthlyFee: 100,
                            amountPaid: 50,
                        }),
                    ]),
                ])
            )
            expect(loaded.paymentsByMonth[0].totalReceived).toBe(50)

            const updated = studentReducer(
                loaded,
                updatePaymentRecord({
                    studentId: 1,
                    month: '2026-01',
                    status: 'Paid',
                    amountPaid: 120,
                    notes: 'Settled',
                })
            )
            const group = updated.paymentsByMonth[0]
            expect(group.records[0].status).toBe('Paid')
            expect(group.records[0].notes).toBe('Settled')
            // Totals recomputed from the edited records.
            expect(group.totalExpected).toBe(220)
            expect(group.totalReceived).toBe(170)
            expect(group.totalOutstanding).toBe(50)
        })

        it('ignores payment updates for an unknown month or student', () => {
            const loaded = studentReducer(
                initial(),
                fetchPaymentsSucceeded([
                    buildGroup([buildPayment({ studentId: 1 })]),
                ])
            )

            // Unknown month -> no group found.
            const unknownMonth = studentReducer(
                loaded,
                updatePaymentRecord({
                    studentId: 1,
                    month: '2099-01',
                    status: 'Paid',
                    amountPaid: 999,
                    notes: 'Nope',
                })
            )
            expect(unknownMonth.paymentsByMonth[0].records[0].amountPaid).toBe(0)

            // Known month, unknown student -> no record found.
            const unknownStudent = studentReducer(
                loaded,
                updatePaymentRecord({
                    studentId: -999,
                    month: '2026-01',
                    status: 'Paid',
                    amountPaid: 999,
                    notes: 'Nope',
                })
            )
            expect(unknownStudent.paymentsByMonth[0].records).toHaveLength(1)
            expect(
                unknownStudent.paymentsByMonth[0].records[0].amountPaid
            ).toBe(0)
        })
    })
})
