import { all, call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import type {
    MonthlyPaymentGroup,
    PaymentRecord,
    ScheduledSession,
    Student,
    Testimonial,
} from '../data/students'
import {
    archiveStudent,
    fetchStudents,
    restoreStudent,
    upsertStudent,
} from '../api/students'
import { fetchPaymentsByMonth, savePayments } from '../api/payments'
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
        takeLatest(fetchTestimonialsRequested.type, loadTestimonialsSaga),
        takeLatest(
            fetchPendingTestimonialsRequested.type,
            loadPendingTestimonialsSaga
        ),
        takeEvery(submitTestimonialRequested.type, submitTestimonialSaga),
        takeEvery(moderateTestimonialRequested.type, moderateTestimonialSaga),
        takeEvery(deleteTestimonialRequested.type, deleteTestimonialSaga),
    ])
}
