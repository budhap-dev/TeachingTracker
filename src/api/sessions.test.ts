import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSession, fetchSessions, updateSessionStatus } from './sessions'
import type { SessionInput } from './sessions'

const jsonResponse = (body: unknown) =>
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body })

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

const sampleInput: SessionInput = {
    studentId: 1,
    studentName: 'Asha Perera',
    year: '10',
    subject: 'Mathematics',
    date: '2026-09-01',
    time: '16:00',
    notes: 'Revision',
}

describe('sessions api', () => {
    it('fetches classes from /sessions', async () => {
        const fetchMock = jsonResponse([{ id: 101 }])
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchSessions()).resolves.toEqual([{ id: 101 }])
        expect(fetchMock.mock.calls[0][0]).toContain('/sessions')
    })

    it('schedules a class with POST /sessions', async () => {
        const fetchMock = jsonResponse({ id: 999 })
        vi.stubGlobal('fetch', fetchMock)

        await expect(createSession(sampleInput)).resolves.toEqual({ id: 999 })
        const [, init] = fetchMock.mock.calls[0]
        expect(init.method).toBe('POST')
        expect(JSON.parse(init.body)).toMatchObject({ studentId: 1 })
    })

    it('cancels a class with PUT /sessions/{id}', async () => {
        const fetchMock = jsonResponse({ id: 101, status: 'Cancelled' })
        vi.stubGlobal('fetch', fetchMock)

        await expect(updateSessionStatus(101, 'Cancelled')).resolves.toEqual({
            id: 101,
            status: 'Cancelled',
        })

        const [url, init] = fetchMock.mock.calls[0]
        expect(url).toContain('/sessions/101')
        expect(init.method).toBe('PUT')
        expect(JSON.parse(init.body)).toEqual({ status: 'Cancelled' })
    })

    it('un-cancels a class through the same endpoint', async () => {
        const fetchMock = jsonResponse({ id: 101, status: 'Scheduled' })
        vi.stubGlobal('fetch', fetchMock)

        await updateSessionStatus(101, 'Scheduled')
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
            status: 'Scheduled',
        })
    })
})
