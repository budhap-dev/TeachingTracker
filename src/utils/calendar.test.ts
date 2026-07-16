import { describe, expect, it } from 'vitest'
import { bookedLevelClass, toDateKey, formatDuration, formatShortDayLabel } from './calendar'

describe('toDateKey', () => {
    it('formats a date in the local calendar, zero-padded', () => {
        expect(toDateKey(new Date(2026, 6, 5))).toBe('2026-07-05')
        expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
    })

    it('keeps the local day late at night, where toISOString would not', () => {
        // 23:30 local is already tomorrow in UTC anywhere behind it, and
        // 00:30 local is still yesterday in UTC anywhere ahead of it.
        expect(toDateKey(new Date(2026, 6, 5, 23, 30))).toBe('2026-07-05')
        expect(toDateKey(new Date(2026, 6, 5, 0, 30))).toBe('2026-07-05')
    })
})

describe('bookedLevelClass', () => {
    it('leaves an empty day unshaded', () => {
        expect(bookedLevelClass(0)).toBe('')
    })

    it('shades more heavily as a day fills up', () => {
        expect(bookedLevelClass(1)).toBe('booked booked-light')
        expect(bookedLevelClass(2)).toBe('booked booked-medium')
        expect(bookedLevelClass(3)).toBe('booked booked-medium')
        expect(bookedLevelClass(4)).toBe('booked booked-heavy')
        expect(bookedLevelClass(9)).toBe('booked booked-heavy')
    })
})

describe('formatShortDayLabel', () => {
    it('renders a date key as a short local date', () => {
        expect(formatShortDayLabel('2026-07-20')).toBe('20 Jul 2026')
    })
})

describe('formatDuration', () => {
    it('reads like a teacher says it', () => {
        expect(formatDuration(30)).toBe('30 mins')
        expect(formatDuration(60)).toBe('1 hour')
        expect(formatDuration(90)).toBe('1.5 hours')
        expect(formatDuration(120)).toBe('2 hours')
    })

    it('is empty for a class with no usable duration — never "NaN hours"', () => {
        expect(formatDuration(Number.NaN)).toBe('')
        expect(formatDuration(0)).toBe('')
        expect(formatDuration(undefined as unknown as number)).toBe('')
    })
})
