import { LinearProgress } from '@mui/material'
import { useAppSelector } from '../hooks'

/**
 * A thin progress bar pinned to the top of the page whenever any API
 * operation is in flight — initial loads and saves alike. One global signal,
 * so screens don't each invent a spinner.
 */
export const BusyBar = () => {
    const busy = useAppSelector((state) => {
        const students = state.students
        return (
            students.loading ||
            students.paymentsLoading ||
            students.sessionsLoading ||
            students.savingStudent ||
            students.savingSession ||
            students.savingPayment
        )
    })

    if (!busy) {
        return null
    }
    return <LinearProgress className="busy-bar" aria-label="Working…" />
}
