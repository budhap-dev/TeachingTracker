import type { ScheduledSession } from '../data/students'

/**
 * One thing on a day: a solo class, or a group class made of linked rows
 * (sessions sharing a groupId). The planner's chips, tooltips and day modal
 * all count and number entries, never raw rows — a group is one class.
 */
export type DayEntry = {
    /** Stable identity: the groupId, or the solo row's id. */
    key: string
    /** Every linked row; exactly one for a solo class. */
    sessions: ScheduledSession[]
    /** The row shared fields are read from. */
    lead: ScheduledSession
    isGroup: boolean
}

/** Rows of an entry that are still on. */
export const activeMembers = (entry: DayEntry): ScheduledSession[] =>
    entry.sessions.filter((session) => session.status !== 'Cancelled')

/**
 * Who the class is FOR — the students still on it, or, when every one of
 * them is off, the students it was booked for.
 *
 * Removing a student from a group class cancels their row rather than
 * deleting it: the row is the record that they were booked. So counting
 * `entry.sessions` counts people who are not coming, and the day modal read
 * "Edit group class (3 students)" over a field holding two (prod report,
 * 2026-08-15). Every count and name the teacher reads comes from here.
 *
 * The fallback matters: a wholly cancelled class reading "Group of 0" would
 * look like a bug, and the modal would open on an empty field instead of the
 * names it was for.
 *
 * Not the same as `entryTitle`, deliberately: the calendar's tooltip names
 * the whole booking BECAUSE it also says "1 of 2 cancelled" underneath. The
 * day modal has no such line — its count sits straight above the field
 * listing the students, so it must agree with it.
 */
export const entryMembers = (entry: DayEntry): ScheduledSession[] => {
    const active = activeMembers(entry)
    return active.length ? active : entry.sessions
}

/**
 * How the entry reads in chips and tooltips: the WHOLE booking, cancelled
 * members included. On the calendar this sits beside a "1 of 2 cancelled"
 * line that explains the number — see `entryMembers` for the count used
 * where no such line explains it.
 */
export const entryTitle = (entry: DayEntry): string =>
    entry.isGroup
        ? `Group of ${entry.sessions.length} — ${entry.sessions
              .map((session) => session.studentName)
              .join(', ')}`
        : entry.lead.studentName

/**
 * Folds one day's rows into entries, earliest first; group members keep a
 * stable name order so lists read the same everywhere.
 */
export const groupDaySessions = (sessions: ScheduledSession[]): DayEntry[] => {
    const byKey = new Map<string, ScheduledSession[]>()
    sessions.forEach((session) => {
        const key = session.groupId ?? `solo-${session.id}`
        byKey.set(key, [...(byKey.get(key) ?? []), session])
    })

    return [...byKey.entries()]
        .map(([key, members]) => {
            const sorted = [...members].sort((left, right) =>
                left.studentName.localeCompare(right.studentName)
            )
            return {
                key,
                sessions: sorted,
                lead: sorted[0],
                isGroup: sorted.length > 1,
            }
        })
        .sort(
            (left, right) =>
                left.lead.time.localeCompare(right.lead.time) ||
                left.key.localeCompare(right.key)
        )
}
