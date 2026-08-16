import { describe, expect, it } from 'vitest'
import { all, call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import {
    createReminder as createReminderApi,
    deleteReminder as deleteReminderApi,
    fetchReminders as fetchRemindersApi,
    updateReminder as updateReminderApi,
} from '../api/reminders'
import type {
    MonthlyPaymentGroup,
    ScheduledSession,
    Student,
} from '../data/students'
import {
    archiveStudent,
    fetchStudents,
    restoreStudent,
    upsertStudent,
} from '../api/students'
import { fetchPaymentsByMonth, savePayments } from '../api/payments'
import {
    addSessionMember,
    createSession,
    deleteSession,
    fetchSessions,
    updateSession,
    updateSessionStatus,
} from '../api/sessions'
import {
    addSessionMemberSaga,
    createSessionSaga,
    deleteSessionSaga,
    editSessionSaga,
    loadPaymentsSaga,
    savePaymentSaga,
    loadSessionsSaga,
    loadStudentsSaga,
    rootSaga,
    archiveStudentSaga,
    restoreStudentSaga,
    saveStudentSaga,
    setSessionStatusSaga,
    loadSiteContentSaga,
    publishSiteContentSaga,
    loadLeadsSaga,
    submitLeadSaga,
    updateLeadStatusSaga,
    deleteLeadSaga,
    loadRemindersSaga,
    saveReminderSaga,
    deleteReminderSaga,
    loadTestimonialsSaga,
    loadPendingTestimonialsSaga,
    submitTestimonialSaga,
    featureTestimonialSaga,
    moderateTestimonialSaga,
    deleteTestimonialSaga,
    loadContactSaga,
    updateContactSaga,
} from './sagas'
import {
    addSessionMemberFailed,
    addSessionMemberRequested,
    addSessionMemberSucceeded,
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
    archiveStudentRequested,
    restoreStudentRequested,
    archiveStudentSucceeded,
    restoreStudentSucceeded,
    archiveStudentFailed,
    setSessionStatusFailed,
    setSessionStatusRequested,
    setSessionStatusSucceeded,
    deleteSessionRequested,
    deleteSessionSucceeded,
    deleteSessionFailed,
    fetchSiteContentRequested,
    fetchSiteContentFailed,
    publishSiteContentRequested,
    publishSiteContentFailed,
    fetchLeadsRequested,
    fetchLeadsFailed,
    submitLeadRequested,
    submitLeadFailed,
    updateLeadStatusRequested,
    updateLeadStatusFailed,
    deleteLeadRequested,
    fetchRemindersRequested,
    fetchRemindersSucceeded,
    saveReminderSucceeded,
    deleteReminderSucceeded,
    saveReminderRequested,
    deleteReminderRequested,
    fetchTestimonialsRequested,
    fetchPendingTestimonialsRequested,
    submitTestimonialRequested,
    featureTestimonialRequested,
    moderateTestimonialRequested,
    deleteTestimonialRequested,
    fetchContactRequested,
    updateContactRequested,
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
        // The bill is derived from held classes, so payments are refreshed too.
        expect(gen.next().value).toEqual(put(fetchPaymentsRequested()))
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

describe('addSessionMemberSaga', () => {
    const action = addSessionMemberRequested({ sessionId: 101, studentId: 7 })

    it('posts the member and puts the returned rows on success', () => {
        const gen = addSessionMemberSaga(action)

        expect(gen.next().value).toEqual(call(addSessionMember, 101, 7))
        const rows = [session] as ScheduledSession[]
        expect(gen.next(rows).value).toEqual(
            put(addSessionMemberSucceeded(rows))
        )
        expect(gen.next().value).toEqual(put(fetchPaymentsRequested()))
        expect(gen.next().done).toBe(true)
    })

    it('reports the error message when the POST throws', () => {
        const gen = addSessionMemberSaga(action)
        gen.next()

        expect(gen.throw(new Error('already a member')).value).toEqual(
            put(addSessionMemberFailed('Could not add the student: already a member'))
        )
    })

    it('falls back to a generic message for a non-Error throw', () => {
        const gen = addSessionMemberSaga(action)
        gen.next()

        expect(gen.throw('boom').value).toEqual(
            put(addSessionMemberFailed('Could not add the student to the class.'))
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
        // A rename refreshes denormalised session names server-side, so the
        // sagas pulls the classes back afterwards.
        expect(gen.next().value).toEqual(put(fetchSessionsRequested()))
        // A fee/fee-type change re-derives the bills, so payments refresh too.
        expect(gen.next().value).toEqual(put(fetchPaymentsRequested()))
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

describe('archiveStudentSaga', () => {
    const stored = { id: 10, isArchived: true } as unknown as Student

    it('archives with the note and stores the server copy', () => {
        const gen = archiveStudentSaga(
            archiveStudentRequested({ id: 10, notes: 'Finished GCSEs' })
        )
        expect(gen.next().value).toEqual(
            call(archiveStudent, 10, 'Finished GCSEs')
        )
        expect(gen.next(stored).value).toEqual(
            put(archiveStudentSucceeded(stored))
        )
        // Archiving cancels future classes server-side, so sessions refresh.
        expect(gen.next().value).toEqual(put(fetchSessionsRequested()))
        expect(gen.next().done).toBe(true)
    })

    it('surfaces the API message (e.g. the 409) on failure', () => {
        const gen = archiveStudentSaga(
            archiveStudentRequested({ id: 10, notes: 'x' })
        )
        gen.next()
        expect(gen.throw(new Error('still has a class')).value).toEqual(
            put(archiveStudentFailed('still has a class'))
        )
    })

    it('falls back to a readable message for a non-Error throw', () => {
        const gen = archiveStudentSaga(
            archiveStudentRequested({ id: 10, notes: 'x' })
        )
        gen.next()
        expect(gen.throw('kaboom').value).toEqual(
            put(archiveStudentFailed('Could not archive the student.'))
        )
    })
})

describe('restoreStudentSaga', () => {
    const stored = { id: 10, isArchived: false } as unknown as Student

    it('restores and stores the server copy', () => {
        const gen = restoreStudentSaga(restoreStudentRequested(10))
        expect(gen.next().value).toEqual(call(restoreStudent, 10))
        expect(gen.next(stored).value).toEqual(
            put(restoreStudentSucceeded(stored))
        )
        expect(gen.next().done).toBe(true)
    })

    it('surfaces the API error message on failure', () => {
        const gen = restoreStudentSaga(restoreStudentRequested(10))
        gen.next()
        expect(gen.throw(new Error('nope')).value).toEqual(
            put(archiveStudentFailed('nope'))
        )
    })

    it('falls back to a readable message for a non-Error throw', () => {
        const gen = restoreStudentSaga(restoreStudentRequested(10))
        gen.next()
        expect(gen.throw('kaboom').value).toEqual(
            put(archiveStudentFailed('Could not restore the student.'))
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
        expect(gen.next().value).toEqual(put(fetchPaymentsRequested()))
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

describe('deleteSessionSaga', () => {
    it('deletes the class and puts the removed ids on success', () => {
        const gen = deleteSessionSaga(deleteSessionRequested(101))

        expect(gen.next().value).toEqual(call(deleteSession, 101))
        expect(gen.next([101, 102]).value).toEqual(
            put(deleteSessionSucceeded([101, 102]))
        )
        expect(gen.next().value).toEqual(put(fetchPaymentsRequested()))
        expect(gen.next().done).toBe(true)
    })

    it('reports the error message when the DELETE throws', () => {
        const gen = deleteSessionSaga(deleteSessionRequested(101))
        gen.next()
        expect(gen.throw(new Error('boom')).value).toEqual(
            put(deleteSessionFailed('Could not delete the class: boom'))
        )
    })

    it('falls back to a readable message for a non-Error throw', () => {
        const gen = deleteSessionSaga(deleteSessionRequested(101))
        gen.next()
        expect(gen.throw('kaboom').value).toEqual(
            put(deleteSessionFailed('Could not delete the class.'))
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
        expect(gen.next().value).toEqual(put(fetchPaymentsRequested()))
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

describe('reminder sagas (REQ-057)', () => {
    const reminder = { id: 1, date: '2026-08-20', text: 'Order paper' }

    it('loads the notes-to-self', () => {
        const gen = loadRemindersSaga()
        expect(gen.next().value).toEqual(call(fetchRemindersApi))
        expect(gen.next([reminder]).value).toEqual(
            put(fetchRemindersSucceeded([reminder]))
        )
        expect(gen.next().done).toBe(true)
    })

    it('creates when there is no id, updates when there is', () => {
        const input = { date: '2026-08-20', text: 'Order paper' }

        const creating = saveReminderSaga(saveReminderRequested({ input }))
        expect(creating.next().value).toEqual(call(createReminderApi, input))

        const updating = saveReminderSaga(
            saveReminderRequested({ id: 1, input })
        )
        expect(updating.next().value).toEqual(
            call(updateReminderApi, 1, input)
        )
    })

    it('stores the server copy after a save', () => {
        const gen = saveReminderSaga(
            saveReminderRequested({ input: { date: '2026-08-20', text: 'x' } })
        )
        gen.next()
        expect(gen.next(reminder).value).toEqual(
            put(saveReminderSucceeded(reminder))
        )
    })

    it('drops the id from state after a delete', () => {
        const gen = deleteReminderSaga(deleteReminderRequested(1))
        expect(gen.next().value).toEqual(call(deleteReminderApi, 1))
        expect(gen.next().value).toEqual(put(deleteReminderSucceeded(1)))
    })

    it.each([
        ['load', () => loadRemindersSaga(), /load your reminders/],
        [
            'save',
            () =>
                saveReminderSaga(
                    saveReminderRequested({
                        input: { date: '2026-08-20', text: 'x' },
                    })
                ),
            /save the reminder/,
        ],
        ['delete', () => deleteReminderSaga(deleteReminderRequested(1)), /delete the reminder/],
    ])('says what went wrong when a %s fails', (_what, start, message) => {
        const gen = start()
        gen.next()
        // The effect is a put(); the message rides in its action's payload.
        const failure = gen.throw(new Error('offline')).value as {
            payload: { action: { payload: string } }
        }
        expect(failure.payload.action.payload).toMatch(message)
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
                takeEvery(
                    addSessionMemberRequested.type,
                    addSessionMemberSaga
                ),
                takeEvery(saveStudentRequested.type, saveStudentSaga),
                takeEvery(archiveStudentRequested.type, archiveStudentSaga),
                takeEvery(restoreStudentRequested.type, restoreStudentSaga),
                takeEvery(setSessionStatusRequested.type, setSessionStatusSaga),
                takeEvery(deleteSessionRequested.type, deleteSessionSaga),
                takeEvery(editSessionRequested.type, editSessionSaga),
                takeEvery(savePaymentRequested.type, savePaymentSaga),
                takeLatest(
                    fetchSiteContentRequested.type,
                    loadSiteContentSaga
                ),
                takeEvery(
                    publishSiteContentRequested.type,
                    publishSiteContentSaga
                ),
                takeLatest(fetchLeadsRequested.type, loadLeadsSaga),
                takeEvery(submitLeadRequested.type, submitLeadSaga),
                takeEvery(
                    updateLeadStatusRequested.type,
                    updateLeadStatusSaga
                ),
                takeEvery(deleteLeadRequested.type, deleteLeadSaga),
                takeLatest(fetchRemindersRequested.type, loadRemindersSaga),
                takeEvery(saveReminderRequested.type, saveReminderSaga),
                takeEvery(deleteReminderRequested.type, deleteReminderSaga),
                takeLatest(
                    fetchTestimonialsRequested.type,
                    loadTestimonialsSaga
                ),
                takeLatest(
                    fetchPendingTestimonialsRequested.type,
                    loadPendingTestimonialsSaga
                ),
                takeEvery(
                    submitTestimonialRequested.type,
                    submitTestimonialSaga
                ),
                takeEvery(
                    moderateTestimonialRequested.type,
                    moderateTestimonialSaga
                ),
                takeEvery(
                    featureTestimonialRequested.type,
                    featureTestimonialSaga
                ),
                takeEvery(
                    deleteTestimonialRequested.type,
                    deleteTestimonialSaga
                ),
                takeLatest(fetchContactRequested.type, loadContactSaga),
                takeEvery(updateContactRequested.type, updateContactSaga),
            ])
        )
        expect(gen.next().done).toBe(true)
    })
})

describe('site-content sagas (REQ-008)', () => {
    it('loads the document and swallows failures silently', () => {
        const gen = loadSiteContentSaga()
        gen.next()
        // Failure puts the silent action — no message, no toast.
        expect(gen.throw(new Error('offline')).value).toEqual(
            put(fetchSiteContentFailed())
        )
    })

    it('reports publish failures, Error and not', () => {
        const content = { siteName: 'x' } as never
        let gen = publishSiteContentSaga(publishSiteContentRequested(content))
        gen.next()
        expect(gen.throw(new Error('403')).value).toEqual(
            put(publishSiteContentFailed('Could not publish: 403'))
        )

        gen = publishSiteContentSaga(publishSiteContentRequested(content))
        gen.next()
        expect(gen.throw('boom').value).toEqual(
            put(publishSiteContentFailed('Could not publish the site content.'))
        )
    })
})

describe('lead sagas (REQ-018/019)', () => {
    it('loads the inbox and reports a failure', () => {
        const gen = loadLeadsSaga()
        gen.next()
        expect(gen.throw(new Error('inbox offline')).value).toEqual(
            put(fetchLeadsFailed('inbox offline'))
        )
    })

    it('reports enquiry submit failures, Error and not', () => {
        const enquiry = submitLeadRequested({
            parentName: 'Jo',
            year: '9',
            subjects: ['Maths'],
            goal: 'help',
            mode: 'Either',
        })
        let gen = submitLeadSaga(enquiry)
        gen.next()
        expect(gen.throw(new Error('500')).value).toEqual(
            put(submitLeadFailed('Could not send your enquiry: 500'))
        )

        gen = submitLeadSaga(enquiry)
        gen.next()
        expect(gen.throw('boom').value).toEqual(
            put(submitLeadFailed('Could not send your enquiry.'))
        )
    })

    it('reports status update failures, Error and not', () => {
        const action = updateLeadStatusRequested({ id: 1, status: 'Contacted' })
        let gen = updateLeadStatusSaga(action)
        gen.next()
        expect(gen.throw(new Error('409')).value).toEqual(
            put(updateLeadStatusFailed('Could not update the enquiry: 409'))
        )

        gen = updateLeadStatusSaga(action)
        gen.next()
        expect(gen.throw('boom').value).toEqual(
            put(updateLeadStatusFailed('Could not update the enquiry.'))
        )
    })
})
