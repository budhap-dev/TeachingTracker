/**
 * Renders a YYYY-MM-DD key as a long, human date.
 *
 * Splits the key by hand rather than `new Date(key)`: that parses as UTC, which
 * in any timezone behind UTC renders the previous day — the same off-by-one the
 * planner's grid avoids by building days at local midnight.
 */
export const formatDayLabel = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

/**
 * Shades a calendar day by how many classes it holds, so a month's load reads
 * at a glance rather than needing to be counted.
 */
export const bookedLevelClass = (count: number): string => {
    if (count === 0) return ''
    if (count === 1) return 'booked booked-light'
    if (count <= 3) return 'booked booked-medium'
    return 'booked booked-heavy'
}
