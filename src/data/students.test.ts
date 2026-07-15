import { describe, expect, it } from 'vitest'
import { activeSessions, type ScheduledSession } from './students'

const session = (
    id: number,
    status: ScheduledSession['status']
): ScheduledSession => ({
    id,
    studentId: 1,
    studentName: 'Asha Perera',
    year: '10',
    subject: 'Mathematics',
    date: '2026-07-20',
    time: '16:00',
    notes: '',
    status,
})

describe('activeSessions', () => {
    it('drops cancelled classes and keeps the rest', () => {
        const result = activeSessions([
            session(1, 'Scheduled'),
            session(2, 'Cancelled'),
            session(3, 'Scheduled'),
        ])

        expect(result.map((item) => item.id)).toEqual([1, 3])
    })

    it('returns nothing when every class is cancelled', () => {
        expect(activeSessions([session(1, 'Cancelled')])).toEqual([])
    })

    it('leaves an already-clean list untouched', () => {
        const sessions = [session(1, 'Scheduled')]
        expect(activeSessions(sessions)).toEqual(sessions)
    })
})
