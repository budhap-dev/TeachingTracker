/**
 * A file on a class (REQ-063): a whiteboard photo, a marked worksheet, a past
 * paper. The bytes live in the teacher's own OneDrive (the app's folder); the
 * API keeps only this index row. One row per student per file — a group
 * class keeps one copy per attendee, so erasing one student never touches a
 * file another still needs.
 */
export type Attachment = {
    id: number
    sessionId: number
    studentId: number
    studentName: string
    /** `YYYY-MM-DD` — the class's day (follows the class if it moves). */
    date: string
    subject: string
    groupId?: string
    fileName: string
    contentType: AttachmentContentType
    kind: AttachmentKind
    sizeBytes: number
    /** OneDrive's id for the item; survives moves and renames in the drive. */
    driveItemId: string
    caption?: string
    uploadedAt: string
}

export type AttachmentKind = 'photo' | 'pdf' | 'word' | 'powerpoint'

/** What the browser sends once OneDrive has accepted the upload. */
export type AttachmentInput = {
    sessionId: number
    fileName: string
    contentType: AttachmentContentType
    sizeBytes: number
    driveItemId: string
    caption?: string
}

/** GET /attachments filters; every one optional, all combined. */
export type AttachmentQuery = {
    from?: string
    to?: string
    studentId?: number
    sessionId?: number
    subject?: string
    type?: AttachmentKind
    q?: string
}

const DOCX =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PPTX =
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'

/** The closed list (owner decision, 2026-11-08) — mirrors the API's. */
export const contentTypeKinds = {
    'image/jpeg': 'photo',
    'image/png': 'photo',
    'image/webp': 'photo',
    'application/pdf': 'pdf',
    [DOCX]: 'word',
    [PPTX]: 'powerpoint',
} as const satisfies Record<string, AttachmentKind>

export type AttachmentContentType = keyof typeof contentTypeKinds

export const attachmentKindLabels: Record<AttachmentKind, string> = {
    photo: 'Photos',
    pdf: 'PDFs',
    word: 'Word',
    powerpoint: 'PowerPoint',
}

/** 20MB per file, measured after a photo is shrunk (owner decision). */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024

/** For the file picker: what the phone camera and file browser may offer. */
export const ATTACHMENT_ACCEPT = 'image/*,application/pdf,.docx,.pptx'

/**
 * Some browsers leave `File.type` empty for Office files, so the extension
 * stands in. Anything else is refused before upload.
 */
const extensionTypes: Record<string, AttachmentContentType> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf',
    docx: DOCX,
    pptx: PPTX,
}

const isKnownContentType = (value: string): value is AttachmentContentType =>
    Object.prototype.hasOwnProperty.call(contentTypeKinds, value)

/** The allowed type for a picked file, or null when it is not allowed. */
export const contentTypeOf = (file: {
    name: string
    type: string
}): AttachmentContentType | null => {
    if (isKnownContentType(file.type)) {
        return file.type
    }
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    return extensionTypes[extension] ?? null
}

/** True for any image the browser may be able to re-encode (HEIC included). */
export const isImageFile = (file: { name: string; type: string }) =>
    file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)

/** "1.4 MB" / "820 KB" — for refusals and file rows. */
export const formatBytes = (bytes: number): string =>
    bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`
