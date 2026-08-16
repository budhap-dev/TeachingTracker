import { describe, expect, it } from 'vitest'
import { call, put } from 'redux-saga/effects'
import type { Testimonial } from '../data/students'
import {
    deleteTestimonial,
    fetchApprovedTestimonials,
    fetchPendingTestimonials,
    setTestimonialFeatured,
    setTestimonialStatus,
    submitTestimonial,
} from '../api/reviews'
import type { TestimonialInput } from '../api/reviews'
import {
    deleteTestimonialSaga,
    featureTestimonialSaga,
    loadPendingTestimonialsSaga,
    loadTestimonialsSaga,
    moderateTestimonialSaga,
    submitTestimonialSaga,
} from './sagas'
import {
    deleteTestimonialFailed,
    deleteTestimonialRequested,
    deleteTestimonialSucceeded,
    fetchPendingTestimonialsFailed,
    fetchPendingTestimonialsRequested,
    fetchPendingTestimonialsSucceeded,
    fetchTestimonialsFailed,
    fetchTestimonialsRequested,
    fetchTestimonialsSucceeded,
    featureTestimonialFailed,
    featureTestimonialRequested,
    featureTestimonialSucceeded,
    moderateTestimonialFailed,
    moderateTestimonialRequested,
    moderateTestimonialSucceeded,
    studentReducer,
    submitTestimonialFailed,
    submitTestimonialRequested,
    submitTestimonialSucceeded,
} from './store'

const base = () => studentReducer(undefined, { type: '@@init' })

const approved: Testimonial = {
    id: 1,
    authorName: 'Nadia',
    role: 'Parent',
    subject: 'Mathematics',
    year: '10',
    rating: 5,
    quote: 'Great.',
    status: 'Approved',
    submittedOn: '2026-05-12',
}

const pending: Testimonial = {
    id: 3,
    authorName: 'Helen',
    role: 'Parent',
    rating: 4,
    quote: 'Reliable.',
    status: 'Pending',
    submittedOn: '2026-07-15',
}

const input: TestimonialInput = {
    authorName: 'Jo',
    role: 'Parent',
    rating: 5,
    quote: 'Lovely.',
}

describe('testimonial reducers', () => {
    it('marks the approved list loading, then stores it', () => {
        const loading = studentReducer(base(), fetchTestimonialsRequested())
        expect(loading.testimonialsLoading).toBe(true)

        const loaded = studentReducer(
            loading,
            fetchTestimonialsSucceeded([approved])
        )
        expect(loaded.testimonials).toEqual([approved])
        expect(loaded.testimonialsLoading).toBe(false)
    })

    it('surfaces an approved-list failure', () => {
        const next = studentReducer(base(), fetchTestimonialsFailed('nope'))
        expect(next.testimonialsLoading).toBe(false)
        expect(next.error).toBe('nope')
        expect(next.notice).toEqual({ kind: 'error', message: 'nope' })
    })

    it('marks the pending queue loading, then stores it', () => {
        const loading = studentReducer(
            base(),
            fetchPendingTestimonialsRequested()
        )
        expect(loading.pendingTestimonialsLoading).toBe(true)

        const loaded = studentReducer(
            loading,
            fetchPendingTestimonialsSucceeded([pending])
        )
        expect(loaded.pendingTestimonials).toEqual([pending])
        expect(loaded.pendingTestimonialsLoading).toBe(false)
    })

    it('surfaces a pending-queue failure', () => {
        const next = studentReducer(
            base(),
            fetchPendingTestimonialsFailed('down')
        )
        expect(next.pendingTestimonialsLoading).toBe(false)
        expect(next.error).toBe('down')
    })

    it('tracks a submission and thanks the submitter', () => {
        const requested = studentReducer(
            { ...base(), error: 'stale' },
            submitTestimonialRequested(input)
        )
        expect(requested.savingTestimonial).toBe(true)
        expect(requested.error).toBeNull()

        const done = studentReducer(requested, submitTestimonialSucceeded())
        expect(done.savingTestimonial).toBe(false)
        expect(done.notice?.kind).toBe('success')
    })

    it('surfaces a submission failure', () => {
        const next = studentReducer(base(), submitTestimonialFailed('bad'))
        expect(next.savingTestimonial).toBe(false)
        expect(next.error).toBe('bad')
    })

    it('approving removes it from the queue and publishes it', () => {
        const start = {
            ...base(),
            pendingTestimonials: [pending],
            testimonials: [approved],
        }
        const next = studentReducer(
            start,
            moderateTestimonialSucceeded({ ...pending, status: 'Approved' })
        )
        expect(next.pendingTestimonials).toEqual([])
        expect(next.testimonials[0].id).toBe(pending.id)
        expect(next.notice?.message).toMatch(/approved/i)
    })

    it('rejecting removes it from the queue without publishing', () => {
        const start = {
            ...base(),
            pendingTestimonials: [pending],
            testimonials: [approved],
        }
        const next = studentReducer(
            start,
            moderateTestimonialSucceeded({ ...pending, status: 'Rejected' })
        )
        expect(next.pendingTestimonials).toEqual([])
        expect(next.testimonials).toEqual([approved])
        expect(next.notice?.message).toMatch(/rejected/i)
    })

    it('clears the error when a moderation starts, and surfaces its failure', () => {
        const requested = studentReducer(
            { ...base(), error: 'stale' },
            moderateTestimonialRequested({ id: 3, status: 'Approved' })
        )
        expect(requested.error).toBeNull()

        const failed = studentReducer(
            base(),
            moderateTestimonialFailed('oops')
        )
        expect(failed.error).toBe('oops')
    })

    it('deleting removes it from both lists', () => {
        const start = {
            ...base(),
            pendingTestimonials: [pending],
            testimonials: [approved],
        }
        const cleared = studentReducer(
            { ...start, error: 'stale' },
            deleteTestimonialRequested(1)
        )
        expect(cleared.error).toBeNull()

        const next = studentReducer(start, deleteTestimonialSucceeded(1))
        expect(next.testimonials).toEqual([])
        expect(next.pendingTestimonials).toEqual([pending])
        expect(next.notice?.message).toMatch(/deleted/i)

        const failed = studentReducer(base(), deleteTestimonialFailed('no'))
        expect(failed.error).toBe('no')
    })
})

describe('testimonial sagas', () => {
    it('loads approved reviews', () => {
        const gen = loadTestimonialsSaga()
        expect(gen.next().value).toEqual(call(fetchApprovedTestimonials))
        expect(gen.next([approved]).value).toEqual(
            put(fetchTestimonialsSucceeded([approved]))
        )
        expect(gen.next().done).toBe(true)
    })

    it('reports an approved-load failure', () => {
        const gen = loadTestimonialsSaga()
        gen.next()
        expect(gen.throw(new Error('x')).value).toEqual(
            put(fetchTestimonialsFailed('x'))
        )
    })

    it('loads the pending queue', () => {
        const gen = loadPendingTestimonialsSaga()
        expect(gen.next().value).toEqual(call(fetchPendingTestimonials))
        expect(gen.next([pending]).value).toEqual(
            put(fetchPendingTestimonialsSucceeded([pending]))
        )
    })

    it('reports a pending-load failure with the generic message', () => {
        const gen = loadPendingTestimonialsSaga()
        gen.next()
        expect(gen.throw('boom').value).toEqual(
            put(fetchPendingTestimonialsFailed('Failed to load data'))
        )
    })

    it('submits a review', () => {
        const gen = submitTestimonialSaga(submitTestimonialRequested(input))
        expect(gen.next().value).toEqual(call(submitTestimonial, input))
        expect(gen.next().value).toEqual(put(submitTestimonialSucceeded()))
        expect(gen.next().done).toBe(true)
    })

    it('reports a submission failure', () => {
        const gen = submitTestimonialSaga(submitTestimonialRequested(input))
        gen.next()
        expect(gen.throw(new Error('503')).value).toEqual(
            put(submitTestimonialFailed('Could not submit your review: 503'))
        )
    })

    it('falls back to a readable submission message', () => {
        const gen = submitTestimonialSaga(submitTestimonialRequested(input))
        gen.next()
        expect(gen.throw('kaboom').value).toEqual(
            put(submitTestimonialFailed('Could not submit your review.'))
        )
    })

    it('moderates a review', () => {
        const gen = moderateTestimonialSaga(
            moderateTestimonialRequested({ id: 3, status: 'Approved' })
        )
        expect(gen.next().value).toEqual(
            call(setTestimonialStatus, 3, 'Approved')
        )
        const moderated = { ...pending, status: 'Approved' as const }
        expect(gen.next(moderated).value).toEqual(
            put(moderateTestimonialSucceeded(moderated))
        )
    })

    it('reports a moderation failure', () => {
        const gen = moderateTestimonialSaga(
            moderateTestimonialRequested({ id: 3, status: 'Rejected' })
        )
        gen.next()
        expect(gen.throw(new Error('nope')).value).toEqual(
            put(moderateTestimonialFailed('Could not update the review: nope'))
        )
    })

    it('falls back to a readable moderation message', () => {
        const gen = moderateTestimonialSaga(
            moderateTestimonialRequested({ id: 3, status: 'Rejected' })
        )
        gen.next()
        expect(gen.throw('kaboom').value).toEqual(
            put(moderateTestimonialFailed('Could not update the review.'))
        )
    })

    // REQ-059 — choosing a review for Home.
    it('features a review', () => {
        const gen = featureTestimonialSaga(
            featureTestimonialRequested({ id: 1, featured: true })
        )
        expect(gen.next().value).toEqual(call(setTestimonialFeatured, 1, true))
        const featured = { ...approved, featured: true }
        expect(gen.next(featured).value).toEqual(
            put(featureTestimonialSucceeded(featured))
        )
    })

    // The API's refusal says which rule was hit ("Only 5 reviews can be shown
    // on Home"), so it is shown as-is rather than wrapped in a generic line.
    it('passes the API refusal through unchanged', () => {
        const gen = featureTestimonialSaga(
            featureTestimonialRequested({ id: 1, featured: true })
        )
        gen.next()
        expect(
            gen.throw(new Error('Only 5 reviews can be shown on Home.')).value
        ).toEqual(
            put(featureTestimonialFailed('Only 5 reviews can be shown on Home.'))
        )
    })

    it('falls back to a readable message when the throw is not an Error', () => {
        const gen = featureTestimonialSaga(
            featureTestimonialRequested({ id: 1, featured: false })
        )
        gen.next()
        expect(gen.throw('kaboom').value).toEqual(
            put(featureTestimonialFailed('Could not update the home page.'))
        )
    })

    it('replaces the review in the approved list, in place', () => {
        const start = {
            ...base(),
            testimonials: [approved, { ...approved, id: 2 }],
        }

        const state = studentReducer(
            start,
            featureTestimonialSucceeded({ ...approved, featured: true })
        )

        expect(state.testimonials.map((item) => item.id)).toEqual([1, 2])
        expect(state.testimonials[0].featured).toBe(true)
        expect(state.notice?.message).toMatch(/added to the home page/i)
    })

    it('says so when a review comes off the home page', () => {
        const start = {
            ...base(),
            testimonials: [{ ...approved, featured: true }],
        }

        const state = studentReducer(
            start,
            featureTestimonialSucceeded(approved)
        )

        expect(state.testimonials[0].featured).toBeUndefined()
        expect(state.notice?.message).toMatch(/removed from the home page/i)
    })

    it('records a feature failure as an error', () => {
        const state = studentReducer(
            base(),
            featureTestimonialFailed('Only 5 reviews can be shown on Home.')
        )

        expect(state.error).toBe('Only 5 reviews can be shown on Home.')
    })

    it('clears the error when a feature request starts', () => {
        const state = studentReducer(
            { ...base(), error: 'old' },
            featureTestimonialRequested({ id: 1, featured: true })
        )

        expect(state.error).toBeNull()
    })

    it('deletes a review', () => {
        const gen = deleteTestimonialSaga(deleteTestimonialRequested(3))
        expect(gen.next().value).toEqual(call(deleteTestimonial, 3))
        expect(gen.next(3).value).toEqual(put(deleteTestimonialSucceeded(3)))
        expect(gen.next().done).toBe(true)
    })

    it('reports a delete failure', () => {
        const gen = deleteTestimonialSaga(deleteTestimonialRequested(3))
        gen.next()
        expect(gen.throw(new Error('gone')).value).toEqual(
            put(deleteTestimonialFailed('Could not delete the review: gone'))
        )
    })

    it('falls back to a readable delete message', () => {
        const gen = deleteTestimonialSaga(deleteTestimonialRequested(3))
        gen.next()
        expect(gen.throw('kaboom').value).toEqual(
            put(deleteTestimonialFailed('Could not delete the review.'))
        )
    })
})
