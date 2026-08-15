import { all, call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import {
    deleteLead as deleteLeadApi,
    fetchLeads,
    submitLead,
    updateLeadStatus,
} from '../api/leads'
import { fetchSiteContent, updateSiteContent as putSiteContent } from '../api/siteContent'
import {
    createReminder as createReminderApi,
    deleteReminder as deleteReminderApi,
    fetchReminders as fetchRemindersApi,
    updateReminder as updateReminderApi,
} from '../api/reminders'
import type { SiteContent } from '../data/siteContent'
import type {
    Lead,
    MonthlyPaymentGroup,
    Reminder,
    PaymentRecord,
    ScheduledSession,
    Student,
    Testimonial,
} from '../data/students'
import type { Contact } from '../data/contact'
import {
    archiveStudent,
    fetchStudents,
    restoreStudent,
    upsertStudent,
} from '../api/students'
import { fetchPaymentsByMonth, savePayments } from '../api/payments'
import { fetchContact, updateContact } from '../api/contact'
import {
    deleteTestimonial as deleteTestimonialApi,
    fetchApprovedTestimonials,
    fetchPendingTestimonials,
    setTestimonialStatus,
    submitTestimonial,
} from '../api/reviews'
import {
    addSessionMember,
    createSession,
    deleteSession,
    fetchSessions,
    updateSession,
    updateSessionStatus,
} from '../api/sessions'
import {
    createSessionFailed,
    createSessionRequested,
    createSessionSucceeded,
    addSessionMemberRequested,
    addSessionMemberSucceeded,
    addSessionMemberFailed,
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
    editSessionFailed,
    editSessionRequested,
    editSessionSucceeded,
    fetchSiteContentRequested,
    fetchSiteContentSucceeded,
    fetchSiteContentFailed,
    publishSiteContentRequested,
    publishSiteContentSucceeded,
    publishSiteContentFailed,
    fetchLeadsRequested,
    fetchLeadsSucceeded,
    fetchRemindersRequested,
    fetchRemindersSucceeded,
    saveReminderRequested,
    saveReminderSucceeded,
    deleteReminderRequested,
    deleteReminderSucceeded,
    reminderFailed,
    fetchLeadsFailed,
    submitLeadRequested,
    submitLeadSucceeded,
    submitLeadFailed,
    updateLeadStatusRequested,
    updateLeadStatusSucceeded,
    updateLeadStatusFailed,
    deleteLeadRequested,
    deleteLeadSucceeded,
    deleteLeadFailed,
    fetchTestimonialsRequested,
    fetchTestimonialsSucceeded,
    fetchTestimonialsFailed,
    fetchPendingTestimonialsRequested,
    fetchPendingTestimonialsSucceeded,
    fetchPendingTestimonialsFailed,
    submitTestimonialRequested,
    submitTestimonialSucceeded,
    submitTestimonialFailed,
    moderateTestimonialRequested,
    moderateTestimonialSucceeded,
    moderateTestimonialFailed,
    deleteTestimonialRequested,
    deleteTestimonialSucceeded,
    deleteTestimonialFailed,
    fetchContactRequested,
    fetchContactSucceeded,
    fetchContactFailed,
    updateContactRequested,
    updateContactSucceeded,
    updateContactFailed,
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

/** Persists a newly scheduled class via the API — one row, or a group. */
export function* createSessionSaga(
    action: ReturnType<typeof createSessionRequested>
) {
    try {
        const sessions: ScheduledSession[] = yield call(
            createSession,
            action.payload
        )
        yield put(createSessionSucceeded(sessions))
        // Bills are derived from the classes held, and the Payment Tracker
        // shows the server's figures — refresh them so a newly scheduled class
        // updates the tracker without a page reload.
        yield put(fetchPaymentsRequested())
    } catch (error) {
        yield put(createSessionFailed(toMessage(error)))
    }
}

/** Adds a student to a class (solo → group); the group's rows come back. */
export function* addSessionMemberSaga(
    action: ReturnType<typeof addSessionMemberRequested>
) {
    try {
        const rows: ScheduledSession[] = yield call(
            addSessionMember,
            action.payload.sessionId,
            action.payload.studentId
        )
        yield put(addSessionMemberSucceeded(rows))
        // The joined student now has another held class — re-derive the bills.
        yield put(fetchPaymentsRequested())
    } catch (error) {
        yield put(
            addSessionMemberFailed(
                error instanceof Error
                    ? `Could not add the student: ${error.message}`
                    : 'Could not add the student to the class.'
            )
        )
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
        // A rename refreshes the denormalised name/year the API keeps on the
        // student's classes; pull them back so the planner and student page
        // show the new name at once, not only after a reload.
        yield put(fetchSessionsRequested())
        // A change to the fee or fee type re-derives the student's bills, so
        // refresh payments too — otherwise the tracker shows the old basis
        // (e.g. a now-monthly student still reading "× £X a session").
        yield put(fetchPaymentsRequested())
    } catch (error) {
        yield put(saveStudentFailed(toSaveMessage(error)))
    }
}

/** Archives a student (REQ-013); the API's 409 message surfaces as the toast. */
export function* archiveStudentSaga(
    action: ReturnType<typeof archiveStudentRequested>
) {
    try {
        const student: Student = yield call(
            archiveStudent,
            action.payload.id,
            action.payload.notes
        )
        yield put(archiveStudentSucceeded(student))
        // Archiving cancels the student's future classes server-side; refresh
        // sessions so the calendar and dashboard reflect the cancellations.
        yield put(fetchSessionsRequested())
    } catch (error) {
        yield put(
            archiveStudentFailed(
                error instanceof Error
                    ? error.message
                    : 'Could not archive the student.'
            )
        )
    }
}

/** Restores an alumnus to the active roster. */
export function* restoreStudentSaga(
    action: ReturnType<typeof restoreStudentRequested>
) {
    try {
        const student: Student = yield call(restoreStudent, action.payload)
        yield put(restoreStudentSucceeded(student))
    } catch (error) {
        yield put(
            archiveStudentFailed(
                error instanceof Error
                    ? error.message
                    : 'Could not restore the student.'
            )
        )
    }
}

/** Cancels or un-cancels a class via the API — one row, or the group. */
export function* setSessionStatusSaga(
    action: ReturnType<typeof setSessionStatusRequested>
) {
    try {
        const sessions: ScheduledSession[] = yield call(
            updateSessionStatus,
            action.payload.id,
            action.payload.status,
            action.payload.applyToGroup ?? false
        )
        yield put(setSessionStatusSucceeded(sessions))
        // Cancelling/un-cancelling changes whether a class counts as held, so
        // the amount due moves — refresh the tracker.
        yield put(fetchPaymentsRequested())
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

/** Deletes a class via the API — the removed ids come back to drop from state. */
export function* deleteSessionSaga(
    action: ReturnType<typeof deleteSessionRequested>
) {
    try {
        const ids: number[] = yield call(deleteSession, action.payload)
        yield put(deleteSessionSucceeded(ids))
        // A deleted class leaves the held count, so the bill drops — refresh.
        yield put(fetchPaymentsRequested())
    } catch (error) {
        yield put(
            deleteSessionFailed(
                error instanceof Error
                    ? `Could not delete the class: ${error.message}`
                    : 'Could not delete the class.'
            )
        )
    }
}

/** Edits a class's details via the API, taking the server's copy as truth. */
export function* editSessionSaga(
    action: ReturnType<typeof editSessionRequested>
) {
    try {
        const sessions: ScheduledSession[] = yield call(
            updateSession,
            action.payload.id,
            action.payload.changes,
            action.payload.applyToGroup ?? false
        )
        yield put(editSessionSucceeded(sessions))
        // Editing a class (its date especially) can change which month it
        // falls in or whether it's held — re-derive the bills.
        yield put(fetchPaymentsRequested())
    } catch (error) {
        yield put(
            editSessionFailed(
                error instanceof Error
                    ? `Could not update the class: ${error.message}`
                    : 'Could not update the class.'
            )
        )
    }
}

/**
 * Records a payment via the API. The response carries the API's own view of what
 * is due, so the table can never show a total the server disagrees with.
 */
export function* savePaymentSaga(
    action: ReturnType<typeof savePaymentRequested>
) {
    try {
        const saved: PaymentRecord[] = yield call(savePayments, action.payload)
        yield put(savePaymentSucceeded(saved))
    } catch (error) {
        yield put(
            savePaymentFailed(
                error instanceof Error
                    ? `Could not record the payment: ${error.message}`
                    : 'Could not record the payment.'
            )
        )
    }
}

/** Fetches the public site's content; failure keeps the bundled fallback. */
export function* loadSiteContentSaga() {
    try {
        const content: SiteContent = yield call(fetchSiteContent)
        yield put(fetchSiteContentSucceeded(content))
    } catch {
        // Silent by design (REQ-008 graceful degradation): the fallback copy
        // is already rendering; a visitor gets no error toast.
        yield put(fetchSiteContentFailed())
    }
}

/** Publishes the site content; the sanitised document comes back. */
export function* publishSiteContentSaga(
    action: ReturnType<typeof publishSiteContentRequested>
) {
    try {
        const published: SiteContent = yield call(
            putSiteContent,
            action.payload
        )
        yield put(publishSiteContentSucceeded(published))
    } catch (error) {
        yield put(
            publishSiteContentFailed(
                error instanceof Error
                    ? `Could not publish: ${error.message}`
                    : 'Could not publish the site content.'
            )
        )
    }
}

/** Fetches the teacher's enquiries inbox (REQ-019). */
export function* loadLeadsSaga() {
    try {
        const leads: Lead[] = yield call(fetchLeads)
        yield put(fetchLeadsSucceeded(leads))
    } catch (error) {
        yield put(fetchLeadsFailed(toMessage(error)))
    }
}

/** Submits a public enquiry; it lands as New in the teacher's inbox. */
export function* submitLeadSaga(
    action: ReturnType<typeof submitLeadRequested>
) {
    try {
        yield call(submitLead, action.payload)
        yield put(submitLeadSucceeded())
    } catch (error) {
        yield put(
            submitLeadFailed(
                error instanceof Error
                    ? `Could not send your enquiry: ${error.message}`
                    : 'Could not send your enquiry.'
            )
        )
    }
}

/** Moves an enquiry through the inbox; the updated record comes back. */
export function* updateLeadStatusSaga(
    action: ReturnType<typeof updateLeadStatusRequested>
) {
    try {
        const lead: Lead = yield call(
            updateLeadStatus,
            action.payload.id,
            action.payload.status
        )
        yield put(updateLeadStatusSucceeded(lead))
    } catch (error) {
        yield put(
            updateLeadStatusFailed(
                error instanceof Error
                    ? `Could not update the enquiry: ${error.message}`
                    : 'Could not update the enquiry.'
            )
        )
    }
}

/** Erases an enquiry outright (REQ-032); the removed id drops from state. */
export function* deleteLeadSaga(
    action: ReturnType<typeof deleteLeadRequested>
) {
    try {
        const id: number = yield call(deleteLeadApi, action.payload)
        yield put(deleteLeadSucceeded(id))
    } catch (error) {
        yield put(
            deleteLeadFailed(
                error instanceof Error
                    ? `Could not delete the enquiry: ${error.message}`
                    : 'Could not delete the enquiry.'
            )
        )
    }
}

/** Loads the teacher's own reminders (REQ-057). */
export function* loadRemindersSaga() {
    try {
        const reminders: Reminder[] = yield call(fetchRemindersApi)
        yield put(fetchRemindersSucceeded(reminders))
    } catch (error) {
        // Quiet on load: the dashboard still has classes to show, and a
        // missing note-to-self is not worth an error banner over them.
        yield put(
            reminderFailed(
                error instanceof Error
                    ? `Could not load your reminders: ${error.message}`
                    : 'Could not load your reminders.'
            )
        )
    }
}

/** Writes a reminder — new when there is no id, a change when there is. */
export function* saveReminderSaga(
    action: ReturnType<typeof saveReminderRequested>
) {
    const { id, input } = action.payload
    try {
        const reminder: Reminder = yield call(
            id ? updateReminderApi : createReminderApi,
            ...(id ? [id, input] : [input])
        )
        yield put(saveReminderSucceeded(reminder))
    } catch (error) {
        yield put(
            reminderFailed(
                error instanceof Error
                    ? `Could not save the reminder: ${error.message}`
                    : 'Could not save the reminder.'
            )
        )
    }
}

export function* deleteReminderSaga(
    action: ReturnType<typeof deleteReminderRequested>
) {
    try {
        yield call(deleteReminderApi, action.payload)
        yield put(deleteReminderSucceeded(action.payload))
    } catch (error) {
        yield put(
            reminderFailed(
                error instanceof Error
                    ? `Could not delete the reminder: ${error.message}`
                    : 'Could not delete the reminder.'
            )
        )
    }
}

/** Fetches approved reviews for the public Reviews page. */
export function* loadTestimonialsSaga() {
    try {
        const testimonials: Testimonial[] = yield call(
            fetchApprovedTestimonials
        )
        yield put(fetchTestimonialsSucceeded(testimonials))
    } catch (error) {
        yield put(fetchTestimonialsFailed(toMessage(error)))
    }
}

/** Fetches pending reviews for the teacher's moderation queue. */
export function* loadPendingTestimonialsSaga() {
    try {
        const testimonials: Testimonial[] = yield call(fetchPendingTestimonials)
        yield put(fetchPendingTestimonialsSucceeded(testimonials))
    } catch (error) {
        yield put(fetchPendingTestimonialsFailed(toMessage(error)))
    }
}

/** Submits a public review; it lands as Pending for the teacher to moderate. */
export function* submitTestimonialSaga(
    action: ReturnType<typeof submitTestimonialRequested>
) {
    try {
        yield call(submitTestimonial, action.payload)
        yield put(submitTestimonialSucceeded())
    } catch (error) {
        yield put(
            submitTestimonialFailed(
                error instanceof Error
                    ? `Could not submit your review: ${error.message}`
                    : 'Could not submit your review.'
            )
        )
    }
}

/** Approves or rejects a review; the moderated record comes back. */
export function* moderateTestimonialSaga(
    action: ReturnType<typeof moderateTestimonialRequested>
) {
    try {
        const testimonial: Testimonial = yield call(
            setTestimonialStatus,
            action.payload.id,
            action.payload.status
        )
        yield put(moderateTestimonialSucceeded(testimonial))
    } catch (error) {
        yield put(
            moderateTestimonialFailed(
                error instanceof Error
                    ? `Could not update the review: ${error.message}`
                    : 'Could not update the review.'
            )
        )
    }
}

/** Deletes a review outright; the removed id comes back to drop from state. */
export function* deleteTestimonialSaga(
    action: ReturnType<typeof deleteTestimonialRequested>
) {
    try {
        const id: number = yield call(deleteTestimonialApi, action.payload)
        yield put(deleteTestimonialSucceeded(id))
    } catch (error) {
        yield put(
            deleteTestimonialFailed(
                error instanceof Error
                    ? `Could not delete the review: ${error.message}`
                    : 'Could not delete the review.'
            )
        )
    }
}

/** Fetches the public contact details for the Contact page. */
export function* loadContactSaga() {
    try {
        const contact: Contact = yield call(fetchContact)
        yield put(fetchContactSucceeded(contact))
    } catch (error) {
        yield put(fetchContactFailed(toMessage(error)))
    }
}

/** Saves the teacher's edits; the stored record comes back to refresh state. */
export function* updateContactSaga(
    action: ReturnType<typeof updateContactRequested>
) {
    try {
        const contact: Contact = yield call(updateContact, action.payload)
        yield put(updateContactSucceeded(contact))
    } catch (error) {
        yield put(
            updateContactFailed(
                error instanceof Error
                    ? `Could not update contact details: ${error.message}`
                    : 'Could not update contact details.'
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
        takeEvery(addSessionMemberRequested.type, addSessionMemberSaga),
        takeEvery(saveStudentRequested.type, saveStudentSaga),
        takeEvery(archiveStudentRequested.type, archiveStudentSaga),
        takeEvery(restoreStudentRequested.type, restoreStudentSaga),
        takeEvery(setSessionStatusRequested.type, setSessionStatusSaga),
        takeEvery(deleteSessionRequested.type, deleteSessionSaga),
        takeEvery(editSessionRequested.type, editSessionSaga),
        takeEvery(savePaymentRequested.type, savePaymentSaga),
        takeLatest(fetchSiteContentRequested.type, loadSiteContentSaga),
        takeEvery(publishSiteContentRequested.type, publishSiteContentSaga),
        takeLatest(fetchLeadsRequested.type, loadLeadsSaga),
        takeEvery(submitLeadRequested.type, submitLeadSaga),
        takeEvery(updateLeadStatusRequested.type, updateLeadStatusSaga),
        takeEvery(deleteLeadRequested.type, deleteLeadSaga),
        takeLatest(fetchRemindersRequested.type, loadRemindersSaga),
        takeEvery(saveReminderRequested.type, saveReminderSaga),
        takeEvery(deleteReminderRequested.type, deleteReminderSaga),
        takeLatest(fetchTestimonialsRequested.type, loadTestimonialsSaga),
        takeLatest(
            fetchPendingTestimonialsRequested.type,
            loadPendingTestimonialsSaga
        ),
        takeEvery(submitTestimonialRequested.type, submitTestimonialSaga),
        takeEvery(moderateTestimonialRequested.type, moderateTestimonialSaga),
        takeEvery(deleteTestimonialRequested.type, deleteTestimonialSaga),
        takeLatest(fetchContactRequested.type, loadContactSaga),
        takeEvery(updateContactRequested.type, updateContactSaga),
    ])
}
