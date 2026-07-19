import type { ScheduledSession, SessionStatus } from '../data/students'
import { apiRequest } from './client'

/**
 * Booking a class: one student books a solo row; several book linked rows
 * sharing a groupId — one class on the calendar, one bill per attendee.
 */
export type ScheduleClassInput = {
    studentIds: number[]
    subject: string
    date: string
    time: string
    durationMinutes: number
    notes: string
}

/** Shared-field edits; student fields only make sense on a solo class. */
export type EditClassChanges = Partial<
    Omit<ScheduledSession, 'id' | 'status' | 'groupId'>
>

/** The API answers with one row for a solo action, an array for a group. */
const asRows = (
    response: ScheduledSession | ScheduledSession[]
): ScheduledSession[] => (Array.isArray(response) ? response : [response])

/** GET /sessions — scheduled classes, date-ordered. */
export const fetchSessions = (): Promise<ScheduledSession[]> =>
    apiRequest<ScheduledSession[]>('/sessions')

/** POST /sessions — books a class; the rows that were created come back. */
export const createSession = async (
    input: ScheduleClassInput
): Promise<ScheduledSession[]> => {
    const { studentIds, ...rest } = input
    // A solo booking keeps the original single-student contract, so the API
    // and any older deployment stay perfectly compatible.
    const body =
        studentIds.length === 1
            ? { studentId: studentIds[0], ...rest }
            : { studentIds, ...rest }
    return asRows(
        await apiRequest<ScheduledSession | ScheduledSession[]>('/sessions', {
            method: 'POST',
            body,
        })
    )
}

/** PUT /sessions/{id} — cancels or un-cancels; the group when asked to. */
export const updateSessionStatus = async (
    id: number,
    status: SessionStatus,
    applyToGroup = false
): Promise<ScheduledSession[]> =>
    asRows(
        await apiRequest<ScheduledSession | ScheduledSession[]>(
            `/sessions/${id}`,
            {
                method: 'PUT',
                body: applyToGroup ? { status, applyToGroup } : { status },
            }
        )
    )

/** PUT /sessions/{id} — edits details; the whole group when asked to. */
export const updateSession = async (
    id: number,
    changes: EditClassChanges,
    applyToGroup = false
): Promise<ScheduledSession[]> =>
    asRows(
        await apiRequest<ScheduledSession | ScheduledSession[]>(
            `/sessions/${id}`,
            {
                method: 'PUT',
                body: applyToGroup ? { ...changes, applyToGroup } : changes,
            }
        )
    )

/** DELETE /sessions/{id} — permanently removes a class (the whole group);
 *  the removed ids come back so they can be dropped from the store. */
export const deleteSession = async (id: number): Promise<number[]> => {
    const { ids } = await apiRequest<{ ids: number[] }>(`/sessions/${id}`, {
        method: 'DELETE',
    })
    return ids
}

/** POST /sessions/{id}/members — adds a student to a class (solo → group);
 *  the whole group's rows come back. */
export const addSessionMember = async (
    sessionId: number,
    studentId: number
): Promise<ScheduledSession[]> =>
    asRows(
        await apiRequest<ScheduledSession | ScheduledSession[]>(
            `/sessions/${sessionId}/members`,
            { method: 'POST', body: { studentId } }
        )
    )
