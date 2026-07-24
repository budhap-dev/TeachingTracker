import { useEffect } from 'react'

/** The site-wide defaults from index.html, restored when a page unmounts. */
const DEFAULT_TITLE = 'Springboard Tutoring — one-to-one tutoring that builds confidence'
const DEFAULT_DESCRIPTION =
    'Personal tutoring in maths and the sciences for Years 7–13, online or in person. Matched to your exam board, planned around the school week.'

/**
 * Per-route SEO meta (REQ-023): sets the document title and meta description
 * while the page is mounted, restoring the defaults on unmount. The same tags
 * exist statically in index.html, so crawlers that skip JS still see the
 * defaults; this keeps the tab title and JS-running crawlers per-page.
 */
export const useDocumentMeta = (title: string, description: string): void => {
    useEffect(() => {
        document.title = title
        const meta = document.querySelector('meta[name="description"]')
        meta?.setAttribute('content', description)
        return () => {
            document.title = DEFAULT_TITLE
            meta?.setAttribute('content', DEFAULT_DESCRIPTION)
        }
    }, [title, description])
}
