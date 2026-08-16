import { describe, expect, it } from 'vitest'
import {
    chooseHomeReviews,
    HOME_REVIEW_COUNT,
    isClipped,
    quoteLength,
} from './homeReviews'
import type { Testimonial } from '../data/students'

const review = (overrides: Partial<Testimonial> = {}): Testimonial => ({
    id: 1,
    authorName: 'Nadia D.',
    role: 'Parent',
    rating: 5,
    quote: 'My daughter went from dreading maths to volunteering answers.',
    status: 'Approved',
    submittedOn: '2026-05-12',
    ...overrides,
})

describe('chooseHomeReviews (REQ-059)', () => {
    it("shows the teacher's picks when there are any", () => {
        const chosen = chooseHomeReviews([
            review({ id: 1 }),
            review({ id: 2, featured: true }),
            review({ id: 3, featured: true }),
        ])

        expect(chosen.map((item) => item.id)).toEqual([2, 3])
    })

    it('falls back to the newest approved reviews when none are picked', () => {
        const chosen = chooseHomeReviews(
            Array.from({ length: HOME_REVIEW_COUNT + 2 }, (_, index) =>
                review({ id: index + 1 })
            )
        )

        expect(chosen.map((item) => item.id)).toEqual(
            Array.from({ length: HOME_REVIEW_COUNT }, (_, index) => index + 1)
        )
    })

    it('never shows more than the cap, however many are picked', () => {
        const chosen = chooseHomeReviews(
            Array.from({ length: HOME_REVIEW_COUNT + 2 }, (_, index) =>
                review({ id: index + 1, featured: true })
            )
        )

        expect(chosen).toHaveLength(HOME_REVIEW_COUNT)
    })
})

describe('quoteLength', () => {
    it('buckets by length rather than sizing per character', () => {
        expect(quoteLength('Reliable, patient and genuinely invested.')).toBe(
            'short'
        )
        expect(quoteLength('x'.repeat(200))).toBe('mid')
        expect(quoteLength('x'.repeat(400))).toBe('long')
        // The boundaries themselves, so a swap of a few words can't silently
        // move a card into a different type size.
        expect(quoteLength('x'.repeat(80))).toBe('short')
        expect(quoteLength('x'.repeat(81))).toBe('mid')
        expect(quoteLength('x'.repeat(300))).toBe('mid')
        expect(quoteLength('x'.repeat(301))).toBe('long')
    })
})

describe('isClipped', () => {
    it('is about what fits the card, not about the type size', () => {
        expect(isClipped('Reliable, patient and genuinely invested.')).toBe(
            false
        )
        expect(isClipped('x'.repeat(130))).toBe(false)
        expect(isClipped('x'.repeat(131))).toBe(true)
    })

    // The first build only offered a way through to reviews over 300, so a
    // 200-character one was cut off mid-sentence with no way to read the rest.
    // Found in a browser, not in a test — hence this test.
    it('catches a middling quote that still overflows its card', () => {
        const middling = 'x'.repeat(200)

        expect(quoteLength(middling)).toBe('mid')
        expect(isClipped(middling)).toBe(true)
    })
})
