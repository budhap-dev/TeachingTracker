import type { Attachment } from '../data/attachments'

/** One file as the teacher sees it, with every student's copy of it. */
export type FileGroup = {
    key: string
    /** The copy shown (the first student's). */
    file: Attachment
    /** Every copy — one per attendee of a group class. */
    copies: Attachment[]
}

/**
 * A group class keeps one copy of each file per attendee (REQ-063). On the
 * class itself those copies are one file: grouped by name and size, which
 * the upload gave every copy alike. Order is kept (newest first from the API).
 */
export const groupCopies = (attachments: Attachment[]): FileGroup[] => {
    const groups = new Map<string, FileGroup>()
    for (const attachment of attachments) {
        const key = `${attachment.fileName}\u0000${attachment.sizeBytes}`
        const group = groups.get(key)
        if (group) {
            group.copies.push(attachment)
        } else {
            groups.set(key, { key, file: attachment, copies: [attachment] })
        }
    }
    return [...groups.values()]
}
