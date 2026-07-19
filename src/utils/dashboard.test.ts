import { describe, expect, it } from 'vitest'
import type { ScheduledSession, Student } from '../data/students'
import {
    formatHours,
    getProgressBands,
    getWeekLoad,
    totalMinutes,
} from './dashboard'

const student = (id: number, progress: number, name = `S${id}`): Student =>
    ({
        id,
        firstName: name,
        lastName: 'Test',
        progress,
    }) as unknown as Student

const session = (
    id: number,
    overrides: Partial<ScheduledSession> = {}
): ScheduledSession => ({
    id,
    studentId: 1,
    studentName: 'Asha Perera',
    year: '10',
    subject: 'Mathematics',
    date: '2026-07-16',
    time: '09:30',
    durationMinutes: 60,
    notes: '',
    status: 'Scheduled',
    ...overrides,
})

describe('getProgressBands', () => {
    it('buckets students by progress, names each band, worst attention first', () => {
        const bands = getProgressBands([
            student(1, 90, 'Onya'), // on track (>= 70)
            student(2, 70, 'Trey'), // on track (boundary)
            student(3, 55, 'Devi'), // developing (40–69)
            student(4, 40, 'Della'), // developing (boundary)
            student(5, 30, 'Flo'), // needs attention (< 40)
            student(6, 10, 'Zed'), // needs attention, worst
        ])

        // Non-attention bands read alphabetically.
        expect(bands.onTrack.map((s) => s.name)).toEqual([
            'Onya Test',
            'Trey Test',
        ])
        expect(bands.developing.map((s) => s.name)).toEqual([
            'Della Test',
            'Devi Test',
        ])
        // Worst progress leads the needs-attention list.
        expect(bands.needsAttention).toEqual([
            { id: 6, name: 'Zed Test' },
            { id: 5, name: 'Flo Test' },
        ])
        expect(bands.total).toBe(6)
    })

    it('ties in the attention list break by name, and an empty roster is empty bands', () => {
        const tied = getProgressBands([
            student(2, 20, 'Beau'),
            student(1, 20, 'Ana'),
        ])
        expect(tied.needsAttention.map((s) => s.name)).toEqual([
            'Ana Test',
            'Beau Test',
        ])

        expect(getProgressBands([])).toEqual({
            onTrack: [],
            developing: [],
            needsAttention: [],
            total: 0,
        })
    })
})

describe('formatHours', () => {
    it('speaks in teaching hours', () => {
        expect(formatHours(60)).toBe('1 hr')
        expect(formatHours(90)).toBe('1.5 hrs')
        expect(formatHours(150)).toBe('2.5 hrs')
        expect(formatHours(0)).toBe('0 hrs')
    })
})

describe('totalMinutes', () => {
    it('sums durations and shrugs off records without one', () => {
        const legacy = session(2)
        delete (legacy as Partial<ScheduledSession>).durationMinutes
        expect(totalMinutes([session(1), legacy])).toBe(60)
    })
})

describe('getWeekLoad', () => {
    it('builds Monday to Sunday around today, counting only active classes', () => {
        // 2026-07-16 is a Thursday.
        const week = getWeekLoad(
            [
                session(1, { date: '2026-07-13', durationMinutes: 90 }),
                session(2, { date: '2026-07-16' }),
                session(3, { date: '2026-07-16', time: '16:00' }),
                session(4, { date: '2026-07-16', status: 'Cancelled' }),
                session(5, { date: '2026-07-19', durationMinutes: 30 }),
                session(6, { date: '2026-07-20' }), // next week: out
            ],
            new Date(2026, 6, 16)
        )

        expect(week.map((day) => day.label)).toEqual([
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
            'Sun',
        ])
        expect(week[0]).toMatchObject({
            dateKey: '2026-07-13',
            classes: 1,
            minutes: 90,
        })
        expect(week[3]).toMatchObject({
            dateKey: '2026-07-16',
            classes: 2,
            minutes: 120,
            isToday: true,
        })
        expect(week[6]).toMatchObject({ dateKey: '2026-07-19', minutes: 30 })
    })

    it('treats Sunday as the end of the week, not the start of the next', () => {
        // 2026-07-19 is a Sunday: its week still starts Monday the 13th.
        const week = getWeekLoad([], new Date(2026, 6, 19))
        expect(week[0].dateKey).toBe('2026-07-13')
        expect(week[6]).toMatchObject({
            dateKey: '2026-07-19',
            isToday: true,
        })
    })
})
