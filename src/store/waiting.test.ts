import { describe, expect, it } from 'vitest'
import type { RootState } from './store'
import {
    selectNewEnquiries,
    selectPendingReviews,
    selectWaitingTotal,
} from './waiting'
import type { Lead, Testimonial } from '../data/students'

/**
 * The dashboard, the teacher's nav and (REQ-053) the app icon all count from
 * here, so the rules live in one test rather than three.
 */

const lead = (id: number, status: Lead['status']): Lead =>
    ({
        id,
        parentName: `Parent ${id}`,
        contactEmail: 'a@b.c',
        contactPhone: '',
        year: '10',
        subjects: ['Mathematics'],
        goal: 'Confidence',
        mode: 'Online',
        status,
        submittedOn: '2026-08-15',
    }) as Lead

const review = (id: number, flagged = false): Testimonial =>
    ({
        id,
        authorName: `Author ${id}`,
        role: 'Parent',
        quote: 'Kind and patient.',
        status: 'Pending',
        flagged,
        submittedOn: '2026-08-15',
    }) as Testimonial

const state = (leads: Lead[], pending: Testimonial[]) =>
    ({ students: { leads, pendingTestimonials: pending } }) as RootState

describe('what is waiting (REQ-056)', () => {
    it('counts only enquiries nobody has picked up', () => {
        expect(
            selectNewEnquiries(
                state(
                    [lead(1, 'New'), lead(2, 'Contacted'), lead(3, 'New')],
                    []
                )
            )
        ).toBe(2)
    })

    it('counts a flagged review — it is the one most wanting a look', () => {
        expect(
            selectPendingReviews(state([], [review(1), review(2, true)]))
        ).toBe(2)
    })

    it('adds the two for the app icon, which has only one badge', () => {
        expect(
            selectWaitingTotal(
                state([lead(1, 'New'), lead(2, 'New')], [review(1)])
            )
        ).toBe(3)
    })

    it('is zero when nothing is waiting, so nothing is shown', () => {
        expect(selectWaitingTotal(state([lead(1, 'Contacted')], []))).toBe(0)
    })
})
