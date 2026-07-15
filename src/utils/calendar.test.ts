import { describe, expect, it } from 'vitest'
import { bookedLevelClass } from './calendar'

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
