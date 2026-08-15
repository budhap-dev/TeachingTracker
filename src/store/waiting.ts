import type { RootState } from './store'

/**
 * What is waiting for the teacher (REQ-056).
 *
 * Two things arrive from the public site and sit until they are dealt with:
 * an enquiry that has not been answered, and a review that has not been
 * moderated. They surface in three places — the dashboard, the teacher's nav
 * and (REQ-053) the installed app's icon badge — and the three must never
 * disagree, so all of them count from here.
 */

/** Enquiries the teacher has not picked up yet (REQ-019). */
export const selectNewEnquiries = (state: RootState): number =>
    state.students.leads.filter((lead) => lead.status === 'New').length

/**
 * Reviews awaiting moderation. The endpoint returns exactly those, flagged
 * ones included — a flagged review is the one most wanting a look, so it must
 * never be filtered out of the number (REQ-028).
 */
export const selectPendingReviews = (state: RootState): number =>
    state.students.pendingTestimonials.length

/**
 * The single number the app icon carries (REQ-053): an icon has one badge,
 * and the teacher's question is "is anything waiting?", not "which kind?".
 */
export const selectWaitingTotal = (state: RootState): number =>
    selectNewEnquiries(state) + selectPendingReviews(state)
