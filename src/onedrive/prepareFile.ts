import {
    type AttachmentContentType,
    contentTypeOf,
    formatBytes,
    isImageFile,
    MAX_ATTACHMENT_BYTES,
} from '../data/attachments'

/** Long edge after shrinking: plenty for a whiteboard, ~10× smaller. */
const MAX_EDGE = 2000
const JPEG_QUALITY = 0.8

export type PreparedFile = {
    blob: Blob
    fileName: string
    contentType: AttachmentContentType
}

/** A file refused before anything uploads, with words the teacher can act on. */
export class FileRefusedError extends Error {
    constructor(
        public readonly fileName: string,
        message: string
    ) {
        super(message)
        this.name = 'FileRefusedError'
    }
}

const toJpeg = (canvas: HTMLCanvasElement) =>
    new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
            (blob) =>
                blob ? resolve(blob) : reject(new Error('could not encode')),
            'image/jpeg',
            JPEG_QUALITY
        )
    )

/**
 * Redraws a photo through a canvas: at most 2000px on the long edge, JPEG.
 * The redraw keeps only pixels — **EXIF, including GPS, is gone** — which
 * matters because these are photos of children's work, taken at home.
 */
const reencode = async (file: File): Promise<Blob> => {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) {
        bitmap.close()
        throw new Error('no canvas')
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return toJpeg(canvas)
}

const asJpegName = (name: string) => `${name.replace(/\.[^.]+$/, '')}.jpg`

/**
 * Checks and readies one picked file. Photos are always re-encoded (which
 * also strips their metadata) and measured *after* shrinking, so a large
 * phone photo is not refused for its raw size. Throws FileRefusedError for
 * anything the class cannot carry.
 */
export const prepareFile = async (file: File): Promise<PreparedFile> => {
    if (isImageFile(file)) {
        let blob: Blob
        try {
            blob = await reencode(file)
        } catch {
            throw new FileRefusedError(
                file.name,
                'This photo could not be read. Try taking it again, or save it as a JPEG first.'
            )
        }
        return checkSize({
            blob,
            fileName: asJpegName(file.name),
            contentType: 'image/jpeg',
        })
    }

    const contentType = contentTypeOf(file)
    if (!contentType) {
        throw new FileRefusedError(
            file.name,
            'Only photos, PDFs, and Word or PowerPoint files (.docx, .pptx) can be attached.'
        )
    }
    return checkSize({ blob: file, fileName: file.name, contentType })
}

const checkSize = (prepared: PreparedFile): PreparedFile => {
    if (prepared.blob.size > MAX_ATTACHMENT_BYTES) {
        throw new FileRefusedError(
            prepared.fileName,
            `This file is ${formatBytes(prepared.blob.size)} — the limit is 20 MB.`
        )
    }
    return prepared
}
