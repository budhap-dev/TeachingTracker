/**
 * Class notes, read date-wise (REQ-052).
 *
 * The teacher writes notes while booking or editing a class; reading them
 * back meant opening each class in turn. These helpers fold the sessions
 * already in the store into a chronological read — newest first, classes
 * without notes left out.
 */

import type { ScheduledSession } from '../data/students'
import { groupDaySessions, type DayEntry } from './sessionGroups'

/** One note as it reads in the list: a class, and what was written on it. */
export type ClassNote = {
    /** Stable identity for the row: the entry key plus the note's owner. */
    key: string
    /** The day it belongs to, YYYY-MM-DD. */
    date: string
    /** The planner entry, so a row can open exactly that class. */
    entryKey: string
    time: string
    subject: string
    /** Who the class was with — a name, or the group's names. */
    who: string
    note: string
    /** A cancelled class keeps its notes; the row says so rather than
        pretending the class still stands. */
    isCancelled: boolean
}

/** A day's worth of notes, in the order the classes ran. */
export type ClassNoteDay = { date: string; notes: ClassNote[] }

const noteOf = (session: ScheduledSession): string => session.notes.trim()

/**
 * The notes on one planner entry. A group class usually carries the same
 * note on every linked row, so it reads once under the group's name; when
 * members genuinely differ, each is shown against the student it belongs
 * to rather than silently dropping one.
 */
const entryNotes = (entry: DayEntry): ClassNote[] => {
    const written = entry.sessions.filter((session) => noteOf(session))
    if (!written.length) {
        return []
    }
    const distinct = new Set(written.map(noteOf))
    const shared = distinct.size === 1 && written.length === entry.sessions.length
    const base = {
        date: entry.lead.date,
        entryKey: entry.key,
        time: entry.lead.time,
        subject: entry.lead.subject,
    }

    if (shared) {
        return [
            {
                ...base,
                key: entry.key,
                who: entry.isGroup
                    ? entry.sessions
                          .map((session) => session.studentName)
                          .join(', ')
                    : entry.lead.studentName,
                note: noteOf(written[0]),
                isCancelled: entry.sessions.every(
                    (session) => session.status === 'Cancelled'
                ),
            },
        ]
    }

    return written.map((session) => ({
        ...base,
        key: `${entry.key}-${session.id}`,
        who: session.studentName,
        note: noteOf(session),
        isCancelled: session.status === 'Cancelled',
    }))
}

/**
 * Every class note, grouped by day and newest day first; within a day the
 * classes read in the order they ran. Days with nothing written never
 * appear, so the list is notes, not a diary of empty classes.
 */
export const groupNotesByDate = (
    sessions: ScheduledSession[]
): ClassNoteDay[] => {
    const byDate = new Map<string, ScheduledSession[]>()
    sessions.forEach((session) => {
        byDate.set(session.date, [...(byDate.get(session.date) ?? []), session])
    })

    return [...byDate.entries()]
        .map(([date, daySessions]) => ({
            date,
            notes: groupDaySessions(daySessions).flatMap(entryNotes),
        }))
        .filter((day) => day.notes.length > 0)
        .sort((left, right) => right.date.localeCompare(left.date))
}
