import { useEffect, useState } from 'react'

/**
 * The current time, refreshed once a minute (REQ-062).
 *
 * A reminder that passes at 3pm has to leave the list at 3pm, and the
 * dashboard is a screen people leave open all morning — read once at mount,
 * "what's coming up" would keep offering something that had already gone until
 * the next reload.
 *
 * A minute is the finest granularity a reminder carries, so a shorter interval
 * would re-render for nothing. The timer is cleared on unmount, and no state is
 * set after it.
 */
export const useMinuteTick = (): Date => {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60_000)
        return () => clearInterval(timer)
    }, [])
    return now
}
