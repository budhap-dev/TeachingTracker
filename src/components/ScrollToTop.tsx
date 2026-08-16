import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to the top of the page whenever the route changes — unless the URL
 * names an anchor.
 *
 * A link like `/reviews#review-7` (REQ-059's "Read this review") says exactly
 * where the visitor wants to be, and a route change that jumps to the top
 * would land them somewhere they did not ask for. The page owning the anchor
 * does the scrolling; this only has to stay out of its way.
 */
export const ScrollToTop = () => {
    const { pathname, hash } = useLocation()
    useEffect(() => {
        if (hash) {
            return
        }
        window.scrollTo({ top: 0, left: 0 })
    }, [pathname, hash])
    return null
}
