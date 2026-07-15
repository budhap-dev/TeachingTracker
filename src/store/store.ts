import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import {
    generateStudentCode,
    MonthlyPaymentGroup,
    PaymentRecordInput,
    ScheduledSession,
    Student,
    StudentDetailField,
} from '../data/students'
import { rootSaga } from './sagas'

export type ScheduledSessionInput = Omit<ScheduledSession, 'id'>

type StudentState = {
    students: Student[]
    loading: boolean
    paymentsLoading: boolean
    sessionsLoading: boolean
    error: string | null
    scheduledSessions: ScheduledSession[]
    paymentsByMonth: MonthlyPaymentGroup[]
    hasLocalStudentChanges: boolean
}

/** Recomputes a month's totals after one of its records changes. */
const recalculateTotals = (group: MonthlyPaymentGroup) => {
    group.totalExpected = group.records.reduce(
        (sum, record) => sum + record.monthlyFee,
        0
    )
    group.totalReceived = group.records.reduce(
        (sum, record) => sum + record.amountPaid,
        0
    )
    group.totalOutstanding = group.totalExpected - group.totalReceived
}

// Students, payments and scheduled sessions all come from the API, so they
// start empty (loading) until their sagas fetch them.
const createInitialState = (): StudentState => ({
    students: [],
    loading: true,
    paymentsLoading: true,
    sessionsLoading: true,
    error: null,
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
            state.error = action.payload
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
            state.error = action.payload
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
            state.error = action.payload
        },
        // `prepare` gives the action a typed payload for the saga to read,
        // without the reducer needing an unused action parameter.
        createSessionRequested: {
            reducer: (state: StudentState) => {
                state.error = null
            },
            prepare: (input: ScheduledSessionInput) => ({ payload: input }),
        },
        createSessionSucceeded: (
            state,
            action: PayloadAction<ScheduledSession>
        ) => {
            state.scheduledSessions.push(action.payload)
        },
        createSessionFailed: (state, action: PayloadAction<string>) => {
            state.error = action.payload
        },
        // --- Local mutations ---
        addStudent: (state, action: PayloadAction<Omit<Student, 'id'>>) => {
            state.hasLocalStudentChanges = true
            state.students.push({
                id: Date.now(),
                ...action.payload,
                studentId: action.payload.studentId || generateStudentCode(),
            })
        },
        updateProgress: (
            state,
            action: PayloadAction<{ id: number; progress: number }>
        ) => {
            state.hasLocalStudentChanges = true
            const student = state.students.find(
                (item) => item.id === action.payload.id
            )
            if (student) {
                student.progress = action.payload.progress
            }
        },
        updateStudentDetails: (
            state,
            action: PayloadAction<{
                id: number
                field: StudentDetailField
                value: string
            }>
        ) => {
            state.hasLocalStudentChanges = true
            const student = state.students.find(
                (item) => item.id === action.payload.id
            )
            if (student) {
                student[action.payload.field] = action.payload.value as never
            }
        },
        updatePaymentRecord: (
            state,
            action: PayloadAction<PaymentRecordInput>
        ) => {
            const group = state.paymentsByMonth.find(
                (item) => item.month === action.payload.month
            )
            const record = group?.records.find(
                (item) => item.studentId === action.payload.studentId
            )
            if (!group || !record) {
                return
            }
            record.status = action.payload.status
            record.amountPaid = action.payload.amountPaid
            record.notes = action.payload.notes
            recalculateTotals(group)
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
    addStudent,
    updateProgress,
    updateStudentDetails,
    updatePaymentRecord,
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
