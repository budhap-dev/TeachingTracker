import type { SiteContent } from '../data/siteContent'
import { normaliseSiteContent } from '../data/siteContent'
import { apiRequest } from './client'

/** GET /site-content — public: what the public pages render (REQ-008).
    Normalised so a document from an older API (predating bio/faq) still
    has the full shape — with the new sections empty. */
export const fetchSiteContent = (): Promise<SiteContent> =>
    apiRequest<SiteContent>('/site-content').then(normaliseSiteContent)

/**
 * PUT /site-content — teacher: publish the whole document atomically.
 * The API sanitises server-side and returns the document as stored.
 */
export const updateSiteContent = (
    content: SiteContent
): Promise<SiteContent> =>
    apiRequest<SiteContent>('/site-content', {
        method: 'PUT',
        body: content,
    })
