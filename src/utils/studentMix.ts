import type { Student } from '../data/students'

export type YearSlice = {
    label: string
    value: number
}

/**
 * Groups students by year for the dashboard chart.
 *
 * Every student is counted exactly once, so the slices genuinely sum to the
 * total — which is what makes a donut honest here. Years sort numerically, so
 * the one-hue ramp runs in the order a reader expects.
 */
export const groupStudentsByYear = (students: Student[]): YearSlice[] => {
    const byYear = new Map<string, number>()

    students.forEach((student) => {
        const year = student.year || 'Unassigned'
        byYear.set(year, (byYear.get(year) ?? 0) + 1)
    })

    return [...byYear.entries()]
        .sort(([left], [right]) =>
            left.localeCompare(right, undefined, { numeric: true })
        )
        .map(([year, value]) => ({
            label: year === 'Unassigned' ? year : `Year ${year}`,
            value,
        }))
}
