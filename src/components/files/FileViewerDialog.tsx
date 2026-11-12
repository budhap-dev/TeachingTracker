import { useEffect, useState } from 'react'
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { Attachment } from '../../data/attachments'
import { downloadUrl, previewUrl } from '../../onedrive/graph'

type View =
    | { state: 'loading' }
    | { state: 'blob'; url: string }
    | { state: 'preview'; url: string }
    | { state: 'failed' }

/**
 * Looks at a file without leaving the app (REQ-063). Photos and PDFs are
 * fetched through their short-lived download link and shown from a local
 * blob — the photo as an image, the PDF in the browser's own viewer. Word
 * and PowerPoint go through OneDrive's embeddable preview.
 */
export const FileViewerDialog = ({
    attachment,
    onClose,
}: {
    attachment: Attachment | null
    onClose: () => void
}) => {
    const [view, setView] = useState<View>({ state: 'loading' })

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

    const download = async () => {
        if (!attachment) return
        const link = document.createElement('a')
        link.href = await downloadUrl(attachment.driveItemId)
        link.download = attachment.fileName
        link.rel = 'noopener'
        link.click()
    }

    return (
        <Dialog
            open={attachment !== null}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className="modal-header">
                <span className="file-viewer-title">
                    {attachment?.fileName}
                </span>
                <span className="modal-header-actions">
                    <Button size="small" onClick={() => void download()}>
                        Download
                    </Button>
                    <IconButton
                        aria-label="Close"
                        size="small"
                        onClick={onClose}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </span>
            </DialogTitle>
            <DialogContent className="file-viewer">
                {attachment?.caption && (
                    <p className="file-viewer-caption">{attachment.caption}</p>
                )}
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
            </DialogContent>
        </Dialog>
    )
}
