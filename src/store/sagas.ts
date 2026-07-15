import { all, call, put, takeLatest } from 'redux-saga/effects'
import type { PaymentRecord, Student } from '../data/students'
import { fetchStudents } from '../api/students'
import { fetchPayments } from '../api/payments'
import {
    fetchPaymentsFailed,
    fetchPaymentsRequested,
    fetchPaymentsSucceeded,
    fetchStudentsFailed,
    fetchStudentsRequested,
    fetchStudentsSucceeded,
} from './store'

const toMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Failed to load data'

/** Fetches students from the API and puts the result into the store. */
export function* loadStudentsSaga() {
    try {
        const students: Student[] = yield call(fetchStudents)
        yield put(fetchStudentsSucceeded(students))
    } catch (error) {
        yield put(fetchStudentsFailed(toMessage(error)))
    }
}

/** Fetches payment records from the API and puts the result into the store. */
export function* loadPaymentsSaga() {
    try {
        const payments: PaymentRecord[] = yield call(fetchPayments)
        yield put(fetchPaymentsSucceeded(payments))
    } catch (error) {
        yield put(fetchPaymentsFailed(toMessage(error)))
    }
}

/** Root saga: watches for the fetch-requested actions dispatched on app load. */
export function* rootSaga() {
    yield all([
        takeLatest(fetchStudentsRequested.type, loadStudentsSaga),
        takeLatest(fetchPaymentsRequested.type, loadPaymentsSaga),
    ])
}
