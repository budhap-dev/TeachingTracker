import { describe, expect, it } from 'vitest'
import type { PaymentRecord, Student } from '../data/students'
import {
    addStudent,
    fetchPaymentsFailed,
    fetchPaymentsRequested,
    fetchPaymentsSucceeded,
    fetchStudentsFailed,
    fetchStudentsRequested,
    fetchStudentsSucceeded,
    resetStudentState,
    scheduleClass,
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

/** Fresh initial state straight from the reducer. */
const initial = () => studentReducer(undefined, { type: '@@INIT' })

describe('student reducer', () => {
    it('starts empty and loading, with seeded scheduled sessions', () => {
        const state = initial()

        expect(state.students).toEqual([])
        expect(state.paymentRecords).toEqual([])
        expect(state.loading).toBe(true)
        expect(state.paymentsLoading).toBe(true)
        expect(state.error).toBeNull()
        expect(state.scheduledSessions.length).toBeGreaterThan(0)
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

        it('stores payments on success', () => {
            const state = studentReducer(
                initial(),
                fetchPaymentsSucceeded([buildPayment()])
            )
            expect(state.paymentRecords).toHaveLength(1)
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

        it('schedules a class', () => {
            const before = initial().scheduledSessions.length
            const state = studentReducer(
                initial(),
                scheduleClass({
                    studentId: 1,
                    studentName: 'Test Student',
                    year: '10',
                    subject: 'Mathematics',
                    date: '2026-08-01',
                    time: '10:00',
                    notes: 'Revision',
                })
            )
            expect(state.scheduledSessions).toHaveLength(before + 1)
            expect(state.scheduledSessions.at(-1)?.notes).toBe('Revision')
        })

        it('updates a matching payment record and ignores unmatched ones', () => {
            const loaded = studentReducer(
                initial(),
                fetchPaymentsSucceeded([
                    buildPayment({ studentId: 1, month: '2026-01' }),
                ])
            )

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
            expect(updated.paymentRecords[0].status).toBe('Paid')
            expect(updated.paymentRecords[0].amountPaid).toBe(120)
            expect(updated.paymentRecords[0].notes).toBe('Settled')

            const ignored = studentReducer(
                updated,
                updatePaymentRecord({
                    studentId: -999,
                    month: '2099-01',
                    status: 'Pending',
                    amountPaid: 0,
                    notes: 'Missing',
                })
            )
            expect(
                ignored.paymentRecords.some((r) => r.studentId === -999)
            ).toBe(false)
        })
    })
})
