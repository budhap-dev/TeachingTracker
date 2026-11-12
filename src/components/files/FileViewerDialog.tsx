import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import { updateAttachmentCaption } from '../../api/attachments'
import type { Attachment } from '../../data/attachments'
import { downloadAttachment } from '../../onedrive/attach'
import { downloadUrl, previewUrl } from '../../onedrive/graph'
import { formatDayLabel } from '../../utils/calendar'
import { classLinkFor, type FileGroup, whoFor } from '../../utils/classFiles'

type View =
    | { state: 'loading' }
    | { state: 'blob'; url: string }
    | { state: 'preview'; url: string }
    | { state: 'failed' }

type Props = {
    /** The files that can be stepped through, in order. */
    groups: FileGroup[]
    /** Which one is open, or null when closed. */
    index: number | null
    onIndexChange: (index: number | null) => void
    /** Called with every copy once a caption is saved. */
    onCaptionSaved?: (updated: Attachment[]) => void
    /** Offer "Go to class" — off inside the class itself. */
    showClassLink?: boolean
}

/**
 * Looks at files without leaving the app (REQ-063). Photos and PDFs are
 * fetched through their short-lived download link and shown from a local
 * blob — the photo as an image, the PDF in the browser's own viewer. Word
 * and PowerPoint go through OneDrive's embeddable preview.
 *
 * Steps through a set with ‹ › (or the arrow keys), carries the caption —
 * saved to every student's copy — and a way back to the class.
 */
export const FileViewerDialog = ({
    groups,
    index,
    onIndexChange,
    onCaptionSaved,
    showClassLink = false,
}: Props) => {
    const group = index === null ? null : (groups[index] ?? null)
    const attachment = group?.file ?? null
    const [view, setView] = useState<View>({ state: 'loading' })
    const [caption, setCaption] = useState('')
    const [saving, setSaving] = useState(false)
    const [captionError, setCaptionError] = useState(false)

    useEffect(() => {
        setCaption(attachment?.caption ?? '')
        setCaptionError(false)
    }, [attachment])

    useEffect(() => {
        if (!attachment) {
            return
        }
        let live = true
        let objectUrl: string | null = null
        setView({ state: 'loading' })
        const load = async (): Promise<View> => {
            if (attachment.kind === 'photo' || attachment.kind === 'pdf') {
                const response = await fetch(
                    await downloadUrl(attachment.driveItemId)
                )
                if (!response.ok) throw new Error(String(response.status))
                const blob = await response.blob()
                objectUrl = URL.createObjectURL(
                    new Blob([blob], { type: attachment.contentType })
                )
                return { state: 'blob', url: objectUrl }
            }
            return {
                state: 'preview',
                url: await previewUrl(attachment.driveItemId),
            }
        }
        load()
            .then((next) => live && setView(next))
            .catch(() => live && setView({ state: 'failed' }))
        return () => {
            live = false
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [attachment])

    const hasPrev = index !== null && index > 0
    const hasNext = index !== null && index < groups.length - 1
    const step = (by: number) => {
        if (index !== null) onIndexChange(index + by)
    }

    // Arrow keys step while the viewer is open — listened for on the page,
    // because reaching either end disables its button and drops focus out
    // of the dialog. Never while typing a caption.
    useEffect(() => {
        if (index === null) return
        const onKey = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement) return
            if (event.key === 'ArrowLeft' && index > 0) {
                onIndexChange(index - 1)
            }
            if (event.key === 'ArrowRight' && index < groups.length - 1) {
                onIndexChange(index + 1)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [index, groups.length, onIndexChange])


    const saveCaption = async () => {
        if (!group) return
        setSaving(true)
        setCaptionError(false)
        try {
            const updated = await Promise.all(
                group.copies.map((copy) =>
                    updateAttachmentCaption(copy.id, caption.trim())
                )
            )
            onCaptionSaved?.(updated)
        } catch {
            setCaptionError(true)
        } finally {
            setSaving(false)
        }
    }

    const captionChanged = caption.trim() !== (attachment?.caption ?? '')

    return (
        <Dialog
            open={attachment !== null}
            onClose={() => onIndexChange(null)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className="modal-header">
                <span className="file-viewer-title">
                    {attachment?.fileName}
                    {attachment && (
                        <small>
                            {formatDayLabel(attachment.date)} ·{' '}
                            {attachment.subject}
                            {group && ` · ${whoFor(group)}`}
                        </small>
                    )}
                </span>
                <span className="modal-header-actions">
                    {groups.length > 1 && index !== null && (
                        <span className="file-viewer-steps">
                            <IconButton
                                aria-label="Previous file"
                                size="small"
                                disabled={!hasPrev}
                                onClick={() => step(-1)}
                            >
                                <ChevronLeftIcon fontSize="small" />
                            </IconButton>
                            <span>
                                {index + 1} / {groups.length}
                            </span>
                            <IconButton
                                aria-label="Next file"
                                size="small"
                                disabled={!hasNext}
                                onClick={() => step(1)}
                            >
                                <ChevronRightIcon fontSize="small" />
                            </IconButton>
                        </span>
                    )}
                    <IconButton
                        aria-label="Close"
                        size="small"
                        onClick={() => onIndexChange(null)}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </span>
            </DialogTitle>
            <DialogContent className="file-viewer">
                {view.state === 'loading' && (
                    <p className="file-viewer-status">Opening…</p>
                )}
                {view.state === 'failed' && (
                    <p className="file-viewer-status" role="alert">
                        Could not open this file. Try Download instead.
                    </p>
                )}
                {view.state === 'blob' && attachment?.kind === 'photo' && (
                    <img src={view.url} alt={attachment.fileName} />
                )}
                {view.state === 'blob' && attachment?.kind === 'pdf' && (
                    <iframe src={view.url} title={attachment.fileName} />
                )}
                {view.state === 'preview' && attachment && (
                    <iframe src={view.url} title={attachment.fileName} />
                )}

                <div className="file-viewer-footer">
                    <TextField
                        size="small"
                        label="Caption"
                        placeholder="e.g. Question 3, marked"
                        value={caption}
                        onChange={(event) => setCaption(event.target.value)}
                        slotProps={{ htmlInput: { maxLength: 300 } }}
                    />
                    <Button
                        variant="outlined"
                        size="small"
                        disabled={!captionChanged || saving}
                        onClick={() => void saveCaption()}
                    >
                        Save caption
                    </Button>
                    <Button size="small" onClick={() => attachment && void downloadAttachment(attachment)}>
                        Download
                    </Button>
                    {showClassLink && attachment && (
                        <Button
                            size="small"
                            component={Link}
                            to={classLinkFor(attachment)}
                        >
                            Go to class
                        </Button>
                    )}
                </div>
                {captionError && (
                    <p className="class-files-refusal" role="alert">
                        Could not save the caption. Try again.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    )
}
