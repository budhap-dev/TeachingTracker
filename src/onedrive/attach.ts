import {
    createAttachment,
    deleteAttachment,
    fetchAttachments,
} from '../api/attachments'
import type { Attachment } from '../data/attachments'
import type { ScheduledSession, Student } from '../data/students'
import {
    classFolder,
    deleteFolder,
    deleteItem,
    OneDriveNotConnectedError,
    studentFolder,
    uploadFile,
} from './graph'
import { FileRefusedError, prepareFile } from './prepareFile'

/** One attendee's row of the class, with the student it belongs to. */
export type Attendee = {
    session: ScheduledSession
    student: Pick<Student, 'id' | 'firstName' | 'lastName' | 'studentId'>
}

export type AttachOutcome =
    | { fileName: string; ok: true; attachments: Attachment[] }
    | { fileName: string; ok: false; error: unknown }

/**
 * Attaches picked files to a class (REQ-063).
 *
 * Each file is checked and readied once (a photo shrunk and stripped of its
 * metadata), then written into every attendee's own folder — a group class
 * keeps one copy per student (owner decision, 2026-11-12) — and indexed
 * only after OneDrive confirms, so a failed upload leaves no ghost row.
 *
 * One file's failure never stops the others; the outcome says which went.
 * A missing OneDrive connection is thrown, not swallowed — the caller
 * offers "Connect OneDrive" rather than reporting every file as failed.
 */
export const attachFiles = async (
    attendees: Attendee[],
    files: File[],
    onProgress?: (done: number, total: number) => void
): Promise<AttachOutcome[]> => {
    const outcomes: AttachOutcome[] = []
    const total = files.length * attendees.length
    let done = 0

    for (const file of files) {
        const fileStart = done
        try {
            const prepared = await prepareFile(file)
            const attachments: Attachment[] = []
            for (const { session, student } of attendees) {
                const item = await uploadFile(
                    classFolder(student, session.date, session.subject),
                    prepared.fileName,
                    prepared.blob
                )
                attachments.push(
                    await createAttachment({
                        sessionId: session.id,
                        fileName: prepared.fileName,
                        contentType: prepared.contentType,
                        sizeBytes: prepared.blob.size,
                        driveItemId: item.id,
                    })
                )
                onProgress?.(++done, total)
            }
            outcomes.push({ fileName: file.name, ok: true, attachments })
        } catch (error) {
            if (error instanceof OneDriveNotConnectedError) {
                throw error
            }
            // A group copy may have landed for some attendees before the
            // failure; those rows stand and show on their classes.
            done = fileStart + attendees.length
            onProgress?.(done, total)
            outcomes.push({ fileName: file.name, ok: false, error })
        }
    }
    return outcomes
}

/** The words for a failed file, for the teacher. */
export const failureMessage = (error: unknown): string =>
    error instanceof FileRefusedError
        ? error.message
        : 'Could not upload this file. Check the connection and try again.'

/**
 * Removes one file: from OneDrive first, then the index row. If OneDrive
 * fails the row stays, so the file is never orphaned out of sight.
 */
export const removeAttachment = async (attachment: Attachment) => {
    await deleteItem(attachment.driveItemId)
    await deleteAttachment(attachment.id)
}

/**
 * Removes every file of a class (or a whole group class) before the class
 * itself is deleted. The API drops the index rows with the class.
 */
export const removeFilesOf = async (attachments: Attachment[]) => {
    for (const attachment of attachments) {
        await deleteItem(attachment.driveItemId)
    }
}

/**
 * Before a class is deleted: removes its files (every attendee's copy) from
 * OneDrive. The API drops the index rows with the class itself. Throws if
 * OneDrive could not do it — the caller then keeps the class, so no file is
 * left in the drive with nothing pointing at it.
 */
export const removeClassFiles = async (
    members: ScheduledSession[]
): Promise<number> => {
    if (members.length === 0) return 0
    const ids = new Set(members.map((member) => member.id))
    const date = members[0].date
    const files = (await fetchAttachments({ from: date, to: date })).filter(
        (attachment) => ids.has(attachment.sessionId)
    )
    await removeFilesOf(files)
    return files.length
}

/**
 * Erasure (REQ-063): every one of the student's files by id — the teacher may
 * have moved some within the app folder — then their folder. Throws if
 * OneDrive could not do it, so the caller never reports the student erased
 * while files remain.
 */
export const eraseStudentFiles = async (
    student: Pick<Student, 'firstName' | 'lastName' | 'studentId'>,
    attachments: Attachment[]
) => {
    await removeFilesOf(attachments)
    await deleteFolder(studentFolder(student))
}
