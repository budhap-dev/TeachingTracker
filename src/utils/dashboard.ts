import type { ScheduledSession, Student } from '../data/students'
import { activeSessions } from '../data/students'
import { toDateKey } from './calendar'
import { groupDaySessions } from './sessionGroups'

/** A student in a progress band — enough to name and open their page. */
export type BandStudent = { id: number; name: string }

/**
 * Students split by how their progress is tracking, for the dashboard. Each
 * band carries its students so hovering a bar can name them; needs-attention is
 * worst first, the others alphabetical.
 */
export type ProgressBands = {
    onTrack: BandStudent[]
    developing: BandStudent[]
    needsAttention: BandStudent[]
    total: number
}

/** Below this, a student needs attention; at or above `onTrackAt`, on track. */
const developingAt = 40
const onTrackAt = 70

/** Buckets students by progress so the dashboard can surface who to follow up with. */
export const getProgressBands = (students: Student[]): ProgressBands => {
    type Scored = BandStudent & { progress: number }
    const onTrack: Scored[] = []
    const developing: Scored[] = []
    const needsAttention: Scored[] = []
    students.forEach((student) => {
        const entry: Scored = {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            progress: student.progress,
        }
        if (student.progress >= onTrackAt) {
            onTrack.push(entry)
        } else if (student.progress >= developingAt) {
            developing.push(entry)
        } else {
            needsAttention.push(entry)
        }
    })
    const byName = (left: Scored, right: Scored) =>
        left.name.localeCompare(right.name)
    const strip = (band: Scored[]) => band.map(({ id, name }) => ({ id, name }))
    return {
        onTrack: strip([...onTrack].sort(byName)),
        developing: strip([...developing].sort(byName)),
        // Worst first, so the most urgent follow-up leads the list.
        needsAttention: strip(
            [...needsAttention].sort(
                (left, right) =>
                    left.progress - right.progress || byName(left, right)
            )
        ),
        total: students.length,
    }
}

/** A day's teaching load, for the week-at-a-glance chart. */
export type DayLoad = {
    dateKey: string
    /** Mon, Tue, … */
    label: string
    classes: number
    minutes: number
    isToday: boolean
}

/** Renders minutes as teaching hours: 90 -> "1.5 hrs", 60 -> "1 hr". */
export const formatHours = (minutes: number): string => {
    const hours = minutes / 60
    const rounded = Math.round(hours * 10) / 10
    return `${rounded} ${rounded === 1 ? 'hr' : 'hrs'}`
}

/** Total minutes across a set of classes (missing durations count as none). */
export const totalMinutes = (sessions: ScheduledSession[]): number =>
    sessions.reduce(
        (sum, session) =>
            sum +
            (Number.isFinite(session.durationMinutes)
                ? session.durationMinutes
                : 0),
        0
    )

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * This week's load, Monday to Sunday, from the classes still on. Built from
 * local dates (never toISOString) so the week doesn't shift near midnight.
 */
export const getWeekLoad = (
    sessions: ScheduledSession[],
    today: Date
): DayLoad[] => {
    const monday = new Date(
        today.getFullYear(),
        today.getMonth(),
        // getDay(): Sunday is 0, so shift it to the end of the week.
        today.getDate() - ((today.getDay() + 6) % 7)
    )
    const todayKey = toDateKey(today)
    const active = activeSessions(sessions)

    return weekdayLabels.map((label, index) => {
        const day = new Date(
            monday.getFullYear(),
            monday.getMonth(),
            monday.getDate() + index
        )
        const dateKey = toDateKey(day)
        // Entries, not rows: a group class is one hour of teaching however
        // many students sit in it.
        const entries = groupDaySessions(
            active.filter((session) => session.date === dateKey)
        )
        return {
            dateKey,
            label,
            classes: entries.length,
            minutes: totalMinutes(entries.map((entry) => entry.lead)),
            isToday: dateKey === todayKey,
        }
    })
}
