import { apiRequest } from './client'
import type { Reminder, ReminderInput } from '../data/students'

/** GET /reminders — teacher: the notes-to-self, in reading order (REQ-057). */
export const fetchReminders = (): Promise<Reminder[]> =>
    apiRequest<Reminder[]>('/reminders')

/** POST /reminders — write one. */
export const createReminder = (input: ReminderInput): Promise<Reminder> =>
    apiRequest<Reminder>('/reminders', { method: 'POST', body: input })

/** PUT /reminders/:id — change one. */
export const updateReminder = (
    id: number,
    input: ReminderInput
): Promise<Reminder> =>
    apiRequest<Reminder>(`/reminders/${id}`, { method: 'PUT', body: input })

/** DELETE /reminders/:id — forget one. Idempotent server-side. */
export const deleteReminder = (id: number): Promise<void> =>
    apiRequest<void>(`/reminders/${id}`, { method: 'DELETE' })
