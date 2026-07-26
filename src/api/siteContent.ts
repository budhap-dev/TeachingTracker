import type { SiteContent } from '../data/siteContent'
import { apiRequest } from './client'

/** GET /site-content — public: what the public pages render (REQ-008). */
export const fetchSiteContent = (): Promise<SiteContent> =>
    apiRequest<SiteContent>('/site-content')

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
