import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const tokenMock = vi.fn()
vi.mock('../auth/msal', () => ({ acquireGraphToken: () => tokenMock() }))

import {
    classFolder,
    deleteFileAndEmptyFolders,
    deleteFolder,
    deleteItem,
    downloadUrl,
    OneDriveError,
    OneDriveNotConnectedError,
    previewUrl,
    safeSegment,
    studentFolder,
    thumbnailUrl,
    uploadFile,
} from './graph'

const GRAPH = 'https://graph.microsoft.com/v1.0'
const ROOT = `${GRAPH}/me/drive/special/approot:`
const asha = { firstName: 'Asha', lastName: 'Patel', studentId: 'STU-4F9K2Q' }

type Reply = { status?: number; body?: unknown }
const replies = (...list: Reply[]) => {
    const fetchMock = vi.fn()
    for (const { status = 200, body } of list) {
        fetchMock.mockResolvedValueOnce({
            ok: status >= 200 && status < 300,
            status,
            json: async () => {
                if (body === undefined) throw new SyntaxError('no body')
                return body
            },
        })
    }
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

beforeEach(() => tokenMock.mockResolvedValue('graph-token'))
afterEach(() => {
    vi.unstubAllGlobals()
    tokenMock.mockReset()
})

describe('folder names', () => {
    it('makes a safe single segment', () => {
        expect(safeSegment('  Maths: Paper 1/2?  ')).toBe('Maths- Paper 1-2-')
        expect(safeSegment('...hidden...')).toBe('hidden')
        expect(safeSegment('///')).toBe('---')
        expect(safeSegment('   ')).toBe('untitled')
    })

    it('names a student by name and code, a class by date and subject', () => {
        expect(studentFolder(asha)).toBe('Asha Patel (STU-4F9K2Q)')
        expect(classFolder(asha, '2026-11-12', 'Maths')).toBe(
            'Asha Patel (STU-4F9K2Q)/2026-11-12 Maths'
        )
    })
})

describe('uploadFile', () => {
    it('PUTs a small file straight to its path, renaming on a clash', async () => {
        const fetchMock = replies({
            body: { id: 'X!1', name: 'a.jpg', size: 3 },
        })
        const blob = new Blob(['abc'], { type: 'image/jpeg' })
        const item = await uploadFile(
            'Asha Patel (STU-1)/2026-11-12 Maths',
            'a.jpg',
            blob
        )
        expect(item.id).toBe('X!1')
        const [url, init] = fetchMock.mock.calls[0]
        expect(url).toBe(
            `${ROOT}/Asha%20Patel%20(STU-1)/2026-11-12%20Maths/a.jpg:/content?@microsoft.graph.conflictBehavior=rename`
        )
        expect(init).toMatchObject({
            method: 'PUT',
            body: blob,
            headers: {
                Authorization: 'Bearer graph-token',
                'Content-Type': 'image/jpeg',
            },
        })
    })

    it('labels an untyped blob as octet-stream', async () => {
        const fetchMock = replies({ body: { id: 'X!1' } })
        await uploadFile('f', 'a.bin', new Blob(['x']))
        expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBe(
            'application/octet-stream'
        )
    })

    it('sends a large file through an upload session, chunks without a token', async () => {
        const size = 5 * 1024 * 1024
        const fetchMock = replies(
            {
                body: {
                    uploadUrl: 'https://my.microsoftpersonalcontent.com/up/1',
                },
            },
            { status: 202, body: {} },
            { status: 201, body: { id: 'X!big', size } }
        )
        const item = await uploadFile(
            'f',
            'big.pdf',
            new Blob([new Uint8Array(size)])
        )
        expect(item.id).toBe('X!big')
        expect(fetchMock.mock.calls[0][0]).toBe(
            `${ROOT}/f/big.pdf:/createUploadSession`
        )
        const [, firstChunk] = fetchMock.mock.calls[1]
        expect(firstChunk.headers).toEqual({
            'Content-Range': `bytes 0-3276799/${size}`,
        })
        expect(fetchMock.mock.calls[2][1].headers['Content-Range']).toBe(
            `bytes 3276800-${size - 1}/${size}`
        )
    })

    it('fails clearly when a chunk is refused', async () => {
        replies(
            { body: { uploadUrl: 'https://up/1' } },
            { status: 500, body: { error: { message: 'boom' } } }
        )
        await expect(
            uploadFile(
                'f',
                'big.pdf',
                new Blob([new Uint8Array(5 * 1024 * 1024)])
            )
        ).rejects.toThrow('Upload failed (500): boom')
    })

    it('throws not-connected when there is no token, without calling Graph', async () => {
        tokenMock.mockResolvedValue(null)
        const fetchMock = replies()
        await expect(
            uploadFile('f', 'a', new Blob(['x']))
        ).rejects.toBeInstanceOf(OneDriveNotConnectedError)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('treats a 401 from Graph as not connected', async () => {
        replies({ status: 401, body: {} })
        await expect(
            uploadFile('f', 'a', new Blob(['x']))
        ).rejects.toBeInstanceOf(OneDriveNotConnectedError)
    })

    it('reports other failures with their status, body or not', async () => {
        replies({ status: 507 })
        const error = await uploadFile('f', 'a', new Blob(['x'])).catch(
            (e) => e
        )
        expect(error).toBeInstanceOf(OneDriveError)
        expect(error).toMatchObject({
            status: 507,
            message: 'Upload failed (507)',
        })
    })
})

describe('reading', () => {
    it('gives the medium thumbnail, or null when there is none', async () => {
        replies(
            { body: { value: [{ medium: { url: 'https://x.svc.ms/t' } }] } },
            { body: { value: [] } }
        )
        expect(await thumbnailUrl('X!1')).toBe('https://x.svc.ms/t')
        expect(await thumbnailUrl('X!1')).toBeNull()
    })

    it('gives the download URL, or fails when OneDrive gives none', async () => {
        const fetchMock = replies(
            { body: { '@microsoft.graph.downloadUrl': 'https://dl/1' } },
            { body: {} }
        )
        expect(await downloadUrl('A!b')).toBe('https://dl/1')
        expect(fetchMock.mock.calls[0][0]).toBe(`${GRAPH}/me/drive/items/A!b`)
        await expect(downloadUrl('A!b')).rejects.toThrow('no download link')
    })

    it('gives the preview URL, or fails when OneDrive gives none', async () => {
        const fetchMock = replies(
            { body: { getUrl: 'https://p/1' } },
            { body: {} }
        )
        expect(await previewUrl('X!1')).toBe('https://p/1')
        expect(fetchMock.mock.calls[0][1].method).toBe('POST')
        await expect(previewUrl('X!1')).rejects.toThrow('no preview')
    })
})

describe('deleting', () => {
    it('deletes an item, and counts already-gone as done', async () => {
        const fetchMock = replies({ status: 204 }, { status: 404 })
        await deleteItem('X!1')
        await deleteItem('X!1')
        expect(fetchMock.mock.calls[0]).toEqual([
            `${GRAPH}/me/drive/items/X!1`,
            {
                method: 'DELETE',
                headers: { Authorization: 'Bearer graph-token' },
            },
        ])
    })

    it('deletes a student folder by path', async () => {
        const fetchMock = replies({ status: 204 })
        await deleteFolder('Asha Patel (STU-1)')
        expect(fetchMock.mock.calls[0][0]).toBe(
            `${ROOT}/Asha%20Patel%20(STU-1)`
        )
    })

    it('throws when a delete really fails', async () => {
        replies({ status: 500, body: { error: { message: 'down' } } })
        await expect(deleteFolder('x')).rejects.toThrow(
            'Delete folder failed (500): down'
        )
    })
})

describe('deleteFileAndEmptyFolders', () => {
    const item = (id: string, parent?: string, childCount?: number) => ({
        body: {
            id,
            ...(childCount === undefined ? {} : { folder: { childCount } }),
            ...(parent ? { parentReference: { id: parent } } : {}),
        },
    })
    const urls = (fetchMock: ReturnType<typeof vi.fn>) =>
        fetchMock.mock.calls.map(
            ([url, init]) => `${init?.method ?? 'GET'} ${String(url).replace(GRAPH, '')}`
        )

    it('removes the file, its emptied class folder and student folder, never the app folder', async () => {
        const fetchMock = replies(
            item('F', 'CLASS'), // the file, and where it sits
            { status: 204 }, // delete the file
            { body: { id: 'ROOT' } }, // the app folder's id
            item('CLASS', 'STUDENT', 0), // class folder, now empty
            { status: 204 }, // delete it
            item('STUDENT', 'ROOT', 0), // student folder, now empty
            { status: 204 } // delete it — and stop at ROOT
        )
        await deleteFileAndEmptyFolders('F')
        expect(urls(fetchMock)).toEqual([
            'GET /me/drive/items/F?$select=id,folder,parentReference',
            'DELETE /me/drive/items/F',
            'GET /me/drive/special/approot?$select=id',
            'GET /me/drive/items/CLASS?$select=id,folder,parentReference',
            'DELETE /me/drive/items/CLASS',
            'GET /me/drive/items/STUDENT?$select=id,folder,parentReference',
            'DELETE /me/drive/items/STUDENT',
        ])
    })

    it('keeps a folder that still holds other files', async () => {
        const fetchMock = replies(
            item('F', 'CLASS'),
            { status: 204 },
            { body: { id: 'ROOT' } },
            item('CLASS', 'STUDENT', 2)
        )
        await deleteFileAndEmptyFolders('F')
        expect(urls(fetchMock).filter((u) => u.startsWith('DELETE'))).toEqual([
            'DELETE /me/drive/items/F',
        ])
    })

    it('never deletes the app folder itself', async () => {
        const fetchMock = replies(
            item('F', 'ROOT'),
            { status: 204 },
            { body: { id: 'ROOT' } }
        )
        await deleteFileAndEmptyFolders('F')
        expect(urls(fetchMock).filter((u) => u.startsWith('DELETE'))).toEqual([
            'DELETE /me/drive/items/F',
        ])
    })

    it('is done when the file was already gone', async () => {
        const fetchMock = replies({ status: 404 }, { status: 404 })
        await deleteFileAndEmptyFolders('F')
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('stops quietly when a folder is gone, or is not a folder', async () => {
        replies(item('F', 'CLASS'), { status: 204 }, { body: { id: 'ROOT' } }, { status: 404 })
        await expect(deleteFileAndEmptyFolders('F')).resolves.toBeUndefined()
        replies(item('F', 'X'), { status: 204 }, { body: { id: 'ROOT' } }, item('X', 'ROOT'))
        await expect(deleteFileAndEmptyFolders('F')).resolves.toBeUndefined()
    })

    it('still counts the file removed when tidying a folder fails', async () => {
        replies(item('F', 'CLASS'), { status: 204 }, { status: 500, body: {} })
        await expect(deleteFileAndEmptyFolders('F')).resolves.toBeUndefined()
    })

    it('fails when the file itself cannot be looked up or deleted', async () => {
        replies({ status: 500, body: { error: { message: 'down' } } })
        await expect(deleteFileAndEmptyFolders('F')).rejects.toThrow('Look up failed (500): down')
        replies(item('F', 'CLASS'), { status: 500, body: {} })
        await expect(deleteFileAndEmptyFolders('F')).rejects.toThrow('Delete failed (500)')
    })
})
