import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import {
    MonthlyPaymentGroup,
    PaymentRecord,
    PaymentRecordInput,
    ScheduledSession,
    SessionStatus,
    Student,
} from '../data/students'
import type { StudentInput } from '../api/students'
import { rootSaga } from './sagas'

export type ScheduledSessionInput = Omit<ScheduledSession, 'id' | 'status'>

/** Booking payload: several ids make it a group class. */
export type ScheduleClassInput = {
    studentIds: number[]
    subject: string
    date: string
    time: string
    durationMinutes: number
    notes: string
}

/** Shared-field edits (student fields only on a solo class). */
export type EditClassChanges = Partial<
    Omit<ScheduledSession, 'id' | 'status' | 'groupId'>
>

/** Replaces rows the API returned, by id — one for solo, several for group. */
const upsertSessions = (
    list: ScheduledSession[],
    updated: ScheduledSession[]
) => {
    updated.forEach((row) => {
        const index = list.findIndex((item) => item.id === row.id)
        if (index >= 0) {
            list[index] = row
        }
    })
}

/** A transient toast: what just happened, and in what mood. */
export type Notice = { kind: 'success' | 'error'; message: string }

type StudentState = {
    students: Student[]
    loading: boolean
    paymentsLoading: boolean
    sessionsLoading: boolean
    savingStudent: boolean
    savingSession: boolean
    savingPayment: boolean
    error: string | null
    notice: Notice | null
    scheduledSessions: ScheduledSession[]
    paymentsByMonth: MonthlyPaymentGroup[]
    hasLocalStudentChanges: boolean
}

/**
 * Recomputes a month's totals after the API returns an updated record.
 * What is *due* never changes here — only the API derives that, from the
 * classes taught — so only the received/outstanding side is recalculated.
 */
const recalculateTotals = (group: MonthlyPaymentGroup) => {
    group.totalDue = group.records.reduce(
        (sum, record) => sum + record.amountDue,
        0
    )
    group.totalReceived = group.records.reduce(
        (sum, record) => sum + record.amountPaid,
        0
    )
    group.totalOutstanding = Math.max(
        group.totalDue - group.totalReceived,
        0
    )
}

// Students, payments and scheduled sessions all come from the API, so they
// start empty (loading) until their sagas fetch them.
/** Failures set both the sticky error and the transient toast. */
const fail = (state: StudentState, message: string) => {
    state.error = message
    state.notice = { kind: 'error', message }
}

/** Replaces a student in place by id (append if new) — the server's copy wins. */
const replaceStudent = (state: StudentState, student: Student) => {
    const index = state.students.findIndex((item) => item.id === student.id)
    if (index >= 0) {
        state.students[index] = student
    } else {
        state.students.push(student)
    }
}

const createInitialState = (): StudentState => ({
    students: [],
    loading: true,
    paymentsLoading: true,
    sessionsLoading: true,
    savingStudent: false,
    savingSession: false,
    savingPayment: false,
    error: null,
    notice: null,
    scheduledSessions: [],
    paymentsByMonth: [],
    hasLocalStudentChanges: false,
})

const initialState = createInitialState()

const studentSlice = createSlice({
    name: 'students',
    initialState,
    reducers: {
        resetStudentState: () => createInitialState(),
        /**
         * Signed-out under auth nothing is fetched, so the boot-time loading
         * flags (kept true for the refresh skeletons) must settle by hand —
         * otherwise the busy bar runs forever behind the visitor landing.
         */
        initialLoadSkipped: (state) => {
            state.loading = false
            state.paymentsLoading = false
            state.sessionsLoading = false
        },
        // --- Students ---
        fetchStudentsRequested: (state) => {
            state.loading = true
            state.error = null
        },
        fetchStudentsSucceeded: (state, action: PayloadAction<Student[]>) => {
            if (!state.hasLocalStudentChanges) {
                state.students = action.payload
            } else {
                const mergedStudents = [...state.students]
                action.payload.forEach((student) => {
                    const existingIndex = mergedStudents.findIndex(
                        (item) => item.id === student.id
                    )
                    if (existingIndex >= 0) {
                        mergedStudents[existingIndex] = student
                    } else {
                        mergedStudents.push(student)
                    }
                })
                state.students = mergedStudents
            }
            state.loading = false
        },
        fetchStudentsFailed: (state, action: PayloadAction<string>) => {
            state.loading = false
            fail(state, action.payload)
        },
        // --- Payments (grouped by month, totals computed by the API) ---
        fetchPaymentsRequested: (state) => {
            state.paymentsLoading = true
        },
        fetchPaymentsSucceeded: (
            state,
            action: PayloadAction<MonthlyPaymentGroup[]>
        ) => {
            state.paymentsByMonth = action.payload
            state.paymentsLoading = false
        },
        fetchPaymentsFailed: (state, action: PayloadAction<string>) => {
            state.paymentsLoading = false
            fail(state, action.payload)
        },
        // --- Scheduled sessions ---
        fetchSessionsRequested: (state) => {
            state.sessionsLoading = true
        },
        fetchSessionsSucceeded: (
            state,
            action: PayloadAction<ScheduledSession[]>
        ) => {
            state.scheduledSessions = action.payload
            state.sessionsLoading = false
        },
        fetchSessionsFailed: (state, action: PayloadAction<string>) => {
            state.sessionsLoading = false
            fail(state, action.payload)
        },
        // `prepare` gives the action a typed payload for the saga to read,
        // without the reducer needing an unused action parameter.
        createSessionRequested: {
            reducer: (state: StudentState) => {
                state.savingSession = true
                state.error = null
            },
            prepare: (input: ScheduleClassInput) => ({ payload: input }),
        },
        createSessionSucceeded: (
            state,
            action: PayloadAction<ScheduledSession[]>
        ) => {
            state.scheduledSessions.push(...action.payload)
            state.savingSession = false
            state.notice = {
                kind: 'success',
                message:
                    action.payload.length > 1
                        ? `Group class booked for ${action.payload.length} students.`
                        : 'Class booked.',
            }
        },
        createSessionFailed: (state, action: PayloadAction<string>) => {
            state.savingSession = false
            fail(state, action.payload)
        },
        // --- Adding a student to a class (solo → group) ---
        addSessionMemberRequested: {
            reducer: (state: StudentState) => {
                state.savingSession = true
                state.error = null
            },
            prepare: (input: { sessionId: number; studentId: number }) => ({
                payload: input,
            }),
        },
        addSessionMemberSucceeded: (
            state,
            action: PayloadAction<ScheduledSession[]>
        ) => {
            // The group's rows come back: the promoted original row (now with a
            // groupId) is replaced in place, the new member's row is appended.
            action.payload.forEach((row) => {
                const index = state.scheduledSessions.findIndex(
                    (item) => item.id === row.id
                )
                if (index >= 0) {
                    state.scheduledSessions[index] = row
                } else {
                    state.scheduledSessions.push(row)
                }
            })
            state.savingSession = false
            state.notice = {
                kind: 'success',
                message: 'Student added to the class.',
            }
        },
        addSessionMemberFailed: (state, action: PayloadAction<string>) => {
            state.savingSession = false
            fail(state, action.payload)
        },
        // --- Cancelling / un-cancelling a class ---
        setSessionStatusRequested: {
            reducer: (state: StudentState) => {
                state.savingSession = true
                state.error = null
            },
            prepare: (input: {
                id: number
                status: SessionStatus
                applyToGroup?: boolean
            }) => ({ payload: input }),
        },
        setSessionStatusSucceeded: (
            state,
            action: PayloadAction<ScheduledSession[]>
        ) => {
            // Replaced, never removed: a cancelled class stays visible.
            upsertSessions(state.scheduledSessions, action.payload)
            state.savingSession = false
            const cancelled = action.payload[0]?.status === 'Cancelled'
            const group = action.payload.length > 1
            state.notice = {
                kind: 'success',
                message: cancelled
                    ? group
                        ? 'Class cancelled for everyone.'
                        : 'Class cancelled.'
                    : group
                      ? 'Class restored for everyone.'
                      : 'Class restored.',
            }
        },
        setSessionStatusFailed: (state, action: PayloadAction<string>) => {
            state.savingSession = false
            fail(state, action.payload)
        },
        // --- Deleting a class outright (distinct from cancelling) ---
        deleteSessionRequested: {
            reducer: (state: StudentState) => {
                state.savingSession = true
                state.error = null
            },
            prepare: (id: number) => ({ payload: id }),
        },
        deleteSessionSucceeded: (
            state,
            action: PayloadAction<number[]>
        ) => {
            // A real delete: the rows leave the store entirely, unlike a cancel.
            const removed = new Set(action.payload)
            state.scheduledSessions = state.scheduledSessions.filter(
                (session) => !removed.has(session.id)
            )
            state.savingSession = false
            state.notice = {
                kind: 'success',
                message:
                    action.payload.length > 1
                        ? 'Class deleted for everyone.'
                        : 'Class deleted.',
            }
        },
        deleteSessionFailed: (state, action: PayloadAction<string>) => {
            state.savingSession = false
            fail(state, action.payload)
        },
        // --- Editing a class's details ---
        editSessionRequested: {
            reducer: (state: StudentState) => {
                state.savingSession = true
                state.error = null
            },
            prepare: (input: {
                id: number
                changes: EditClassChanges
                applyToGroup?: boolean
            }) => ({ payload: input }),
        },
        editSessionSucceeded: (
            state,
            action: PayloadAction<ScheduledSession[]>
        ) => {
            upsertSessions(state.scheduledSessions, action.payload)
            state.savingSession = false
            state.notice = {
                kind: 'success',
                message:
                    action.payload.length > 1
                        ? 'Group class updated.'
                        : 'Class updated.',
            }
        },
        editSessionFailed: (state, action: PayloadAction<string>) => {
            state.savingSession = false
            fail(state, action.payload)
        },
        // --- Saving a student (create or update) via the API ---
        saveStudentRequested: {
            reducer: (state: StudentState) => {
                state.savingStudent = true
                state.error = null
            },
            prepare: (input: StudentInput) => ({ payload: input }),
        },
        /**
         * Takes the server's copy as the truth, so the UI shows what was really
         * stored (including any id or code the API generated) rather than what
         * we hoped it would store.
         */
        saveStudentSucceeded: (state, action: PayloadAction<Student>) => {
            state.savingStudent = false
            state.hasLocalStudentChanges = true
            const index = state.students.findIndex(
                (item) => item.id === action.payload.id
            )
            if (index >= 0) {
                state.students[index] = action.payload
            } else {
                state.students.push(action.payload)
            }
            state.notice = { kind: 'success', message: 'Student saved.' }
        },
        saveStudentFailed: (state, action: PayloadAction<string>) => {
            state.savingStudent = false
            fail(state, action.payload)
        },
        // --- Archive / restore (REQ-013) ---
        archiveStudentRequested: {
            reducer: (state: StudentState) => {
                state.savingStudent = true
                state.error = null
            },
            prepare: (input: { id: number; notes: string }) => ({
                payload: input,
            }),
        },
        restoreStudentRequested: {
            reducer: (state: StudentState) => {
                state.savingStudent = true
                state.error = null
            },
            prepare: (id: number) => ({ payload: id }),
        },
        archiveStudentSucceeded: (state, action: PayloadAction<Student>) => {
            state.savingStudent = false
            state.hasLocalStudentChanges = true
            replaceStudent(state, action.payload)
            state.notice = {
                kind: 'success',
                message: 'Student archived — moved to Alumni.',
            }
        },
        restoreStudentSucceeded: (state, action: PayloadAction<Student>) => {
            state.savingStudent = false
            state.hasLocalStudentChanges = true
            replaceStudent(state, action.payload)
            state.notice = {
                kind: 'success',
                message: 'Student restored to the active roster.',
            }
        },
        archiveStudentFailed: (state, action: PayloadAction<string>) => {
            state.savingStudent = false
            fail(state, action.payload)
        },
        /** Clears a save error once the teacher has seen it. */
        dismissError: (state) => {
            state.error = null
        },
        /** Clears the toast once it has been seen (or timed out). */
        dismissNotice: (state) => {
            state.notice = null
        },
        // --- Recording a payment via the API ---
        savePaymentRequested: {
            reducer: (state: StudentState) => {
                state.savingPayment = true
                state.error = null
            },
            prepare: (input: PaymentRecordInput) => ({ payload: input }),
        },
        /** Takes the API's recomputed record — including what it says is due. */
        savePaymentSucceeded: (
            state,
            action: PayloadAction<PaymentRecord[]>
        ) => {
            action.payload.forEach((saved) => {
                const group = state.paymentsByMonth.find(
                    (item) => item.month === saved.month
                )
                const index = group?.records.findIndex(
                    (item) => item.studentId === saved.studentId
                )
                if (!group || index === undefined || index < 0) {
                    return
                }
                group.records[index] = saved
                recalculateTotals(group)
            })
            state.savingPayment = false
            state.notice = { kind: 'success', message: 'Payment saved.' }
        },
        savePaymentFailed: (state, action: PayloadAction<string>) => {
            state.savingPayment = false
            fail(state, action.payload)
        },
    },
})

export const {
    resetStudentState,
    initialLoadSkipped,
    fetchStudentsRequested,
    fetchStudentsSucceeded,
    fetchStudentsFailed,
    fetchPaymentsRequested,
    fetchPaymentsSucceeded,
    fetchPaymentsFailed,
    fetchSessionsRequested,
    fetchSessionsSucceeded,
    fetchSessionsFailed,
    createSessionRequested,
    createSessionSucceeded,
    createSessionFailed,
    addSessionMemberRequested,
    addSessionMemberSucceeded,
    addSessionMemberFailed,
    setSessionStatusRequested,
    setSessionStatusSucceeded,
    setSessionStatusFailed,
    deleteSessionRequested,
    deleteSessionSucceeded,
    deleteSessionFailed,
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
    dismissNotice,
    savePaymentRequested,
    savePaymentSucceeded,
    savePaymentFailed,
} = studentSlice.actions

/** Exported for tests: lets reducers be exercised without the saga middleware. */
export const studentReducer = studentSlice.reducer

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
    reducer: {
        students: studentSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(sagaMiddleware),
})

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
