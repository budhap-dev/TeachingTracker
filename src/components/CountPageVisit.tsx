import { useEffect } from 'react'
import { useIsAuthenticated } from '@azure/msal-react'
import { isAuthConfigured } from '../auth/msal'
import { countPageVisit, type PageKey } from '../api/pageVisits'

/**
 * The visit id (REQ-058).
 *
 * A module-level constant — it lives in memory for as long as the tab does
 * and is **never written to the device**. That is not an implementation
 * detail: putting it in a cookie or localStorage is exactly what would bring
 * this under PECR's consent rule and make the privacy page's "no cookie
 * banner" promise untrue. The cost is honest and documented — a reload is a
 * new visit, so the number is visits, never people.
 */
const visitId = Math.random().toString(36).slice(2, 14)

/** Pages already counted for this visit: reaching one twice is still one. */
const counted = new Set<PageKey>()

const count = (page: PageKey, isTeacher: boolean) => {
    if (isTeacher || counted.has(page)) {
        return
    }
    counted.add(page)
    countPageVisit(visitId, page)
}

/** The counting itself, once the caller knows who is looking. */
const useCount = (page: PageKey, isTeacher: boolean) => {
    useEffect(() => {
        count(page, isTeacher)
    }, [page, isTeacher])
}

/**
 * Under MSAL the hook must sit beneath the provider, so the signed-in check
 * lives in its own component — the same split Sidebar and TopbarAuth use.
 */
const CountingSignedAware = ({ page }: { page: PageKey }) => {
    useCount(page, useIsAuthenticated())
    return null
}

/** Auth-less builds (local, tests) are the teacher by definition: no count. */
const CountingAuthless = ({ page }: { page: PageKey }) => {
    useCount(page, true)
    return null
}

/**
 * Counts one visit to a public page — never the teacher's own browsing,
 * which would drown the numbers and is nobody's business but theirs.
 *
 * A component rather than a hook, because whether the MSAL hook may be called
 * at all depends on how the app was built.
 */
export const CountPageVisit = ({ page }: { page: PageKey }) =>
    isAuthConfigured() ? (
        <CountingSignedAware page={page} />
    ) : (
        <CountingAuthless page={page} />
    )
