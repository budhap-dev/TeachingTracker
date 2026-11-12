import { acquireGraphToken } from '../auth/msal'

/**
 * The teacher's OneDrive, through Microsoft Graph, from the browser (REQ-063).
 *
 * Everything lives in the app's own folder (`special/approot`) — the only
 * part of the drive the `Files.ReadWrite.AppFolder` scope can see. The API
 * never touches these bytes: it cannot reach a personal OneDrive.
 *
 * Behaviour measured in the dev spike (2026-11-12):
 * - simple PUT up to 4MB; above that an upload session, whose chunk PUTs
 *   must carry *no* bearer token;
 * - `downloadUrl` fetches under CORS; thumbnail URLs do not, so they are
 *   only ever used as `<img src>`;
 * - `preview` returns an embeddable `getUrl`.
 */

const GRAPH = 'https://graph.microsoft.com/v1.0'
/** Graph's simple upload tops out at 4MB. */
const SIMPLE_PUT_MAX = 4 * 1024 * 1024
/** Upload-session chunks must be multiples of 320 KiB; ~3.2MB each. */
const CHUNK = 320 * 1024 * 10

/** No OneDrive account, or it needs the teacher again: offer "Connect". */
export class OneDriveNotConnectedError extends Error {
    constructor() {
        super('OneDrive is not connected.')
        this.name = 'OneDriveNotConnectedError'
    }
}

export class OneDriveError extends Error {
    constructor(
        message: string,
        public readonly status: number
    ) {
        super(message)
        this.name = 'OneDriveError'
    }
}

export type DriveItem = {
    id: string
    name: string
    size: number
    '@microsoft.graph.downloadUrl'?: string
}

/** Characters OneDrive refuses in a name, and edges it trims. */
const ILLEGAL = /["*:<>?/\\|#%]/g

/** A safe single path segment: illegal characters dashed, edges tidied. */
export const safeSegment = (text: string): string =>
    text
        .replace(ILLEGAL, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^\.+|\.+$/g, '') || 'untitled'

/**
 * `<Student name> (<code>)` — readable in OneDrive, and the code keeps two
 * students who share a name out of each other's folder (erasing one must
 * never delete the other's files).
 */
export const studentFolder = (student: {
    firstName: string
    lastName: string
    studentId: string
}): string =>
    safeSegment(
        `${student.firstName} ${student.lastName} (${student.studentId})`
    )

/** `<Student>/<YYYY-MM-DD> <subject>` — owner decision, 2026-11-12. */
export const classFolder = (
    student: { firstName: string; lastName: string; studentId: string },
    date: string,
    subject: string
): string => `${studentFolder(student)}/${safeSegment(`${date} ${subject}`)}`

const encodePath = (path: string) =>
    path.split('/').map(encodeURIComponent).join('/')

const token = async (): Promise<string> => {
    const value = await acquireGraphToken()
    if (!value) {
        throw new OneDriveNotConnectedError()
    }
    return value
}

const failure = async (response: Response, what: string) => {
    if (response.status === 401) {
        return new OneDriveNotConnectedError()
    }
    const body = (await response
        .json()
        .catch(() => null)) as { error?: { message?: string } } | null
    return new OneDriveError(
        `${what} failed (${response.status})${body?.error?.message ? `: ${body.error.message}` : ''}`,
        response.status
    )
}

const graph = async (
    path: string,
    what: string,
    init: RequestInit = {}
): Promise<Response> => {
    const response = await fetch(`${GRAPH}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${await token()}`,
            ...(init.headers ?? {}),
        },
    })
    if (!response.ok) {
        throw await failure(response, what)
    }
    return response
}

const approot = (path: string) => `/me/drive/special/approot:/${encodePath(path)}`

/**
 * Uploads one file to `<folder>/<fileName>` in the app folder, creating the
 * folders on the way. A name already there gets OneDrive's " 1" suffix
 * rather than overwriting someone's earlier file.
 */
export const uploadFile = async (
    folder: string,
    fileName: string,
    blob: Blob
): Promise<DriveItem> => {
    const target = approot(`${folder}/${safeSegment(fileName)}`)
    if (blob.size <= SIMPLE_PUT_MAX) {
        const response = await graph(
            `${target}:/content?@microsoft.graph.conflictBehavior=rename`,
            'Upload',
            {
                method: 'PUT',
                headers: {
                    'Content-Type': blob.type || 'application/octet-stream',
                },
                body: blob,
            }
        )
        return (await response.json()) as DriveItem
    }

    const session = (await (
        await graph(`${target}:/createUploadSession`, 'Upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item: { '@microsoft.graph.conflictBehavior': 'rename' },
            }),
        })
    ).json()) as { uploadUrl: string }

    for (let start = 0; start < blob.size; start += CHUNK) {
        const end = Math.min(start + CHUNK, blob.size)
        // No Authorization header: the upload URL carries its own.
        const response = await fetch(session.uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Range': `bytes ${start}-${end - 1}/${blob.size}`,
            },
            body: blob.slice(start, end),
        })
        if (!response.ok) {
            throw await failure(response, 'Upload')
        }
        if (end === blob.size) {
            return (await response.json()) as DriveItem
        }
    }
    /* c8 ignore next -- the loop always returns on its last chunk */
    throw new OneDriveError('Upload ended without a file', 0)
}

/** A medium thumbnail URL — for `<img src>` only (CORS blocks fetch). */
export const thumbnailUrl = async (itemId: string): Promise<string | null> => {
    const response = await graph(
        `/me/drive/items/${encodeURIComponent(itemId)}/thumbnails`,
        'Thumbnail'
    )
    const body = (await response.json()) as {
        value: { medium?: { url: string } }[]
    }
    return body.value[0]?.medium?.url ?? null
}

/** A short-lived URL for the file's bytes; fetchable under CORS. */
export const downloadUrl = async (itemId: string): Promise<string> => {
    const response = await graph(
        `/me/drive/items/${encodeURIComponent(itemId)}`,
        'Open'
    )
    const item = (await response.json()) as DriveItem
    const url = item['@microsoft.graph.downloadUrl']
    if (!url) {
        throw new OneDriveError('OneDrive gave no download link', 0)
    }
    return url
}

/** An embeddable viewer URL (images, PDFs, Office files). */
export const previewUrl = async (itemId: string): Promise<string> => {
    const response = await graph(
        `/me/drive/items/${encodeURIComponent(itemId)}/preview`,
        'Preview',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
        }
    )
    const body = (await response.json()) as { getUrl?: string }
    if (!body.getUrl) {
        throw new OneDriveError('OneDrive gave no preview', 0)
    }
    return body.getUrl
}

/** Already gone counts as deleted — the teacher may have removed it by hand. */
const deleted = async (response: Response, what: string) => {
    if (!response.ok && response.status !== 404) {
        throw await failure(response, what)
    }
}

const raw = async (path: string, init: RequestInit) =>
    fetch(`${GRAPH}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${await token()}` },
    })

/** Deletes one file (to the OneDrive recycle bin). */
export const deleteItem = async (itemId: string): Promise<void> =>
    deleted(
        await raw(`/me/drive/items/${encodeURIComponent(itemId)}`, {
            method: 'DELETE',
        }),
        'Delete'
    )

/** Deletes a folder in the app folder, e.g. a student's whole folder. */
export const deleteFolder = async (folder: string): Promise<void> =>
    deleted(await raw(approot(folder), { method: 'DELETE' }), 'Delete folder')
