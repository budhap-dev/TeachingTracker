import { describe, expect, it } from 'vitest'
import type { Student } from '../data/students'
import { groupStudentsByYear } from './studentMix'

const student = (id: number, year: string): Student =>
    ({ id, year }) as Student

describe('groupStudentsByYear', () => {
    it('counts each student exactly once, so the slices sum to the total', () => {
        const students = [
            student(1, '10'),
            student(2, '9'),
            student(3, '10'),
            student(4, '11'),
        ]

        const slices = groupStudentsByYear(students)

        expect(slices.reduce((sum, slice) => sum + slice.value, 0)).toBe(
            students.length
        )
        expect(slices).toEqual([
            { label: 'Year 9', value: 1 },
            { label: 'Year 10', value: 2 },
            { label: 'Year 11', value: 1 },
        ])
    })

    it('sorts years numerically, not as text', () => {
        const slices = groupStudentsByYear([
            student(1, '11'),
            student(2, '9'),
            student(3, '8'),
            student(4, '10'),
        ])

        // '10' must not sort before '9' the way a plain string compare would.
        expect(slices.map((slice) => slice.label)).toEqual([
            'Year 8',
            'Year 9',
            'Year 10',
            'Year 11',
        ])
    })

    it('gathers students with no year rather than dropping them', () => {
        const slices = groupStudentsByYear([student(1, ''), student(2, '10')])

        expect(slices).toContainEqual({ label: 'Unassigned', value: 1 })
        expect(slices.reduce((sum, slice) => sum + slice.value, 0)).toBe(2)
    })

    it('returns nothing when there are no students', () => {
        expect(groupStudentsByYear([])).toEqual([])
    })
})
