import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Attachment } from '../data/attachments'
import type { ScheduledSession } from '../data/students'

vi.mock('./graph', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./graph')>()
    return {
        ...actual,
        uploadFile: vi.fn(),
        deleteItem: vi.fn(),
        deleteFolder: vi.fn(),
    }
})
vi.mock('./prepareFile', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./prepareFile')>()
    return { ...actual, prepareFile: vi.fn() }
})
vi.mock('../api/attachments', () => ({
    createAttachment: vi.fn(),
    deleteAttachment: vi.fn(),
    fetchAttachments: vi.fn(),
}))

import {
    createAttachment,
    deleteAttachment,
    fetchAttachments,
} from '../api/attachments'
import {
    attachFiles,
    eraseStudentFiles,
    failureMessage,
    removeAttachment,
    removeClassFiles,
    removeFilesOf,
} from './attach'
import {
    deleteFolder,
    deleteItem,
    OneDriveNotConnectedError,
    uploadFile,
} from './graph'
import { FileRefusedError, prepareFile } from './prepareFile'

const session = (id: number, studentId: number): ScheduledSession => ({
    id,
    studentId,
    studentName: 'x',
    year: '10',
    subject: 'Maths',
    date: '2026-11-12',
    time: '16:00',
    durationMinutes: 60,
    notes: '',
    status: 'Scheduled',
})
const asha = { id: 1, firstName: 'Asha', lastName: 'Patel', studentId: 'STU-1' }
const ben = { id: 2, firstName: 'Ben', lastName: 'Clarke', studentId: 'STU-2' }
const group = [
    { session: session(10, 1), student: asha },
    { session: session(11, 2), student: ben },
]
const file = (name: string) => new File(['x'], name)

const attachment = (id: number, driveItemId: string) =>
    ({ id, driveItemId }) as Attachment

afterEach(() => vi.resetAllMocks())

describe('attachFiles', () => {
    it("uploads each file into every attendee's own folder, then indexes it", async () => {
        const blob = new Blob(['jpg'])
        vi.mocked(prepareFile).mockResolvedValue({
            blob,
            fileName: 'board.jpg',
            contentType: 'image/jpeg',
        })
        vi.mocked(uploadFile)
            .mockResolvedValueOnce({ id: 'A!1', name: 'board.jpg', size: 3 })
            .mockResolvedValueOnce({ id: 'B!1', name: 'board.jpg', size: 3 })
        vi.mocked(createAttachment)
            .mockResolvedValueOnce(attachment(1, 'A!1'))
            .mockResolvedValueOnce(attachment(2, 'B!1'))
        const progress = vi.fn()

        const outcomes = await attachFiles(group, [file('IMG.HEIC')], progress)

        expect(prepareFile).toHaveBeenCalledTimes(1)
        expect(vi.mocked(uploadFile).mock.calls.map((c) => c[0])).toEqual([
            'Asha Patel (STU-1)/2026-11-12 Maths',
            'Ben Clarke (STU-2)/2026-11-12 Maths',
        ])
        expect(createAttachment).toHaveBeenNthCalledWith(2, {
            sessionId: 11,
            fileName: 'board.jpg',
            contentType: 'image/jpeg',
            sizeBytes: 3,
            driveItemId: 'B!1',
        })
        expect(outcomes).toEqual([
            {
                fileName: 'IMG.HEIC',
                ok: true,
                attachments: [attachment(1, 'A!1'), attachment(2, 'B!1')],
            },
        ])
        expect(progress.mock.calls).toEqual([
            [1, 2],
            [2, 2],
        ])
    })

    it('carries on past a refused file and reports which failed', async () => {
        const refused = new FileRefusedError('a.zip', 'Only photos…')
        vi.mocked(prepareFile)
            .mockRejectedValueOnce(refused)
            .mockResolvedValueOnce({
                blob: new Blob(['p']),
                fileName: 'b.pdf',
                contentType: 'application/pdf',
            })
        vi.mocked(uploadFile).mockResolvedValue({ id: 'A!2', name: 'b.pdf', size: 1 })
        vi.mocked(createAttachment).mockResolvedValue(attachment(3, 'A!2'))
        const progress = vi.fn()

        const outcomes = await attachFiles(
            [group[0]],
            [file('a.zip'), file('b.pdf')],
            progress
        )

        expect(outcomes).toEqual([
            { fileName: 'a.zip', ok: false, error: refused },
            { fileName: 'b.pdf', ok: true, attachments: [attachment(3, 'A!2')] },
        ])
        expect(progress.mock.calls).toEqual([
            [1, 2],
            [2, 2],
        ])
    })

    it('stops and throws when OneDrive is not connected', async () => {
        vi.mocked(prepareFile).mockResolvedValue({
            blob: new Blob(['p']),
            fileName: 'b.pdf',
            contentType: 'application/pdf',
        })
        vi.mocked(uploadFile).mockRejectedValue(new OneDriveNotConnectedError())
        await expect(attachFiles(group, [file('b.pdf')])).rejects.toBeInstanceOf(
            OneDriveNotConnectedError
        )
        expect(createAttachment).not.toHaveBeenCalled()
    })
})

describe('failureMessage', () => {
    it("uses a refusal's own words, and a generic line otherwise", () => {
        expect(failureMessage(new FileRefusedError('a', 'Too big'))).toBe('Too big')
        expect(failureMessage(new Error('500'))).toMatch(/Could not upload/)
    })
})

describe('removing', () => {
    it('deletes a file from OneDrive before its index row', async () => {
        const order: string[] = []
        vi.mocked(deleteItem).mockImplementation(async () => {
            order.push('drive')
        })
        vi.mocked(deleteAttachment).mockImplementation(async () => {
            order.push('index')
        })
        await removeAttachment(attachment(5, 'A!5'))
        expect(order).toEqual(['drive', 'index'])
        expect(deleteItem).toHaveBeenCalledWith('A!5')
        expect(deleteAttachment).toHaveBeenCalledWith(5)
    })

    it('keeps the index row when OneDrive fails', async () => {
        vi.mocked(deleteItem).mockRejectedValue(new Error('down'))
        await expect(removeAttachment(attachment(5, 'A!5'))).rejects.toThrow('down')
        expect(deleteAttachment).not.toHaveBeenCalled()
    })

    it("removes a class's files from OneDrive", async () => {
        await removeFilesOf([attachment(1, 'A!1'), attachment(2, 'A!2')])
        expect(vi.mocked(deleteItem).mock.calls).toEqual([['A!1'], ['A!2']])
    })

    it("erases a student's files by id, then their folder", async () => {
        await eraseStudentFiles(asha, [attachment(1, 'A!1')])
        expect(deleteItem).toHaveBeenCalledWith('A!1')
        expect(deleteFolder).toHaveBeenCalledWith('Asha Patel (STU-1)')
    })
})

describe('removeClassFiles', () => {
    it("removes every attendee's copy for that class, and nothing else", async () => {
        vi.mocked(fetchAttachments).mockResolvedValue([
            { id: 1, sessionId: 10, driveItemId: 'A!1' },
            { id: 2, sessionId: 11, driveItemId: 'B!1' },
            { id: 3, sessionId: 99, driveItemId: 'C!1' },
        ] as Attachment[])
        expect(await removeClassFiles([session(10, 1), session(11, 2)])).toBe(2)
        expect(fetchAttachments).toHaveBeenCalledWith({
            from: '2026-11-12',
            to: '2026-11-12',
        })
        expect(vi.mocked(deleteItem).mock.calls).toEqual([['A!1'], ['B!1']])
    })

    it('does nothing for a class with no rows', async () => {
        expect(await removeClassFiles([])).toBe(0)
        expect(fetchAttachments).not.toHaveBeenCalled()
    })
})
