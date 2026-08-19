import { describe, expect, it } from 'vitest'
import { hasPassed, splitReminders } from './reminders'
import type { Reminder } from '../data/students'

const at = (date: string, time?: string): Reminder => ({
    id: 1,
    date,
    ...(time ? { time } : {}),
    text: 'Something',
})

// Local, not UTC: the teacher's Thursday is the one their phone shows them.
const clock = (iso: string) => new Date(iso)

describe('hasPassed', () => {
    const now = clock('2026-08-18T15:30:00')

    it('is past once a timed reminder’s time has gone', () => {
        expect(hasPassed(at('2026-08-18', '15:29'), now)).toBe(true)
        expect(hasPassed(at('2026-08-18', '15:30'), now)).toBe(false)
        expect(hasPassed(at('2026-08-18', '15:31'), now)).toBe(false)
    })

    // "Thursday" is a real reminder. Treating a missing time as midnight would
    // retire it before Thursday had started.
    it('keeps an untimed reminder for the whole of its day', () => {
        expect(hasPassed(at('2026-08-18'), now)).toBe(false)
        expect(hasPassed(at('2026-08-17'), now)).toBe(true)
    })

    it('ignores the time on any day but today', () => {
        expect(hasPassed(at('2026-08-17', '23:59'), now)).toBe(true)
        expect(hasPassed(at('2026-08-19', '00:01'), now)).toBe(false)
    })

    it('reads the clock locally, not in UTC', () => {
        // 00:30 local on the 19th is still the 18th in UTC; a reminder for the
        // 18th has passed on the teacher's clock even so.
        const justAfterMidnight = new Date(2026, 7, 19, 0, 30)
        expect(hasPassed(at('2026-08-18', '09:00'), justAfterMidnight)).toBe(
            true
        )
    })
})

describe('splitReminders', () => {
    const now = clock('2026-08-18T15:30:00')

    it('separates what is coming from what has gone', () => {
        const { upcoming, past } = splitReminders(
            [
                at('2026-08-17'),
                at('2026-08-18', '09:00'),
                at('2026-08-18', '17:00'),
                at('2026-08-20'),
            ],
            now
        )

        expect(upcoming.map((r) => r.date + (r.time ?? ''))).toEqual([
            '2026-08-1817:00',
            '2026-08-20',
        ])
        expect(past).toHaveLength(2)
    })

    // Newest first, so the most recently missed is met first.
    it('puts the most recent past reminder at the top', () => {
        const { past } = splitReminders(
            [at('2026-07-01'), at('2026-08-17'), at('2026-08-10')],
            now
        )

        expect(past.map((r) => r.date)).toEqual([
            '2026-08-17',
            '2026-08-10',
            '2026-07-01',
        ])
    })

    it('copes with nothing at all', () => {
        expect(splitReminders([], now)).toEqual({ upcoming: [], past: [] })
    })
})
