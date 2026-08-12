import { useRef } from 'react'
import { Alert, Snackbar } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../hooks'
import { dismissNotice } from '../store/store'

/**
 * One toast for every API outcome: reducers set `notice` on success and
 * failure, and this renders whichever is current. Success fades on its own;
 * an error stays until dismissed, because it asks the teacher to act.
 */
export const NoticeToast = () => {
    const dispatch = useAppDispatch()
    const notice = useAppSelector((state) => state.students.notice)
    // Every notice gets its own full life. MUI starts the auto-hide timer
    // when the Snackbar opens, not when its message changes, so a second
    // action inside the first toast's 3.5s (edit a class, then cancel it)
    // used to inherit what was left of the first timer and could flash by
    // in a fraction of a second. Re-keying remounts it, restarting the
    // clock. The counter, not the message, is the key: cancelling two
    // classes in a row produces identical text and must still re-arm.
    const seq = useRef(0)
    const shown = useRef(notice)
    if (notice && notice !== shown.current) {
        // The reducer builds a fresh notice object each time, so identity
        // changes even when the words do not.
        shown.current = notice
        seq.current += 1
    }

    return (
        <Snackbar
            key={seq.current}
            open={notice !== null}
            autoHideDuration={notice?.kind === 'success' ? 3500 : null}
            onClose={(_event, reason) => {
                // Clicking elsewhere shouldn't eat an error the teacher
                // hasn't read; only the timer or the ✕ dismisses.
                if (reason !== 'clickaway') {
                    dispatch(dismissNotice())
                }
            }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            {notice ? (
                <Alert
                    severity={notice.kind}
                    variant="filled"
                    onClose={() => dispatch(dismissNotice())}
                >
                    {notice.message}
                </Alert>
            ) : undefined}
        </Snackbar>
    )
}
