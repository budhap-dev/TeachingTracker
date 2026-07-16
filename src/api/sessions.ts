import type { ScheduledSession, SessionStatus } from '../data/students'
import { apiRequest } from './client'

/** Payload for scheduling a class. The API fills in name/year and the status. */
export type SessionInput = Omit<ScheduledSession, 'id' | 'status'>

/** GET /sessions — scheduled classes, date-ordered. */
export const fetchSessions = (): Promise<ScheduledSession[]> =>
    apiRequest<ScheduledSession[]>('/sessions')

/** POST /sessions — schedules a new class. */
export const createSession = (
    input: SessionInput
): Promise<ScheduledSession> =>
    apiRequest<ScheduledSession>('/sessions', { method: 'POST', body: input })

/** PUT /sessions/{id} — cancels or un-cancels a class. */
export const updateSessionStatus = (
    id: number,
    status: SessionStatus
): Promise<ScheduledSession> =>
    apiRequest<ScheduledSession>(`/sessions/${id}`, {
        method: 'PUT',
        body: { status },
    })

/** PUT /sessions/{id} — edits a class's details (same endpoint, detail body). */
export const updateSession = (
    id: number,
    input: SessionInput
): Promise<ScheduledSession> =>
    apiRequest<ScheduledSession>(`/sessions/${id}`, {
        method: 'PUT',
        body: input,
    })
