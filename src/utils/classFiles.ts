import type { Attachment } from '../data/attachments'
import { paths } from '../paths'

/** One file as the teacher sees it, with every student's copy of it. */
export type FileGroup = {
    key: string
    /** The copy shown (the first student's). */
    file: Attachment
    /** Every copy — one per attendee of a group class. */
    copies: Attachment[]
}

/**
 * A group class keeps one copy of each file per attendee (REQ-063). Shown,
 * those copies are one file: grouped by class (the group, or the solo row)
 * plus name and size, which the upload gave every copy alike — so the same
 * worksheet used in two different classes stays two files. Order is kept
 * (newest first from the API).
 */
export const groupCopies = (attachments: Attachment[]): FileGroup[] => {
    const groups = new Map<string, FileGroup>()
    for (const attachment of attachments) {
        const key = [
            attachment.groupId ?? `solo-${attachment.sessionId}`,
            attachment.fileName,
            attachment.sizeBytes,
        ].join('\u0000')
        const group = groups.get(key)
        if (group) {
            group.copies.push(attachment)
        } else {
            groups.set(key, { key, file: attachment, copies: [attachment] })
        }
    }
    return [...groups.values()]
}

/** The planner deep link that opens this file's class. */
export const classLinkFor = (
    file: Pick<Attachment, 'date' | 'groupId' | 'sessionId'>
): string =>
    `${paths.scheduling}?day=${file.date}&entry=${encodeURIComponent(
        file.groupId ?? `solo-${file.sessionId}`
    )}`

/** `2026-11-12` → `12 Nov 2026`, parsed by parts so the day never shifts. */
export const shortDate = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

/** "Asha Perera" or "Asha Perera, Maya Fernando" for a group's copies. */
export const whoFor = (group: FileGroup): string =>
    [...new Set(group.copies.map((copy) => copy.studentName))].join(', ')
