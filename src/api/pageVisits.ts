import { apiRequest } from './client'

/** A public page the site counts visits to (REQ-058) — the API's closed list. */
export type PageKey =
    | 'home'
    | 'offerings'
    | 'pricing'
    | 'enquire'
    | 'about'
    | 'reviews'
    | 'faq'
    | 'contact'
    | 'privacy'

/** One day of the teacher's snapshot: distinct visits, and which pages. */
export type DailyVisits = {
    date: string
    visits: number
    pages: { page: PageKey; visits: number }[]
}

/**
 * POST /events — counts one visit to a public page.
 *
 * Fire-and-forget by design: a visitor must never see a counting failure, and
 * the page must never wait for one. Errors are swallowed on purpose.
 */
export const countPageVisit = (visitId: string, page: PageKey): void => {
    void apiRequest<void>('/events', {
        method: 'POST',
        body: { visitId, page },
    }).catch(() => undefined)
}

/** GET /events/daily — teacher: visits per day, newest first. */
export const fetchDailyVisits = (days?: number): Promise<DailyVisits[]> =>
    apiRequest<DailyVisits[]>(
        days ? `/events/daily?days=${days}` : '/events/daily'
    )
