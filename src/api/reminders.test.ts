import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    createReminder,
    deleteReminder,
    fetchReminders,
    updateReminder,
} from './reminders'

const jsonResponse = (body: unknown) =>
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body })

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('reminders api', () => {
    it('reads them from /reminders', async () => {
        const fetchMock = jsonResponse([{ id: 1 }])
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchReminders()).resolves.toEqual([{ id: 1 }])
        expect(fetchMock).toHaveBeenCalledWith(
            '/reminders',
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('writes a new one with no id — the API mints it', async () => {
        const fetchMock = jsonResponse({ id: 1 })
        vi.stubGlobal('fetch', fetchMock)

        await createReminder({ date: '2026-08-20', text: 'Order paper' })

        expect(fetchMock).toHaveBeenCalledWith(
            '/reminders',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    date: '2026-08-20',
                    text: 'Order paper',
                }),
            })
        )
    })

    it('changes one at /reminders/{id}', async () => {
        const fetchMock = jsonResponse({ id: 7 })
        vi.stubGlobal('fetch', fetchMock)

        await updateReminder(7, {
            date: '2026-08-21',
            time: '16:00',
            text: 'Ring back',
        })

        expect(fetchMock).toHaveBeenCalledWith(
            '/reminders/7',
            expect.objectContaining({ method: 'PUT' })
        )
    })

    it('forgets one', async () => {
        const fetchMock = jsonResponse(undefined)
        vi.stubGlobal('fetch', fetchMock)

        await deleteReminder(7)

        expect(fetchMock).toHaveBeenCalledWith(
            '/reminders/7',
            expect.objectContaining({ method: 'DELETE' })
        )
    })
})
