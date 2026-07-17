import { describe, expect, it } from 'vitest'
import { all, call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import type {
    MonthlyPaymentGroup,
    ScheduledSession,
    Student,
} from '../data/students'
import { fetchStudents, upsertStudent } from '../api/students'
import { fetchPaymentsByMonth, savePayments } from '../api/payments'
import {
    createSession,
    fetchSessions,
    updateSession,
    updateSessionStatus,
} from '../api/sessions'
import {
    createSessionSaga,
    editSessionSaga,
    loadPaymentsSaga,
    savePaymentSaga,
    loadSessionsSaga,
    loadStudentsSaga,
    rootSaga,
    saveStudentSaga,
    setSessionStatusSaga,
} from './sagas'
import {
    createSessionFailed,
    createSessionRequested,
    createSessionSucceeded,
    editSessionFailed,
    editSessionRequested,
    editSessionSucceeded,
    fetchPaymentsFailed,
    fetchPaymentsRequested,
    fetchPaymentsSucceeded,
    fetchSessionsFailed,
    fetchSessionsRequested,
    fetchSessionsSucceeded,
    fetchStudentsFailed,
    fetchStudentsRequested,
    fetchStudentsSucceeded,
    savePaymentFailed,
    savePaymentRequested,
    savePaymentSucceeded,
    saveStudentFailed,
    saveStudentRequested,
    saveStudentSucceeded,
    setSessionStatusFailed,
    setSessionStatusRequested,
    setSessionStatusSucceeded,
} from './store'

const students = [{ id: 1, firstName: 'Asha' }] as unknown as Student[]
const groups = [{ month: '2026-01' }] as unknown as MonthlyPaymentGroup[]
const sessions = [{ id: 101, studentId: 1 }] as unknown as ScheduledSession[]
const session = { id: 101, studentId: 1 } as unknown as ScheduledSession

const sessionInput = {
    studentIds: [1],
    subject: 'Mathematics',
    date: '2026-08-01',
    time: '10:00',
    durationMinutes: 60,
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
        const created = [session] as ScheduledSession[]
        expect(gen.next(created).value).toEqual(
            put(createSessionSucceeded(created))
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

describe('setSessionStatusSaga', () => {
    it('cancels a class and stores the server copy', () => {
        const gen = setSessionStatusSaga(
            setSessionStatusRequested({ id: 101, status: 'Cancelled' })
        )

        expect(gen.next().value).toEqual(
            call(updateSessionStatus, 101, 'Cancelled', false)
        )

        const cancelled = [
            { ...session, status: 'Cancelled' },
        ] as ScheduledSession[]
        expect(gen.next(cancelled).value).toEqual(
            put(setSessionStatusSucceeded(cancelled))
        )
        expect(gen.next().done).toBe(true)
    })

    it('un-cancels a class the same way', () => {
        const gen = setSessionStatusSaga(
            setSessionStatusRequested({ id: 101, status: 'Scheduled' })
        )
        expect(gen.next().value).toEqual(
            call(updateSessionStatus, 101, 'Scheduled', false)
        )
    })

    it('reports a failure', () => {
        const gen = setSessionStatusSaga(
            setSessionStatusRequested({ id: 101, status: 'Cancelled' })
        )
        gen.next()
        expect(gen.throw(new Error('503')).value).toEqual(
            put(setSessionStatusFailed('Could not update the class: 503'))
        )
    })

    it('falls back to a readable message for a non-Error throw', () => {
        const gen = setSessionStatusSaga(
            setSessionStatusRequested({ id: 101, status: 'Cancelled' })
        )
        gen.next()
        expect(gen.throw('kaboom').value).toEqual(
            put(setSessionStatusFailed('Could not update the class.'))
        )
    })
})

describe('editSessionSaga', () => {
    const changes = { subject: 'Physics', time: '17:00' }

    it('edits a class and stores the server copy', () => {
        const gen = editSessionSaga(
            editSessionRequested({ id: 101, changes })
        )
        expect(gen.next().value).toEqual(
            call(updateSession, 101, changes, false)
        )

        const edited = [{ ...session, ...changes }] as ScheduledSession[]
        expect(gen.next(edited).value).toEqual(put(editSessionSucceeded(edited)))
        expect(gen.next().done).toBe(true)
    })

    it('reports a failure', () => {
        const gen = editSessionSaga(
            editSessionRequested({ id: 101, changes })
        )
        gen.next()
        expect(gen.throw(new Error('500')).value).toEqual(
            put(editSessionFailed('Could not update the class: 500'))
        )
    })

    it('falls back to a readable message for a non-Error throw', () => {
        const gen = editSessionSaga(
            editSessionRequested({ id: 101, changes })
        )
        gen.next()
        expect(gen.throw('kaboom').value).toEqual(
            put(editSessionFailed('Could not update the class.'))
        )
    })
})

describe('savePaymentSaga', () => {
    const input = { studentId: 1, month: '2026-01' }

    it('puts the API record — including what it says is due — into the store', () => {
        const gen = savePaymentSaga(savePaymentRequested(input))

        expect(gen.next().value).toEqual(call(savePayments, input))

        const saved = [{ id: 100, studentId: 1, amountDue: 460 }] as never
        expect(gen.next(saved).value).toEqual(put(savePaymentSucceeded(saved)))
        expect(gen.next().done).toBe(true)
    })

    it('reports a failure rather than pretending the payment landed', () => {
        const gen = savePaymentSaga(savePaymentRequested(input))
        gen.next()
        expect(gen.throw(new Error('500')).value).toEqual(
            put(savePaymentFailed('Could not record the payment: 500'))
        )
    })

    it('falls back to a readable message for a non-Error throw', () => {
        const gen = savePaymentSaga(savePaymentRequested(input))
        gen.next()
        expect(gen.throw('kaboom').value).toEqual(
            put(savePaymentFailed('Could not record the payment.'))
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
                takeEvery(setSessionStatusRequested.type, setSessionStatusSaga),
                takeEvery(editSessionRequested.type, editSessionSaga),
                takeEvery(savePaymentRequested.type, savePaymentSaga),
            ])
        )
        expect(gen.next().done).toBe(true)
    })
})
