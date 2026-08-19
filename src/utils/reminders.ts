import type { Reminder } from '../data/students'
import { toDateKey } from './calendar'

/**
 * Whether a reminder has been and gone (REQ-062).
 *
 * A reminder that carries a time passes at that time — "call the school at
 * 3pm" stops being something coming up at 3pm. One without a time belongs to
 * the whole of its day and passes when the day does, because "Thursday" is a
 * real reminder and treating it as midnight would retire it before Thursday
 * had started.
 *
 * Comparing on the local clock, not UTC: the teacher's Thursday is the one
 * their phone shows them.
 */
export const hasPassed = (reminder: Reminder, now: Date): boolean => {
    const today = toDateKey(now)
    if (reminder.date !== today) {
        return reminder.date < today
    }
    if (!reminder.time) {
        // Today, all day — still to come until the day turns over.
        return false
    }
    const clock = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
    ).padStart(2, '0')}`
    return reminder.time < clock
}

/**
 * Splits reminders into what is still coming and what has gone by.
 *
 * Past ones are kept, newest first, so the most recently missed is the one the
 * teacher meets first when they go looking. Nothing is deleted: the retention
 * schedule (REQ-033) says a reminder lives until the teacher deletes it, and
 * that stays the teacher's call.
 */
export const splitReminders = (
    reminders: Reminder[],
    now: Date
): { upcoming: Reminder[]; past: Reminder[] } => {
    const upcoming: Reminder[] = []
    const past: Reminder[] = []
    for (const reminder of reminders) {
        ;(hasPassed(reminder, now) ? past : upcoming).push(reminder)
    }
    past.sort((left, right) =>
        `${right.date} ${right.time ?? ''}`.localeCompare(
            `${left.date} ${left.time ?? ''}`
        )
    )
    return { upcoming, past }
}
