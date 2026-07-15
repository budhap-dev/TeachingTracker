import { describe, expect, it } from 'vitest'
import { all, call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import type {
    MonthlyPaymentGroup,
    ScheduledSession,
    Student,
} from '../data/students'
import { fetchStudents, upsertStudent } from '../api/students'
import { fetchPaymentsByMonth } from '../api/payments'
import { createSession, fetchSessions } from '../api/sessions'
import {
    createSessionSaga,
    loadPaymentsSaga,
    loadSessionsSaga,
    loadStudentsSaga,
    rootSaga,
    saveStudentSaga,
} from './sagas'
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
} from './store'

const students = [{ id: 1, firstName: 'Asha' }] as unknown as Student[]
const groups = [{ month: '2026-01' }] as unknown as MonthlyPaymentGroup[]
const sessions = [{ id: 101, studentId: 1 }] as unknown as ScheduledSession[]
const session = { id: 101, studentId: 1 } as unknown as ScheduledSession

const sessionInput = {
    studentId: 1,
    studentName: 'Asha Perera',
    year: '10',
    subject: 'Mathematics',
    date: '2026-08-01',
    time: '10:00',
    notes: 'Revision',
}

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
    it('calls the grouped endpoint and puts the groups on success', () => {
        const gen = loadPaymentsSaga()

        expect(gen.next().value).toEqual(call(fetchPaymentsByMonth))
        expect(gen.next(groups).value).toEqual(put(fetchPaymentsSucceeded(groups)))
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

describe('loadSessionsSaga', () => {
    it('calls the API and puts the sessions on success', () => {
        const gen = loadSessionsSaga()

        expect(gen.next().value).toEqual(call(fetchSessions))
        expect(gen.next(sessions).value).toEqual(
            put(fetchSessionsSucceeded(sessions))
        )
        expect(gen.next().done).toBe(true)
    })

    it('puts the error message when the API throws', () => {
        const gen = loadSessionsSaga()
        gen.next()

        expect(gen.throw(new Error('sessions offline')).value).toEqual(
            put(fetchSessionsFailed('sessions offline'))
        )
    })
})

describe('createSessionSaga', () => {
    it('posts the session and puts the created record on success', () => {
        const gen = createSessionSaga(createSessionRequested(sessionInput))

        expect(gen.next().value).toEqual(call(createSession, sessionInput))
        expect(gen.next(session).value).toEqual(
            put(createSessionSucceeded(session))
        )
        expect(gen.next().done).toBe(true)
    })

    it('puts the error message when the POST throws', () => {
        const gen = createSessionSaga(createSessionRequested(sessionInput))
        gen.next()

        expect(gen.throw(new Error('save failed')).value).toEqual(
            put(createSessionFailed('save failed'))
        )
    })
})

describe('saveStudentSaga', () => {
    const draft = {
        id: 1,
        firstName: 'Asha',
        lastName: 'Perera',
    } as unknown as Student

    it('puts the server copy into the store on success', () => {
        const gen = saveStudentSaga(saveStudentRequested(draft))

        expect(gen.next().value).toEqual(call(upsertStudent, draft))

        // The API's response wins, not the draft we sent.
        const stored = { ...draft, studentId: 'STU-0001' } as Student
        expect(gen.next(stored).value).toEqual(put(saveStudentSucceeded(stored)))
        expect(gen.next().done).toBe(true)
    })

    it('reports a failure without discarding anything silently', () => {
        const gen = saveStudentSaga(saveStudentRequested(draft))
        gen.next()

        expect(gen.throw(new Error('500')).value).toEqual(
            put(saveStudentFailed('Could not save student: 500'))
        )
        expect(gen.next().done).toBe(true)
    })

    it('falls back to a readable message for a non-Error throw', () => {
        const gen = saveStudentSaga(saveStudentRequested(draft))
        gen.next()

        expect(gen.throw('kaboom').value).toEqual(
            put(
                saveStudentFailed(
                    'Could not save student. Your changes have not been stored.'
                )
            )
        )
    })
})

describe('rootSaga', () => {
    it('watches every request action', () => {
        const gen = rootSaga()

        expect(gen.next().value).toEqual(
            all([
                takeLatest(fetchStudentsRequested.type, loadStudentsSaga),
                takeLatest(fetchPaymentsRequested.type, loadPaymentsSaga),
                takeLatest(fetchSessionsRequested.type, loadSessionsSaga),
                takeEvery(createSessionRequested.type, createSessionSaga),
                takeEvery(saveStudentRequested.type, saveStudentSaga),
            ])
        )
        expect(gen.next().done).toBe(true)
    })
})
