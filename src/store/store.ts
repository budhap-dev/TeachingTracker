import {
    configureStore,
    createAsyncThunk,
    createSlice,
    PayloadAction,
} from '@reduxjs/toolkit'
import {
    generateStudentCode,
    initialStudents,
    PaymentRecord,
    PaymentRecordInput,
    PaymentStatus,
    ScheduledSession,
    Student,
    StudentDetailField,
} from '../data/students'
import { isApiConfigured } from '../api/client'
import { fetchStudents } from '../api/students'

type ScheduledSessionInput = Omit<ScheduledSession, 'id'>

type StudentState = {
    students: Student[]
    loading: boolean
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

const paymentYear = new Date().getFullYear()
const paymentMonths = Array.from(
    { length: 12 },
    (_, monthIndex) =>
        `${paymentYear}-${String(monthIndex + 1).padStart(2, '0')}`
)

const paymentStatusNotes: Record<PaymentStatus, string> = {
    Paid: 'Received in full',
    Partial: 'Partial payment received',
    Pending: 'Awaiting payment',
}

const buildInitialPaymentRecords = (students: Student[]): PaymentRecord[] =>
    students.flatMap((student) =>
        paymentMonths.map((month, monthIndex) => {
            const monthlyFee = 120 + (student.id % 4) * 10
            const pattern = (student.id + monthIndex) % 3
            const status: PaymentStatus =
                pattern === 0 ? 'Paid' : pattern === 1 ? 'Partial' : 'Pending'
            const amountPaid =
                status === 'Paid'
                    ? monthlyFee
                    : status === 'Partial'
                      ? Math.round(monthlyFee * 0.5)
                      : 0

            return {
                id: student.id * 100 + monthIndex,
                studentId: student.id,
                studentName: `${student.firstName} ${student.lastName}`,
                month,
                monthlyFee,
                amountPaid,
                status,
                notes: paymentStatusNotes[status],
            }
        })
    )

const createInitialState = (): StudentState => ({
    students: initialStudents,
    loading: false,
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
    paymentRecords: buildInitialPaymentRecords(initialStudents),
    hasLocalStudentChanges: false,
})

const initialState = createInitialState()

// Fetches students from the API when a backend is configured
// (VITE_API_BASE_URL set for this environment); otherwise resolves to local
// seed data so tests and offline dev work with no backend.
export const loadStudents = createAsyncThunk(
    'students/loadStudents',
    async () => (isApiConfigured() ? fetchStudents() : initialStudents)
)

const studentSlice = createSlice({
    name: 'students',
    initialState,
    reducers: {
        resetStudentState: () => createInitialState(),
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
    extraReducers: (builder) => {
        builder.addCase(loadStudents.pending, (state) => {
            state.loading = true
        })
        builder.addCase(loadStudents.fulfilled, (state, action) => {
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
        })
        builder.addCase(loadStudents.rejected, (state) => {
            state.loading = false
        })
    },
})

export const {
    addStudent,
    resetStudentState,
    updateProgress,
    updateStudentDetails,
    scheduleClass,
    updatePaymentRecord,
} = studentSlice.actions

export const store = configureStore({
    reducer: {
        students: studentSlice.reducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
