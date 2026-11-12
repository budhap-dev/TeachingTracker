import { useEffect, useState } from 'react'
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material'
import { fetchAttachments } from '../api/attachments'
import { deleteStudent } from '../api/students'
import { connectOneDrive, isOneDriveEnabled } from '../auth/msal'
import type { Student } from '../data/students'
import { eraseStudentFiles } from '../onedrive/attach'
import { OneDriveNotConnectedError } from '../onedrive/graph'

type Props = {
    student: Student
    open: boolean
    onClose: () => void
    /** The student is gone — server-side, and from OneDrive. */
    onErased: (id: number) => void
}

type Problem = 'not-connected' | 'files' | 'record' | null

/**
 * Erasing a student for good (REQ-063, owner decision 2026-11-12): offered
 * only on an archived student, behind typing their name.
 *
 * Their files go first — every one by id (the teacher may have moved some
 * within the app folder), then their folder — because only the browser can
 * reach OneDrive. If that fails, nothing is erased and the dialog says so:
 * the student is never reported erased while files remain. Then the API
 * erases the record with its classes, payments and file index. Retrying is
 * safe at either step: OneDrive treats already-gone as done.
 */
export const EraseStudentDialog = ({
    student,
    open,
    onClose,
    onErased,
}: Props) => {
    const fullName = `${student.firstName} ${student.lastName}`
    const withFiles = isOneDriveEnabled()
    const [typed, setTyped] = useState('')
    const [fileCount, setFileCount] = useState<number | null>(null)
    const [busy, setBusy] = useState(false)
    const [problem, setProblem] = useState<Problem>(null)

    useEffect(() => {
        if (!open) return
        setTyped('')
        setProblem(null)
        setFileCount(null)
        if (!withFiles) return
        let live = true
        fetchAttachments({ studentId: student.id })
            .then((rows) => live && setFileCount(rows.length))
            .catch(() => live && setFileCount(null))
        return () => {
            live = false
        }
    }, [open, withFiles, student.id])

    const confirmed =
        typed.trim().toLowerCase() === fullName.trim().toLowerCase()

    const erase = async () => {
        setBusy(true)
        setProblem(null)
        try {
            if (withFiles) {
                try {
                    await eraseStudentFiles(
                        student,
                        await fetchAttachments({ studentId: student.id })
                    )
                } catch (error) {
                    setProblem(
                        error instanceof OneDriveNotConnectedError
                            ? 'not-connected'
                            : 'files'
                    )
                    return
                }
            }
            try {
                await deleteStudent(student.id)
            } catch {
                setProblem('record')
                return
            }
            onErased(student.id)
        } finally {
            setBusy(false)
        }
    }

    const what = [
        'their record, classes and payment history',
        withFiles &&
            (fileCount === null
                ? 'their files in your OneDrive'
                : `${fileCount} ${fileCount === 1 ? 'file' : 'files'} in your OneDrive`),
    ]
        .filter(Boolean)
        .join(', and ')

    return (
        <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs">
            <DialogTitle>Erase {fullName}?</DialogTitle>
            <DialogContent className="erase-student">
                <p className="delete-warning">
                    This removes {what}. It cannot be undone.
                </p>
                <TextField
                    size="small"
                    fullWidth
                    label="Type their name to confirm"
                    placeholder={fullName}
                    value={typed}
                    disabled={busy}
                    onChange={(event) => setTyped(event.target.value)}
                />
                {problem === 'not-connected' && (
                    <div className="class-files-refusal" role="alert">
                        <p>
                            Their files are in your OneDrive. Connect it, then
                            erase again — nothing has been erased yet.
                        </p>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => void connectOneDrive()}
                        >
                            Connect OneDrive
                        </Button>
                    </div>
                )}
                {problem === 'files' && (
                    <p className="class-files-refusal" role="alert">
                        Could not remove their files from OneDrive, so nothing
                        was erased. Try again.
                    </p>
                )}
                {problem === 'record' && (
                    <p className="class-files-refusal" role="alert">
                        Their files are gone from OneDrive, but the record
                        could not be erased. Try again.
                    </p>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={busy}>
                    Keep
                </Button>
                <Button
                    color="error"
                    variant="contained"
                    disabled={!confirmed || busy}
                    onClick={() => void erase()}
                >
                    {problem ? 'Try again' : 'Erase permanently'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
