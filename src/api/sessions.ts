import type { ScheduledSession } from '../data/students'
import { apiRequest } from './client'

/** Payload for scheduling a class. The API fills in name/year from the student. */
export type SessionInput = Omit<ScheduledSession, 'id'>

/** GET /sessions — scheduled classes, date-ordered. */
export const fetchSessions = (): Promise<ScheduledSession[]> =>
    apiRequest<ScheduledSession[]>('/sessions')

/** POST /sessions — schedules a new class. */
export const createSession = (
    input: SessionInput
): Promise<ScheduledSession> =>
    apiRequest<ScheduledSession>('/sessions', { method: 'POST', body: input })
