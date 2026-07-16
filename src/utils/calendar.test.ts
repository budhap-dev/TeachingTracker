import { describe, expect, it } from 'vitest'
import { bookedLevelClass, toDateKey } from './calendar'

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
