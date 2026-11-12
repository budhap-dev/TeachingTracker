import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    createAttachment,
    deleteAttachment,
    fetchAttachments,
    updateAttachmentCaption,
} from './attachments'

const respond = (body: unknown, status = 200) => {
    const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: true, status, json: async () => body })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('attachments api', () => {
    it('lists with no filters as plain /attachments', async () => {
        const fetchMock = respond([{ id: 1 }])
        await expect(fetchAttachments()).resolves.toEqual([{ id: 1 }])
        expect(fetchMock).toHaveBeenCalledWith(
            '/attachments',
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('sends only the filters that are set', async () => {
        const fetchMock = respond([])
        await fetchAttachments({
            from: '2026-11-01',
            studentId: 3,
            type: 'word',
            q: 'past paper',
            subject: '',
            to: undefined,
        })
        expect(fetchMock.mock.calls[0][0]).toBe(
            '/attachments?from=2026-11-01&studentId=3&type=word&q=past+paper'
        )
    })

    it('indexes an uploaded file', async () => {
        const fetchMock = respond({ id: 7 }, 201)
        const input = {
            sessionId: 10,
            fileName: 'a.pdf',
            contentType: 'application/pdf' as const,
            sizeBytes: 1,
            driveItemId: 'X!1',
        }
        await createAttachment(input)
        expect(fetchMock).toHaveBeenCalledWith(
            '/attachments',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(input),
            })
        )
    })

    it('patches the caption and deletes by id', async () => {
        const fetchMock = respond({ id: 7 })
        await updateAttachmentCaption(7, 'Q3')
        expect(fetchMock).toHaveBeenCalledWith(
            '/attachments/7',
            expect.objectContaining({
                method: 'PATCH',
                body: JSON.stringify({ caption: 'Q3' }),
            })
        )
        const deleteMock = respond(undefined, 204)
        await expect(deleteAttachment(7)).resolves.toBeUndefined()
        expect(deleteMock).toHaveBeenCalledWith(
            '/attachments/7',
            expect.objectContaining({ method: 'DELETE' })
        )
    })
})
