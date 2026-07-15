import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPayments, savePayments } from './payments'

const jsonResponse = (body: unknown) =>
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body })

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('payments api', () => {
    it('fetches all payments with no query string when unfiltered', async () => {
        const fetchMock = jsonResponse([{ id: 1 }])
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchPayments()).resolves.toEqual([{ id: 1 }])
        expect(fetchMock).toHaveBeenCalledWith(
            '/payments',
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('builds a query string from all provided filters', async () => {
        const fetchMock = jsonResponse([])
        vi.stubGlobal('fetch', fetchMock)

        await fetchPayments({ studentId: 1, month: '2026-01', status: 'Paid' })

        expect(fetchMock).toHaveBeenCalledWith(
            '/payments?studentId=1&month=2026-01&status=Paid',
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('saves payments via POST /payments', async () => {
        const fetchMock = jsonResponse([{ id: 5 }])
        vi.stubGlobal('fetch', fetchMock)

        const input = { studentId: 1, month: '2026-01', status: 'Paid' as const }
        await expect(savePayments(input)).resolves.toEqual([{ id: 5 }])
        expect(fetchMock).toHaveBeenCalledWith(
            '/payments',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(input),
            })
        )
    })
})
