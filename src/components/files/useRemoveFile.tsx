import { useState } from 'react'
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@mui/material'
import { removeFileCopies } from '../../onedrive/attach'
import { OneDriveNotConnectedError } from '../../onedrive/graph'
import type { FileGroup } from '../../utils/classFiles'

type Options = {
    /** After a removal is tried, either way — reload the list. */
    onSettled: () => void | Promise<void>
    /** OneDrive needs connecting again. */
    onNotConnected: () => void
}

/**
 * Removing a file, the same wherever it is offered (REQ-063): ask first,
 * then take every student's copy — OneDrive, then the index. Returns the
 * `ask` to wire to a Remove button, the key being removed, an error to show,
 * and the confirmation dialog to render.
 */
export const useRemoveFile = ({ onSettled, onNotConnected }: Options) => {
    const [confirming, setConfirming] = useState<FileGroup | null>(null)
    const [removingKey, setRemovingKey] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const remove = async (group: FileGroup) => {
        setRemovingKey(group.key)
        setError(null)
        try {
            await removeFileCopies(group.copies)
        } catch (failure) {
            if (failure instanceof OneDriveNotConnectedError) {
                onNotConnected()
            } else {
                setError(
                    `Could not remove ${group.file.fileName}. Try again.`
                )
            }
        } finally {
            setRemovingKey(null)
            await onSettled()
        }
    }

    const dialog = (
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
                        if (group) void remove(group)
                    }}
                >
                    Remove
                </Button>
            </DialogActions>
        </Dialog>
    )

    return { ask: setConfirming, removingKey, error, dialog }
}
