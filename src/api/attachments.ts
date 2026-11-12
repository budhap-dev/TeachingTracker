import { apiRequest } from './client'
import type {
    Attachment,
    AttachmentInput,
    AttachmentQuery,
} from '../data/attachments'

const queryString = (query: AttachmentQuery): string => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== '') {
            params.set(key, String(value))
        }
    }
    const text = params.toString()
    return text ? `?${text}` : ''
}

/** GET /attachments — teacher: the file index, newest first (REQ-063). */
export const fetchAttachments = (
    query: AttachmentQuery = {}
): Promise<Attachment[]> =>
    apiRequest<Attachment[]>(`/attachments${queryString(query)}`)

/** POST /attachments — index a file OneDrive has already accepted. */
export const createAttachment = (input: AttachmentInput): Promise<Attachment> =>
    apiRequest<Attachment>('/attachments', { method: 'POST', body: input })

/** PATCH /attachments/:id — set or clear (empty) the caption. */
export const updateAttachmentCaption = (
    id: number,
    caption: string
): Promise<Attachment> =>
    apiRequest<Attachment>(`/attachments/${id}`, {
        method: 'PATCH',
        body: { caption },
    })

/** DELETE /attachments/:id — forget the index row. Idempotent. */
export const deleteAttachment = (id: number): Promise<void> =>
    apiRequest<void>(`/attachments/${id}`, { method: 'DELETE' })
