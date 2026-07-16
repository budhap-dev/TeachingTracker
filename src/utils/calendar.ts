/**
 * Formats a Date as YYYY-MM-DD in the *local* calendar.
 *
 * Deliberately not `toISOString()`: that formats in UTC, so anywhere behind UTC
 * it yields tomorrow, and anywhere ahead of it (e.g. BST after midnight) it
 * yields yesterday — putting classes on the wrong day and misjudging "today".
 */
export const toDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
    ).padStart(2, '0')}`

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

/** Renders a YYYY-MM-DD key as a short date (`20 Jul 2026`), parsed locally. */
export const formatShortDayLabel = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

/** Class lengths the planner offers, in minutes. */
export const durationOptions = [30, 60, 90, 120] as const

/**
 * Renders a duration in minutes the way a teacher says it. Empty for a class
 * that has no usable duration (e.g. booked before durations existed) — callers
 * skip the field rather than print "NaN hours".
 */
export const formatDuration = (minutes: number): string => {
    if (!Number.isFinite(minutes) || minutes <= 0) return ''
    if (minutes === 30) return '30 mins'
    if (minutes % 60 === 0)
        return `${minutes / 60} ${minutes === 60 ? 'hour' : 'hours'}`
    return `${minutes / 60} hours`
}
