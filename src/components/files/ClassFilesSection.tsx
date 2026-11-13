import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, LinearProgress } from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import { fetchAttachments } from '../../api/attachments'
import { connectOneDrive } from '../../auth/msal'
import { ATTACHMENT_ACCEPT } from '../../data/attachments'
import type { ScheduledSession, Student } from '../../data/students'
import {
    type Attendee,
    attachFiles,
    failureMessage,
} from '../../onedrive/attach'
import { OneDriveNotConnectedError } from '../../onedrive/graph'
import { useOneDriveStatus } from '../../onedrive/useOneDrive'
import { type FileGroup, groupCopies } from '../../utils/classFiles'
import { FilesTable } from './FilesTable'
import { FileViewerDialog } from './FileViewerDialog'
import { useRemoveFile } from './useRemoveFile'

type Props = {
    /** Every row of the class — one for a solo class, one per attendee. */
    members: ScheduledSession[]
    students: Student[]
    /** Tells the dialog how many files there are, for its tab label. */
    onCount?: (count: number) => void
}

type Refusal = { fileName: string; message: string }

/**
 * Files on a class (REQ-063), inside the class dialog: attach from the phone
 * camera or from files, see what is there, open it, remove it.
 *
 * Each file goes into every attendee's own OneDrive folder (a group class
 * keeps one copy per student), so here a group's copies show — and are
 * removed — as one file.
 */
export const ClassFilesSection = ({ members, students, onCount }: Props) => {
    const status = useOneDriveStatus()
    const [groups, setGroups] = useState<FileGroup[]>([])
    const [loadFailed, setLoadFailed] = useState(false)
    // Until the first fetch settles, "No files yet" would be a guess.
    const [loaded, setLoaded] = useState(false)
    const [progress, setProgress] = useState<{
        done: number
        total: number
    } | null>(null)
    const [refusals, setRefusals] = useState<Refusal[]>([])
    const [needsConnect, setNeedsConnect] = useState(false)
    const [viewing, setViewing] = useState<number | null>(null)
    const input = useRef<HTMLInputElement>(null)

    const memberIds = members.map((member) => member.id).join(',')
    const date = members[0]?.date

    const load = useCallback(async () => {
        if (!date) return
        try {
            const ids = new Set(memberIds.split(',').map(Number))
            const rows = await fetchAttachments({ from: date, to: date })
            const next = groupCopies(
                rows.filter((row) => ids.has(row.sessionId))
            )
            setGroups(next)
            onCount?.(next.length)
            setLoadFailed(false)
        } catch {
            setLoadFailed(true)
        } finally {
            setLoaded(true)
        }
    }, [memberIds, date, onCount])

    useEffect(() => {
        if (status === 'connected') void load()
    }, [status, load])

    const removal = useRemoveFile({
        onSettled: load,
        onNotConnected: () => setNeedsConnect(true),
    })

    if (status === 'off' || status === 'checking') {
        return null
    }

    if (status === 'disconnected' || needsConnect) {
        return (
            <section className="class-files" aria-label="Files">
                <p className="class-files-hint">
                    Photos and documents for this class are kept in your own
                    OneDrive. Connect it once to start attaching them.
                </p>
                <Button
                    variant="outlined"
                    onClick={() => void connectOneDrive()}
                >
                    Connect OneDrive
                </Button>
            </section>
        )
    }

    const attendees: Attendee[] = members.flatMap((session) => {
        const student = students.find((s) => s.id === session.studentId)
        return student ? [{ session, student }] : []
    })

    const onPick = async (files: File[]) => {
        if (files.length === 0 || attendees.length === 0) return
        setRefusals([])
        setProgress({ done: 0, total: files.length * attendees.length })
        try {
            const outcomes = await attachFiles(
                attendees,
                files,
                (done, total) => setProgress({ done, total })
            )
            setRefusals(
                outcomes.flatMap((outcome) =>
                    outcome.ok
                        ? []
                        : [
                              {
                                  fileName: outcome.fileName,
                                  message: failureMessage(outcome.error),
                              },
                          ]
                )
            )
        } catch (error) {
            if (error instanceof OneDriveNotConnectedError) {
                setNeedsConnect(true)
            } else {
                setRefusals([{ fileName: '', message: failureMessage(error) }])
            }
        } finally {
            // Refresh first: clearing the bar before the list lands would
            // flash "No files yet" under a file that was just uploaded.
            await load()
            setProgress(null)
        }
    }

    return (
        <section className="class-files" aria-label="Files">
            <div className="class-files-header">
                <span className="class-files-hint">
                    Kept in your OneDrive, one copy per student.
                </span>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    disabled={progress !== null}
                    onClick={() => input.current?.click()}
                >
                    Attach files
                </Button>
                <input
                    ref={input}
                    type="file"
                    multiple
                    accept={ATTACHMENT_ACCEPT}
                    hidden
                    data-testid="class-files-input"
                    onChange={(event) => {
                        const files = [...(event.target.files ?? [])]
                        event.target.value = ''
                        void onPick(files)
                    }}
                />
            </div>

            {/* Progress only ticks when a whole copy lands, so a single photo
                would sit at 0% throughout. The buffer's moving dashes mark
                the copy in flight; the count names it ("1 of 1", not "0"). */}
            {progress && (
                <div className="class-files-progress" role="status">
                    <LinearProgress
                        variant="buffer"
                        value={(progress.done / progress.total) * 100}
                        valueBuffer={
                            (Math.min(progress.done + 1, progress.total) /
                                progress.total) *
                            100
                        }
                    />
                    <span>
                        Uploading {Math.min(progress.done + 1, progress.total)}{' '}
                        of {progress.total}…
                    </span>
                </div>
            )}

            {!loaded && (
                <p className="class-files-hint" role="status">
                    Loading files…
                </p>
            )}

            {refusals.map((refusal) => (
                <p
                    key={refusal.fileName + refusal.message}
                    className="class-files-refusal"
                    role="alert"
                >
                    {refusal.fileName && <strong>{refusal.fileName}: </strong>}
                    {refusal.message}
                </p>
            ))}

            {removal.error && (
                <p className="class-files-refusal" role="alert">
                    {removal.error}
                </p>
            )}

            {loadFailed && (
                <p className="class-files-refusal" role="alert">
                    Could not load the files for this class.
                </p>
            )}

            {loaded && groups.length === 0 && !loadFailed && !progress && (
                <p className="class-files-hint">
                    No files yet — a whiteboard photo, a worksheet, a past
                    paper.
                </p>
            )}

            {groups.length > 0 && (
                <FilesTable
                    groups={groups}
                    onPreview={setViewing}
                    onRemove={removal.ask}
                    removingKey={removal.removingKey}
                />
            )}

            <FileViewerDialog
                groups={groups}
                index={viewing}
                onIndexChange={setViewing}
                onCaptionSaved={() => void load()}
            />

            {removal.dialog}
        </section>
    )
}
