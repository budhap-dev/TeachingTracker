import { all, call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import type {
    MonthlyPaymentGroup,
    ScheduledSession,
    Student,
} from '../data/students'
import { fetchStudents, upsertStudent } from '../api/students'
import { fetchPaymentsByMonth } from '../api/payments'
import {
    createSession,
    fetchSessions,
    updateSessionStatus,
} from '../api/sessions'
import {
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
    saveStudentFailed,
    saveStudentRequested,
    saveStudentSucceeded,
    setSessionStatusFailed,
    setSessionStatusRequested,
    setSessionStatusSucceeded,
} from './store'

const toMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Failed to load data'

const toSaveMessage = (error: unknown): string =>
    error instanceof Error
        ? `Could not save student: ${error.message}`
        : 'Could not save student. Your changes have not been stored.'

/** Fetches students from the API and puts the result into the store. */
export function* loadStudentsSaga() {
    try {
        const students: Student[] = yield call(fetchStudents)
        yield put(fetchStudentsSucceeded(students))
    } catch (error) {
        yield put(fetchStudentsFailed(toMessage(error)))
    }
}

/** Fetches month-grouped payments from the API and puts them into the store. */
export function* loadPaymentsSaga() {
    try {
        const groups: MonthlyPaymentGroup[] = yield call(fetchPaymentsByMonth)
        yield put(fetchPaymentsSucceeded(groups))
    } catch (error) {
        yield put(fetchPaymentsFailed(toMessage(error)))
    }
}

/** Fetches scheduled classes from the API and puts them into the store. */
export function* loadSessionsSaga() {
    try {
        const sessions: ScheduledSession[] = yield call(fetchSessions)
        yield put(fetchSessionsSucceeded(sessions))
    } catch (error) {
        yield put(fetchSessionsFailed(toMessage(error)))
    }
}

/** Persists a newly scheduled class via the API. */
export function* createSessionSaga(
    action: ReturnType<typeof createSessionRequested>
) {
    try {
        const session: ScheduledSession = yield call(
            createSession,
            action.payload
        )
        yield put(createSessionSucceeded(session))
    } catch (error) {
        yield put(createSessionFailed(toMessage(error)))
    }
}

/**
 * Persists a student — created when the payload has no id, updated when it has.
 * The API's response, not the submitted draft, is what reaches the store.
 */
export function* saveStudentSaga(
    action: ReturnType<typeof saveStudentRequested>
) {
    try {
        const student: Student = yield call(upsertStudent, action.payload)
        yield put(saveStudentSucceeded(student))
    } catch (error) {
        yield put(saveStudentFailed(toSaveMessage(error)))
    }
}

/** Cancels or un-cancels a class via the API. */
export function* setSessionStatusSaga(
    action: ReturnType<typeof setSessionStatusRequested>
) {
    try {
        const session: ScheduledSession = yield call(
            updateSessionStatus,
            action.payload.id,
            action.payload.status
        )
        yield put(setSessionStatusSucceeded(session))
    } catch (error) {
        yield put(
            setSessionStatusFailed(
                error instanceof Error
                    ? `Could not update the class: ${error.message}`
                    : 'Could not update the class.'
            )
        )
    }
}

/** Root saga: watches the request actions dispatched by the app. */
export function* rootSaga() {
    yield all([
        takeLatest(fetchStudentsRequested.type, loadStudentsSaga),
        takeLatest(fetchPaymentsRequested.type, loadPaymentsSaga),
        takeLatest(fetchSessionsRequested.type, loadSessionsSaga),
        takeEvery(createSessionRequested.type, createSessionSaga),
        takeEvery(saveStudentRequested.type, saveStudentSaga),
        takeEvery(setSessionStatusRequested.type, setSessionStatusSaga),
    ])
}
