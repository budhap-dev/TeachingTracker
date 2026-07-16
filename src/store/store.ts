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
            prepare: (input: ScheduledSessionInput) => ({ payload: input }),
        },
        createSessionSucceeded: (
            state,
            action: PayloadAction<ScheduledSession>
        ) => {
            state.scheduledSessions.push(action.payload)
            state.savingSession = false
            state.notice = { kind: 'success', message: 'Class booked.' }
        },
        createSessionFailed: (state, action: PayloadAction<string>) => {
            state.savingSession = false
            fail(state, action.payload)
        },
        // --- Cancelling / un-cancelling a class ---
        setSessionStatusRequested: {
            reducer: (state: StudentState) => {
                state.savingSession = true
                state.error = null
            },
            prepare: (input: { id: number; status: SessionStatus }) => ({
                payload: input,
            }),
        },
        setSessionStatusSucceeded: (
            state,
            action: PayloadAction<ScheduledSession>
        ) => {
            const index = state.scheduledSessions.findIndex(
                (item) => item.id === action.payload.id
            )
            if (index >= 0) {
                // Replaced, never removed: a cancelled class stays visible.
                state.scheduledSessions[index] = action.payload
            }
            state.savingSession = false
            state.notice = {
                kind: 'success',
                message:
                    action.payload.status === 'Cancelled'
                        ? 'Class cancelled.'
                        : 'Class restored.',
            }
        },
        setSessionStatusFailed: (state, action: PayloadAction<string>) => {
            state.savingSession = false
            fail(state, action.payload)
        },
        // --- Editing a class's details ---
        editSessionRequested: {
            reducer: (state: StudentState) => {
                state.savingSession = true
                state.error = null
            },
            prepare: (input: { id: number; changes: ScheduledSessionInput }) => ({
                payload: input,
            }),
        },
        editSessionSucceeded: (
            state,
            action: PayloadAction<ScheduledSession>
        ) => {
            const index = state.scheduledSessions.findIndex(
                (item) => item.id === action.payload.id
            )
            if (index >= 0) {
                state.scheduledSessions[index] = action.payload
            }
            state.savingSession = false
            state.notice = { kind: 'success', message: 'Class updated.' }
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
    setSessionStatusRequested,
    setSessionStatusSucceeded,
    setSessionStatusFailed,
    editSessionRequested,
    editSessionSucceeded,
    editSessionFailed,
    saveStudentRequested,
    saveStudentSucceeded,
    saveStudentFailed,
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
