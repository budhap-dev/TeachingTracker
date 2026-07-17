import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    createSession,
    fetchSessions,
    updateSession,
    updateSessionStatus,
} from './sessions'
import type { ScheduleClassInput } from './sessions'

const jsonResponse = (body: unknown) =>
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body })

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

const sampleInput: ScheduleClassInput = {
    studentIds: [1],
    subject: 'Mathematics',
    date: '2026-09-01',
    time: '16:00',
    durationMinutes: 60,
    notes: 'Revision',
}

describe('sessions api', () => {
    it('fetches classes from /sessions', async () => {
        const fetchMock = jsonResponse([{ id: 101 }])
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchSessions()).resolves.toEqual([{ id: 101 }])
        expect(fetchMock.mock.calls[0][0]).toContain('/sessions')
    })

    it('schedules a solo class with the original single-student contract', async () => {
        const fetchMock = jsonResponse({ id: 999 })
        vi.stubGlobal('fetch', fetchMock)

        // The one-row response is normalised to rows.
        await expect(createSession(sampleInput)).resolves.toEqual([{ id: 999 }])
        const [, init] = fetchMock.mock.calls[0]
        expect(init.method).toBe('POST')
        const body = JSON.parse(init.body)
        expect(body).toMatchObject({ studentId: 1 })
        expect(body.studentIds).toBeUndefined()
    })

    it('schedules a group class with studentIds and takes the rows back', async () => {
        const rows = [
            { id: 999, groupId: 'grp-999' },
            { id: 1000, groupId: 'grp-999' },
        ]
        const fetchMock = jsonResponse(rows)
        vi.stubGlobal('fetch', fetchMock)

        await expect(
            createSession({ ...sampleInput, studentIds: [1, 2] })
        ).resolves.toEqual(rows)
        const body = JSON.parse(fetchMock.mock.calls[0][1].body)
        expect(body.studentIds).toEqual([1, 2])
        expect(body.studentId).toBeUndefined()
    })

    it('cancels a class with PUT /sessions/{id}', async () => {
        const fetchMock = jsonResponse({ id: 101, status: 'Cancelled' })
        vi.stubGlobal('fetch', fetchMock)

        await expect(updateSessionStatus(101, 'Cancelled')).resolves.toEqual([
            { id: 101, status: 'Cancelled' },
        ])

        const [url, init] = fetchMock.mock.calls[0]
        expect(url).toContain('/sessions/101')
        expect(init.method).toBe('PUT')
        expect(JSON.parse(init.body)).toEqual({ status: 'Cancelled' })
    })

    it('cancels a whole group when asked, receiving every row', async () => {
        const rows = [
            { id: 101, status: 'Cancelled', groupId: 'g' },
            { id: 102, status: 'Cancelled', groupId: 'g' },
        ]
        const fetchMock = jsonResponse(rows)
        vi.stubGlobal('fetch', fetchMock)

        await expect(
            updateSessionStatus(101, 'Cancelled', true)
        ).resolves.toEqual(rows)
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
            status: 'Cancelled',
            applyToGroup: true,
        })
    })

    it('un-cancels a class through the same endpoint', async () => {
        const fetchMock = jsonResponse({ id: 101, status: 'Scheduled' })
        vi.stubGlobal('fetch', fetchMock)

        await updateSessionStatus(101, 'Scheduled')
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
            status: 'Scheduled',
        })
    })

    it('edits shared fields for the whole group when asked', async () => {
        const rows = [
            { id: 101, time: '11:00', groupId: 'g' },
            { id: 102, time: '11:00', groupId: 'g' },
        ]
        const fetchMock = jsonResponse(rows)
        vi.stubGlobal('fetch', fetchMock)

        await expect(
            updateSession(101, { time: '11:00' }, true)
        ).resolves.toEqual(rows)
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
            time: '11:00',
            applyToGroup: true,
        })
    })

    it('edits a solo class without the group flag', async () => {
        const fetchMock = jsonResponse({ id: 101, subject: 'Physics' })
        vi.stubGlobal('fetch', fetchMock)

        await expect(
            updateSession(101, { subject: 'Physics' })
        ).resolves.toEqual([{ id: 101, subject: 'Physics' }])
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
            subject: 'Physics',
        })
    })
})
