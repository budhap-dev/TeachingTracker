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

    return (
        <Snackbar
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
