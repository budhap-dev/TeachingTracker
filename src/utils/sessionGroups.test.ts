import { describe, expect, it } from 'vitest'
import type { ScheduledSession } from '../data/students'
import {
    activeMembers,
    entryMembers,
    entryTitle,
    groupDaySessions,
} from './sessionGroups'

const session = (
    id: number,
    overrides: Partial<ScheduledSession> = {}
): ScheduledSession => ({
    id,
    studentId: id,
    studentName: `Student ${id}`,
    year: '10',
    subject: 'Mathematics',
    date: '2026-07-20',
    time: '10:00',
    durationMinutes: 60,
    notes: '',
    status: 'Scheduled',
    ...overrides,
})

describe('groupDaySessions', () => {
    it('folds linked rows into one entry and keeps solos alone', () => {
        const entries = groupDaySessions([
            session(3, { time: '09:00' }),
            session(1, { groupId: 'grp-1', studentName: 'Zara Ahmed' }),
            session(2, { groupId: 'grp-1', studentName: 'Ava Devlin' }),
        ])

        expect(entries).toHaveLength(2)
        // Earliest first: the 09:00 solo leads.
        expect(entries[0].isGroup).toBe(false)
        expect(entries[0].key).toBe('solo-3')
        // Members sorted by name, lead is the first.
        expect(entries[1].isGroup).toBe(true)
        expect(entries[1].sessions.map((s) => s.studentName)).toEqual([
            'Ava Devlin',
            'Zara Ahmed',
        ])
        expect(entries[1].lead.studentName).toBe('Ava Devlin')
    })

    it('titles entries the way the teacher says them', () => {
        const [solo, group] = groupDaySessions([
            session(1, { time: '09:00' }),
            session(2, { groupId: 'g', studentName: 'Ava Devlin' }),
            session(3, { groupId: 'g', studentName: 'Sam Bailey' }),
        ])
        expect(entryTitle(solo)).toBe('Student 1')
        expect(entryTitle(group)).toBe('Group of 2 — Ava Devlin, Sam Bailey')
    })

    it('breaks a same-time tie by key, so the order is stable', () => {
        // Two classes at the same time — the time compare is a draw, so the
        // key decides. Without the tie-break the order would be undefined.
        const entries = groupDaySessions([
            session(2, { time: '11:00' }),
            session(1, { time: '11:00' }),
        ])
        expect(entries.map((entry) => entry.key)).toEqual(['solo-1', 'solo-2'])
    })

    it('counts and names who is IN the class, not who was (prod, 2026-08-15)', () => {
        // A student removed from a group class leaves a Cancelled row behind
        // — the row is the record that they were booked. Every count the
        // teacher reads must be of the students actually attending, or the
        // day modal says "3 students" over a field holding two.
        const [group] = groupDaySessions([
            session(1, { groupId: 'g', studentName: 'Ava Devlin' }),
            session(2, { groupId: 'g', studentName: 'Sam Bailey' }),
            session(3, {
                groupId: 'g',
                studentName: 'Rick Graham',
                status: 'Cancelled',
            }),
        ])

        expect(entryMembers(group).map((s) => s.studentName)).toEqual([
            'Ava Devlin',
            'Sam Bailey',
        ])
        // The tooltip is the exception, and stays as it was: it names the
        // whole booking because a "1 of 3 cancelled" line sits under it.
        expect(entryTitle(group)).toBe(
            'Group of 3 — Ava Devlin, Rick Graham, Sam Bailey'
        )
    })

    it('a wholly cancelled class still names the students it was for', () => {
        // Nothing is "in" it, but "Group of 0" reads as a bug — the class
        // keeps its identity so the modal opens on names, not an empty field.
        const [group] = groupDaySessions([
            session(1, { groupId: 'g', studentName: 'Ava Devlin', status: 'Cancelled' }),
            session(2, { groupId: 'g', studentName: 'Sam Bailey', status: 'Cancelled' }),
        ])

        expect(entryMembers(group).map((s) => s.studentName)).toEqual([
            'Ava Devlin',
            'Sam Bailey',
        ])
    })

    it('reports which members are still on', () => {
        const [group] = groupDaySessions([
            session(1, { groupId: 'g' }),
            session(2, { groupId: 'g', status: 'Cancelled' }),
        ])
        expect(activeMembers(group).map((s) => s.id)).toEqual([1])
    })
})
