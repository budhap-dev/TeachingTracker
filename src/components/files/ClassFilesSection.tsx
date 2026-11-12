import { useCallback, useEffect, useRef, useState } from 'react'
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    LinearProgress,
} from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineRounded'
import { deleteAttachment, fetchAttachments } from '../../api/attachments'
import { connectOneDrive } from '../../auth/msal'
import {
    ATTACHMENT_ACCEPT,
    type Attachment,
    formatBytes,
} from '../../data/attachments'
import type { ScheduledSession, Student } from '../../data/students'
import {
    type Attendee,
    attachFiles,
    failureMessage,
    removeFilesOf,
} from '../../onedrive/attach'
import { OneDriveNotConnectedError } from '../../onedrive/graph'
import { useOneDriveStatus } from '../../onedrive/useOneDrive'
import { type FileGroup, groupCopies } from '../../utils/classFiles'
import { FileThumb } from './FileThumb'
import { FileViewerDialog } from './FileViewerDialog'

type Props = {
    /** Every row of the class — one for a solo class, one per attendee. */
    members: ScheduledSession[]
    students: Student[]
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
export const ClassFilesSection = ({ members, students }: Props) => {
    const status = useOneDriveStatus()
    const [groups, setGroups] = useState<FileGroup[]>([])
    const [loadFailed, setLoadFailed] = useState(false)
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
    const [refusals, setRefusals] = useState<Refusal[]>([])
    const [needsConnect, setNeedsConnect] = useState(false)
    const [viewing, setViewing] = useState<Attachment | null>(null)
    const [removing, setRemoving] = useState<string | null>(null)
    const [confirming, setConfirming] = useState<FileGroup | null>(null)
    const input = useRef<HTMLInputElement>(null)

    const memberIds = members.map((member) => member.id).join(',')
    const date = members[0]?.date

    const load = useCallback(async () => {
        if (!date) return
        try {
            const ids = new Set(memberIds.split(',').map(Number))
            const rows = await fetchAttachments({ from: date, to: date })
            setGroups(groupCopies(rows.filter((row) => ids.has(row.sessionId))))
            setLoadFailed(false)
        } catch {
            setLoadFailed(true)
        }
    }, [memberIds, date])

    useEffect(() => {
        if (status === 'connected') void load()
    }, [status, load])

    if (status === 'off' || status === 'checking') {
        return null
    }

    if (status === 'disconnected' || needsConnect) {
        return (
            <section className="class-files" aria-label="Files">
                <h4>Files</h4>
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
            const outcomes = await attachFiles(attendees, files, (done, total) =>
                setProgress({ done, total })
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
                setRefusals([
                    { fileName: '', message: failureMessage(error) },
                ])
            }
        } finally {
            setProgress(null)
            await load()
        }
    }

    const onRemove = async (group: FileGroup) => {
        setRemoving(group.key)
        try {
            await removeFilesOf(group.copies)
            for (const copy of group.copies) {
                await deleteAttachment(copy.id)
            }
        } catch (error) {
            if (error instanceof OneDriveNotConnectedError) {
                setNeedsConnect(true)
            } else {
                setRefusals([
                    {
                        fileName: group.file.fileName,
                        message: 'Could not remove this file. Try again.',
                    },
                ])
            }
        } finally {
            setRemoving(null)
            await load()
        }
    }

    return (
        <section className="class-files" aria-label="Files">
            <div className="class-files-header">
                <h4>Files{groups.length > 0 ? ` (${groups.length})` : ''}</h4>
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

            {progress && (
                <div className="class-files-progress" role="status">
                    <LinearProgress
                        variant="determinate"
                        value={(progress.done / progress.total) * 100}
                    />
                    <span>
                        Uploading {progress.done} of {progress.total}…
                    </span>
                </div>
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

            {loadFailed && (
                <p className="class-files-refusal" role="alert">
                    Could not load the files for this class.
                </p>
            )}

            {groups.length === 0 && !loadFailed && !progress && (
                <p className="class-files-hint">
                    No files yet — a whiteboard photo, a worksheet, a past
                    paper.
                </p>
            )}

            {groups.length > 0 && (
                <ul className="class-files-list">
                    {groups.map((group) => (
                        <li key={group.key}>
                            <button
                                type="button"
                                className="class-files-open"
                                onClick={() => setViewing(group.file)}
                            >
                                <FileThumb attachment={group.file} />
                                <span className="class-files-name">
                                    {group.file.fileName}
                                    <small>
                                        {formatBytes(group.file.sizeBytes)}
                                        {group.copies.length > 1 &&
                                            ` · ${group.copies.length} students`}
                                    </small>
                                </span>
                            </button>
                            <IconButton
                                aria-label={`Remove ${group.file.fileName}`}
                                size="small"
                                disabled={removing === group.key}
                                onClick={() => setConfirming(group)}
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </li>
                    ))}
                </ul>
            )}

            <FileViewerDialog
                attachment={viewing}
                onClose={() => setViewing(null)}
            />

            <Dialog
                open={confirming !== null}
                onClose={() => setConfirming(null)}
                maxWidth="xs"
            >
                <DialogTitle>Remove this file?</DialogTitle>
                <DialogContent>
                    <p className="session-summary-meta">
                        {confirming?.file.fileName}
                    </p>
                    <p className="delete-warning">
                        {confirming && confirming.copies.length > 1
                            ? `It goes from all ${confirming.copies.length} students' folders in your OneDrive (to its recycle bin).`
                            : 'It goes from your OneDrive (to its recycle bin).'}
                    </p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirming(null)}>Keep</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => {
                            const group = confirming
                            setConfirming(null)
                            if (group) void onRemove(group)
                        }}
                    >
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>
        </section>
    )
}
