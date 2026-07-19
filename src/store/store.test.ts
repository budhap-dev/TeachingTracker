import { describe, expect, it } from 'vitest'
import type { PaymentRecord, ScheduledSession, Student } from '../data/students'
import {
    setSessionStatusRequested,
    setSessionStatusSucceeded,
    setSessionStatusFailed,
    editSessionRequested,
    editSessionSucceeded,
    editSessionFailed,
    saveStudentRequested,
    saveStudentSucceeded,
    saveStudentFailed,
    archiveStudentRequested,
    restoreStudentRequested,
    archiveStudentSucceeded,
    restoreStudentSucceeded,
    archiveStudentFailed,
    dismissError,
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
    initialLoadSkipped,
    studentReducer,
    savePaymentRequested,
    savePaymentSucceeded,
    savePaymentFailed,
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
    isArchived: overrides.isArchived,
    archivedOn: overrides.archivedOn,
    archiveNotes: overrides.archiveNotes,
})

/** Mirrors the API: a bill is classes taught x the per-session fee. */
const buildPayment = (overrides: Partial<PaymentRecord> = {}): PaymentRecord => {
    const feePerSession = overrides.feePerSession ?? 120
    const sessionsHeld = overrides.sessionsHeld ?? 1
    const amountDue = overrides.amountDue ?? feePerSession * sessionsHeld
    const amountPaid = overrides.amountPaid ?? 0
    return {
        id: overrides.id ?? 1,
        studentId: overrides.studentId ?? 1,
        studentName: overrides.studentName ?? 'Test Student',
        month: overrides.month ?? '2026-01',
        feePerSession,
        sessionsHeld,
        amountDue,
        amountPaid,
        outstanding: Math.max(amountDue - amountPaid, 0),
        status: overrides.status ?? 'Pending',
        notes: overrides.notes ?? '',
    }
}

/** A month group mirroring the API's /payments/by-month shape. */
const buildGroup = (records: PaymentRecord[], month = '2026-01') => {
    const totalDue = records.reduce((s, r) => s + r.amountDue, 0)
    const totalReceived = records.reduce((s, r) => s + r.amountPaid, 0)
    return {
        month,
        totalDue,
        totalReceived,
        totalOutstanding: Math.max(totalDue - totalReceived, 0),
        sessionsHeld: records.reduce((s, r) => s + r.sessionsHeld, 0),
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

    it('settles the boot loaders when the initial load is skipped', () => {
        // Signed out under auth nothing fetches — the flags must not spin.
        const settled = studentReducer(initial(), initialLoadSkipped())
        expect(settled.loading).toBe(false)
        expect(settled.paymentsLoading).toBe(false)
        expect(settled.sessionsLoading).toBe(false)
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
            // A saved student flips hasLocalStudentChanges, switching to merge mode.
            const withLocal = studentReducer(
                initial(),
                saveStudentSucceeded(buildStudent({ id: 99, firstName: 'Local' }))
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
                    studentIds: [1],
                    subject: 'Mathematics',
                    date: '2026-08-01',
                    time: '10:00',
                    durationMinutes: 60,
                    notes: 'Revision',
                })
            )
            expect(requested.error).toBeNull()
        })

        it('appends the created session on success', () => {
            const state = studentReducer(
                initial(),
                createSessionSucceeded([buildSession({ notes: 'New class' })])
            )
            expect(state.scheduledSessions).toHaveLength(1)
            expect(state.scheduledSessions[0].notes).toBe('New class')
        })

        it('books a group and says so in the toast', () => {
            const state = studentReducer(
                initial(),
                createSessionSucceeded([
                    buildSession({ id: 1 }),
                    buildSession({ id: 2 }),
                ])
            )
            expect(state.scheduledSessions).toHaveLength(2)
            expect(state.notice?.message).toBe(
                'Group class booked for 2 students.'
            )
        })

        it('records an error when creating a session fails', () => {
            const state = studentReducer(
                initial(),
                createSessionFailed('create failed')
            )
            expect(state.error).toBe('create failed')
        })
    })

    describe('saving a student', () => {
        it('marks a save in flight and clears any previous error', () => {
            const errored = studentReducer(
                initial(),
                saveStudentFailed('boom')
            )
            expect(errored.error).toBe('boom')

            const saving = studentReducer(
                errored,
                saveStudentRequested(buildStudent({ id: 1 }))
            )
            expect(saving.savingStudent).toBe(true)
            expect(saving.error).toBeNull()
        })

        it('updates an existing student in place from the server response', () => {
            const loaded = studentReducer(
                initial(),
                fetchStudentsSucceeded([
                    buildStudent({ id: 1, firstName: 'Asha', notes: 'Old' }),
                ])
            )

            const saved = studentReducer(
                loaded,
                saveStudentSucceeded(
                    buildStudent({ id: 1, firstName: 'Asha', notes: 'New' })
                )
            )

            expect(saved.students).toHaveLength(1)
            expect(saved.students[0].notes).toBe('New')
            expect(saved.savingStudent).toBe(false)
            expect(saved.hasLocalStudentChanges).toBe(true)
        })

        it('appends a student the store has not seen before', () => {
            const loaded = studentReducer(
                initial(),
                fetchStudentsSucceeded([buildStudent({ id: 1 })])
            )

            const saved = studentReducer(
                loaded,
                saveStudentSucceeded(buildStudent({ id: 77, firstName: 'New' }))
            )

            expect(saved.students).toHaveLength(2)
            expect(saved.students.at(-1)?.firstName).toBe('New')
        })

        it('surfaces a failure and stops the in-flight state', () => {
            const saving = studentReducer(
                initial(),
                saveStudentRequested(buildStudent({ id: 1 }))
            )

            const failed = studentReducer(
                saving,
                saveStudentFailed('Could not save student: 500')
            )
            expect(failed.savingStudent).toBe(false)
            expect(failed.error).toBe('Could not save student: 500')

            // The teacher acknowledges it; the message goes away.
            expect(studentReducer(failed, dismissError()).error).toBeNull()
        })
    })

    describe('archive and restore (REQ-013)', () => {
        const loaded = () =>
            studentReducer(
                initial(),
                fetchStudentsSucceeded([buildStudent({ id: 1 })])
            )

        it('replaces the student with the archived copy and toasts', () => {
            const requested = studentReducer(
                loaded(),
                archiveStudentRequested({ id: 1, notes: 'Done' })
            )
            expect(requested.savingStudent).toBe(true)

            const archived = studentReducer(
                requested,
                archiveStudentSucceeded(
                    buildStudent({ id: 1, isArchived: true })
                )
            )
            expect(archived.savingStudent).toBe(false)
            expect(archived.students[0].isArchived).toBe(true)
            expect(archived.notice?.kind).toBe('success')
        })

        it('restores the student and clears the archived flag', () => {
            const start = studentReducer(
                loaded(),
                archiveStudentSucceeded(
                    buildStudent({ id: 1, isArchived: true })
                )
            )
            const requested = studentReducer(
                start,
                restoreStudentRequested(1)
            )
            expect(requested.savingStudent).toBe(true)

            const restored = studentReducer(
                requested,
                restoreStudentSucceeded(
                    buildStudent({ id: 1, isArchived: false })
                )
            )
            expect(restored.students[0].isArchived).toBe(false)
            expect(restored.notice?.message).toMatch(/restored/i)
        })

        it('surfaces the API message (e.g. the 409) on failure', () => {
            const failed = studentReducer(
                studentReducer(
                    loaded(),
                    archiveStudentRequested({ id: 1, notes: 'x' })
                ),
                archiveStudentFailed('This student still has a class scheduled.')
            )
            expect(failed.savingStudent).toBe(false)
            expect(failed.error).toMatch(/still has a class/i)
        })

        it('appends when the archived student is not already in the store', () => {
            const appended = studentReducer(
                loaded(),
                archiveStudentSucceeded(
                    buildStudent({ id: 999, isArchived: true })
                )
            )
            expect(appended.students).toHaveLength(2)
            expect(appended.students.at(-1)?.id).toBe(999)
        })
    })

    describe('cancelling a class', () => {
        it('replaces the class in place, never removing it', () => {
            const loaded = studentReducer(
                initial(),
                fetchSessionsSucceeded([
                    { id: 101, status: 'Scheduled' } as never,
                    { id: 102, status: 'Scheduled' } as never,
                ])
            )

            const cancelled = studentReducer(
                loaded,
                setSessionStatusSucceeded([
                    { id: 101, status: 'Cancelled' },
                ] as never)
            )

            // Still two classes: a cancelled one stays visible.
            expect(cancelled.scheduledSessions).toHaveLength(2)
            expect(cancelled.scheduledSessions[0].status).toBe('Cancelled')
            expect(cancelled.scheduledSessions[1].status).toBe('Scheduled')
        })

        it('ignores a class the store does not know', () => {
            const loaded = studentReducer(
                initial(),
                fetchSessionsSucceeded([{ id: 101, status: 'Scheduled' } as never])
            )
            const untouched = studentReducer(
                loaded,
                setSessionStatusSucceeded([
                    { id: 999, status: 'Cancelled' },
                ] as never)
            )
            expect(untouched.scheduledSessions).toHaveLength(1)
            expect(untouched.scheduledSessions[0].status).toBe('Scheduled')
        })

        it('speaks for the whole group when every row changes', () => {
            const loaded = studentReducer(
                initial(),
                fetchSessionsSucceeded([
                    { id: 101, status: 'Scheduled', groupId: 'g' },
                    { id: 102, status: 'Scheduled', groupId: 'g' },
                ] as never)
            )
            const cancelled = studentReducer(
                loaded,
                setSessionStatusSucceeded([
                    { id: 101, status: 'Cancelled', groupId: 'g' },
                    { id: 102, status: 'Cancelled', groupId: 'g' },
                ] as never)
            )
            expect(cancelled.notice?.message).toBe(
                'Class cancelled for everyone.'
            )
            const restored = studentReducer(
                cancelled,
                setSessionStatusSucceeded([
                    { id: 101, status: 'Scheduled', groupId: 'g' },
                    { id: 102, status: 'Scheduled', groupId: 'g' },
                ] as never)
            )
            expect(restored.notice?.message).toBe(
                'Class restored for everyone.'
            )
        })

        it('clears the error on request and surfaces it on failure', () => {
            const requested = studentReducer(
                studentReducer(initial(), setSessionStatusFailed('old')),
                setSessionStatusRequested({ id: 101, status: 'Cancelled' })
            )
            expect(requested.error).toBeNull()

            const failed = studentReducer(
                requested,
                setSessionStatusFailed('Could not update the class: 503')
            )
            expect(failed.error).toBe('Could not update the class: 503')
        })
    })

    describe('editing a class', () => {
        const loaded = () =>
            studentReducer(
                initial(),
                fetchSessionsSucceeded([
                    { id: 101, subject: 'Maths', time: '09:00' } as never,
                    { id: 102, subject: 'Physics', time: '10:00' } as never,
                ])
            )

        it('replaces the edited class with the server copy', () => {
            const edited = studentReducer(
                loaded(),
                editSessionSucceeded([
                    { id: 101, subject: 'Astrophysics', time: '18:00' },
                ] as never)
            )
            expect(edited.scheduledSessions).toHaveLength(2)
            expect(edited.scheduledSessions[0]).toMatchObject({
                subject: 'Astrophysics',
                time: '18:00',
            })
            // The untouched class is left alone.
            expect(edited.scheduledSessions[1].subject).toBe('Physics')
        })

        it('announces a group edit as one', () => {
            const edited = studentReducer(
                loaded(),
                editSessionSucceeded([
                    { id: 101, subject: 'Maths', time: '11:00' },
                    { id: 102, subject: 'Physics', time: '11:00' },
                ] as never)
            )
            expect(edited.notice?.message).toBe('Group class updated.')
            expect(
                edited.scheduledSessions.map((s) => s.time)
            ).toEqual(['11:00', '11:00'])
        })

        it('ignores a class the store does not know', () => {
            const untouched = studentReducer(
                loaded(),
                editSessionSucceeded([{ id: 999, subject: 'X' }] as never)
            )
            expect(untouched.scheduledSessions.map((s) => s.subject)).toEqual([
                'Maths',
                'Physics',
            ])
        })

        it('clears the error on request and surfaces it on failure', () => {
            const requested = studentReducer(
                studentReducer(initial(), editSessionFailed('old')),
                editSessionRequested({
                    id: 101,
                    changes: { subject: 'Physics' } as never,
                })
            )
            expect(requested.error).toBeNull()

            const failed = studentReducer(
                requested,
                editSessionFailed('Could not update the class: 500')
            )
            expect(failed.error).toBe('Could not update the class: 500')
        })
    })

    describe('local mutations', () => {
        it('takes the API record and recomputes that month’s totals', () => {
            const loaded = studentReducer(
                initial(),
                fetchPaymentsSucceeded([
                    buildGroup([
                        buildPayment({
                            studentId: 1,
                            month: '2026-01',
                            feePerSession: 120,
                            amountPaid: 0,
                        }),
                        buildPayment({
                            id: 2,
                            studentId: 2,
                            month: '2026-01',
                            feePerSession: 100,
                            amountPaid: 50,
                        }),
                    ]),
                ])
            )
            expect(loaded.paymentsByMonth[0].totalReceived).toBe(50)

            const updated = studentReducer(
                loaded,
                savePaymentSucceeded([
                    buildPayment({
                        studentId: 1,
                        month: '2026-01',
                        feePerSession: 120,
                        amountPaid: 120,
                        status: 'Paid',
                        notes: 'Settled',
                    }),
                ])
            )
            const group = updated.paymentsByMonth[0]
            expect(group.records[0].status).toBe('Paid')
            expect(group.records[0].notes).toBe('Settled')
            // Totals recomputed from the edited records.
            expect(group.totalDue).toBe(220)
            expect(group.totalReceived).toBe(170)
            expect(group.totalOutstanding).toBe(50)
        })

        it('ignores an API record for a month or student it does not hold', () => {
            const loaded = studentReducer(
                initial(),
                fetchPaymentsSucceeded([
                    buildGroup([buildPayment({ studentId: 1 })]),
                ])
            )

            // Unknown month -> no group found.
            const unknownMonth = studentReducer(
                loaded,
                savePaymentSucceeded([
                    buildPayment({ studentId: 1, month: '2099-01', amountPaid: 999 }),
                ])
            )
            expect(unknownMonth.paymentsByMonth[0].records[0].amountPaid).toBe(0)

            // Known month, unknown student -> no record found.
            const unknownStudent = studentReducer(
                loaded,
                savePaymentSucceeded([
                    buildPayment({ studentId: -999, month: '2026-01', amountPaid: 999 }),
                ])
            )
            expect(unknownStudent.paymentsByMonth[0].records).toHaveLength(1)
            expect(
                unknownStudent.paymentsByMonth[0].records[0].amountPaid
            ).toBe(0)
        })

        it('surfaces a failed payment save and clears it on the next try', () => {
            const failed = studentReducer(
                initial(),
                savePaymentFailed('Could not record the payment: 500')
            )
            expect(failed.error).toBe('Could not record the payment: 500')

            const cleared = studentReducer(
                failed,
                savePaymentRequested({ studentId: 1, month: '2026-01' })
            )
            expect(cleared.error).toBeNull()
        })
    })
})
