import { describe, expect, it } from 'vitest'
import { all, call, put, takeLatest } from 'redux-saga/effects'
import type { PaymentRecord, Student } from '../data/students'
import { fetchStudents } from '../api/students'
import { fetchPayments } from '../api/payments'
import { loadPaymentsSaga, loadStudentsSaga, rootSaga } from './sagas'
import {
    fetchPaymentsFailed,
    fetchPaymentsRequested,
    fetchPaymentsSucceeded,
    fetchStudentsFailed,
    fetchStudentsRequested,
    fetchStudentsSucceeded,
} from './store'

const students = [{ id: 1, firstName: 'Asha' }] as unknown as Student[]
const payments = [{ id: 1, studentId: 1 }] as unknown as PaymentRecord[]

describe('loadStudentsSaga', () => {
    it('calls the API and puts the students on success', () => {
        const gen = loadStudentsSaga()

        expect(gen.next().value).toEqual(call(fetchStudents))
        expect(gen.next(students).value).toEqual(
            put(fetchStudentsSucceeded(students))
        )
        expect(gen.next().done).toBe(true)
    })

    it('puts the error message when the API throws an Error', () => {
        const gen = loadStudentsSaga()
        gen.next()

        expect(gen.throw(new Error('offline')).value).toEqual(
            put(fetchStudentsFailed('offline'))
        )
        expect(gen.next().done).toBe(true)
    })

    it('falls back to a generic message for non-Error throws', () => {
        const gen = loadStudentsSaga()
        gen.next()

        expect(gen.throw('some string' as unknown as Error).value).toEqual(
            put(fetchStudentsFailed('Failed to load data'))
        )
    })
})

describe('loadPaymentsSaga', () => {
    it('calls the API and puts the payments on success', () => {
        const gen = loadPaymentsSaga()

        expect(gen.next().value).toEqual(call(fetchPayments))
        expect(gen.next(payments).value).toEqual(
            put(fetchPaymentsSucceeded(payments))
        )
        expect(gen.next().done).toBe(true)
    })

    it('puts the error message when the API throws', () => {
        const gen = loadPaymentsSaga()
        gen.next()

        expect(gen.throw(new Error('payments offline')).value).toEqual(
            put(fetchPaymentsFailed('payments offline'))
        )
    })
})

describe('rootSaga', () => {
    it('watches both fetch-requested actions', () => {
        const gen = rootSaga()

        expect(gen.next().value).toEqual(
            all([
                takeLatest(fetchStudentsRequested.type, loadStudentsSaga),
                takeLatest(fetchPaymentsRequested.type, loadPaymentsSaga),
            ])
        )
        expect(gen.next().done).toBe(true)
    })
})
