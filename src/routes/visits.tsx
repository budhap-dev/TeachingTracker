import { useEffect, useState } from 'react'
import { fetchDailyVisits, type DailyVisits } from '../api/pageVisits'
import { VisitsSnapshotView } from '../components/VisitsSnapshotView'

/**
 * The visits snapshot (REQ-058). It loads on mount and keeps its own state:
 * the counts are read-only, nothing else in the app needs them, and putting
 * them in the store would buy nothing but ceremony.
 */
export const VisitsRoute = () => {
    const [daily, setDaily] = useState<DailyVisits[]>([])
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        let cancelled = false
        fetchDailyVisits()
            .then((days) => {
                if (!cancelled) {
                    setDaily(days)
                }
            })
            // An empty snapshot beats an error page for a counting screen.
            .catch(() => undefined)
            .finally(() => {
                if (!cancelled) {
                    setLoading(false)
                }
            })
        return () => {
            cancelled = true
        }
    }, [])
    return <VisitsSnapshotView daily={daily} loading={loading} />
}
