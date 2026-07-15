import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import {
    generateStudentCode,
    PaymentRecord,
    PaymentRecordInput,
    ScheduledSession,
    Student,
    StudentDetailField,
} from '../data/students'
import { rootSaga } from './sagas'

type ScheduledSessionInput = Omit<ScheduledSession, 'id'>

type StudentState = {
    students: Student[]
    loading: boolean
    paymentsLoading: boolean
    error: string | null
    scheduledSessions: ScheduledSession[]
    paymentRecords: PaymentRecord[]
    hasLocalStudentChanges: boolean
}

const baseDate = new Date()
const seedSessionDates = [1, 2, 3, 4].map((offset) => {
    const nextDate = new Date(baseDate)
    nextDate.setDate(nextDate.getDate() + offset)
    return nextDate.toISOString().slice(0, 10)
})

// Students and payments now load from the API via sagas, so they start empty
// (loading) until fetched. Scheduled sessions have no API yet, so they keep a
// small frontend seed the user can add to via the scheduling screen.
const createInitialState = (): StudentState => ({
    students: [],
    loading: true,
    paymentsLoading: true,
    error: null,
    scheduledSessions: [
        {
            id: 101,
            studentId: 1,
            studentName: 'Asha Perera',
            year: '10',
            subject: 'Mathematics',
            date: seedSessionDates[0],
            time: '16:00',
            notes: 'Problem solving practice',
        },
        {
            id: 102,
            studentId: 2,
            studentName: 'Nimal Fernando',
            year: '9',
            subject: 'Physics',
            date: seedSessionDates[1],
            time: '17:30',
            notes: 'Lab preparation',
        },
        {
            id: 103,
            studentId: 3,
            studentName: 'Kavindi Silva',
            year: '8',
            subject: 'English',
            date: seedSessionDates[2],
            time: '09:30',
            notes: 'Reading and writing review',
        },
        {
            id: 104,
            studentId: 4,
            studentName: 'Dilan Jayawardena',
            year: '11',
            subject: 'Chemistry',
            date: seedSessionDates[3],
            time: '11:00',
            notes: 'Revision session',
        },
    ],
    paymentRecords: [],
    hasLocalStudentChanges: false,
})

const initialState = createInitialState()

const studentSlice = createSlice({
    name: 'students',
    initialState,
    reducers: {
        resetStudentState: () => createInitialState(),
        // --- API-driven loading (triggered by sagas) ---
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
        fetchPaymentsRequested: (state) => {
            state.paymentsLoading = true
        },
        fetchPaymentsSucceeded: (
            state,
            action: PayloadAction<PaymentRecord[]>
        ) => {
            state.paymentRecords = action.payload
            state.paymentsLoading = false
        },
        fetchPaymentsFailed: (state, action: PayloadAction<string>) => {
            state.paymentsLoading = false
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
        scheduleClass: (
            state,
            action: PayloadAction<ScheduledSessionInput>
        ) => {
            state.scheduledSessions.push({
                id: Date.now(),
                ...action.payload,
            })
        },
        updatePaymentRecord: (
            state,
            action: PayloadAction<PaymentRecordInput>
        ) => {
            const record = state.paymentRecords.find(
                (item) =>
                    item.studentId === action.payload.studentId &&
                    item.month === action.payload.month
            )
            if (record) {
                record.status = action.payload.status
                record.amountPaid = action.payload.amountPaid
                record.notes = action.payload.notes
            }
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
    addStudent,
    updateProgress,
    updateStudentDetails,
    scheduleClass,
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
