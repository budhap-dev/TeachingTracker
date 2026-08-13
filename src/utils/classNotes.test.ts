import { describe, expect, it } from 'vitest'
import { groupNotesByDate } from './classNotes'
import type { ScheduledSession } from '../data/students'

const session = (
    overrides: Partial<ScheduledSession> & { id: number }
): ScheduledSession => ({
    studentId: 1,
    studentName: 'Asha Perera',
    year: '10',
    subject: 'Mathematics',
    date: '2026-09-01',
    time: '16:00',
    durationMinutes: 60,
    notes: '',
    status: 'Scheduled',
    ...overrides,
})

describe('groupNotesByDate', () => {
    it('reads newest day first, and classes within a day in running order', () => {
        const days = groupNotesByDate([
            session({ id: 1, date: '2026-09-01', time: '16:00', notes: 'Ratios' }),
            session({ id: 2, date: '2026-09-03', time: '09:00', notes: 'Vectors' }),
            session({ id: 3, date: '2026-09-01', time: '09:00', notes: 'Algebra' }),
        ])

        expect(days.map((day) => day.date)).toEqual([
            '2026-09-03',
            '2026-09-01',
        ])
        expect(days[1].notes.map((note) => note.note)).toEqual([
            'Algebra',
            'Ratios',
        ])
    })

    it('leaves out classes with nothing written, and days that are all empty', () => {
        const days = groupNotesByDate([
            session({ id: 1, date: '2026-09-01', notes: '' }),
            // Whitespace is nothing written.
            session({ id: 2, date: '2026-09-02', notes: '   ' }),
            session({ id: 3, date: '2026-09-03', notes: 'Kept' }),
        ])

        expect(days).toHaveLength(1)
        expect(days[0].date).toBe('2026-09-03')
    })

    it('treats the planner’s own placeholder as nothing written', () => {
        const days = groupNotesByDate([
            session({ id: 1, notes: 'Scheduled from the class planner' }),
            // Case and padding are the same placeholder.
            session({ id: 2, date: '2026-09-02', notes: '  scheduled from the class planner  ' }),
            // A note that merely mentions it is still the teacher's own.
            session({
                id: 3,
                date: '2026-09-03',
                notes: 'Scheduled from the class planner after the reshuffle — check ratios',
            }),
        ])

        expect(days).toHaveLength(1)
        expect(days[0].date).toBe('2026-09-03')
    })

    it('reads a group class once, under everyone in it', () => {
        const days = groupNotesByDate([
            session({
                id: 1,
                groupId: 'g1',
                studentName: 'Asha Perera',
                notes: 'Past paper 3',
            }),
            session({
                id: 2,
                groupId: 'g1',
                studentId: 2,
                studentName: 'Nimal Perera',
                notes: 'Past paper 3',
            }),
        ])

        expect(days[0].notes).toHaveLength(1)
        expect(days[0].notes[0].who).toBe('Asha Perera, Nimal Perera')
        expect(days[0].notes[0].note).toBe('Past paper 3')
    })

    it('keeps both when a group class carries different notes per student', () => {
        const days = groupNotesByDate([
            session({ id: 1, groupId: 'g1', notes: 'Confident on ratios' }),
            session({
                id: 2,
                groupId: 'g1',
                studentId: 2,
                studentName: 'Nimal Perera',
                notes: 'Needs another go at ratios',
            }),
        ])

        expect(days[0].notes.map((note) => note.who)).toEqual([
            'Asha Perera',
            'Nimal Perera',
        ])
        // Distinct keys, or React would collapse the rows.
        expect(new Set(days[0].notes.map((note) => note.key)).size).toBe(2)
    })

    it('keeps a cancelled class’s notes, and says it was cancelled', () => {
        const days = groupNotesByDate([
            session({ id: 1, notes: 'Rescheduled after illness', status: 'Cancelled' }),
        ])

        expect(days[0].notes[0].isCancelled).toBe(true)
        expect(days[0].notes[0].note).toBe('Rescheduled after illness')
    })

    it('carries what a row needs to name the class and open it', () => {
        const days = groupNotesByDate([
            session({ id: 7, subject: 'Chemistry', time: '11:30', notes: 'Titration' }),
        ])

        expect(days[0].notes[0]).toMatchObject({
            date: '2026-09-01',
            time: '11:30',
            subject: 'Chemistry',
            who: 'Asha Perera',
            entryKey: 'solo-7',
        })
    })
})
