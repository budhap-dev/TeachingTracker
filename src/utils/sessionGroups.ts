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

/** How the entry reads in chips and tooltips. */
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
