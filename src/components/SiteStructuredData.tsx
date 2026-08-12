import { useEffect } from 'react'
import { useAppSelector } from '../hooks'
import type { SiteContent } from '../data/siteContent'
import type { Testimonial } from '../data/students'
import { buildLocalBusinessJsonLd } from '../utils/structuredData'

/** The id keeps one block on the page: a remount replaces, never duplicates. */
const SCRIPT_ID = 'ld-local-business'

/**
 * Publishes the LocalBusiness JSON-LD (REQ-043) into the document head while
 * the public landing is mounted, and takes it away on unmount — the same
 * shape as useDocumentMeta, so the teacher's screens never carry it.
 *
 * Renders nothing.
 */
export const SiteStructuredData = ({
    content,
    testimonials,
}: {
    content: SiteContent
    testimonials: Testimonial[]
}) => {
    // Published by the teacher on the Contact page; the Sidebar loads it
    // app-wide, and an unpublished channel is simply left out of the markup.
    const contact = useAppSelector((state) => state.students.contact)

    useEffect(() => {
        const data = buildLocalBusinessJsonLd({
            content,
            testimonials,
            contact,
            origin: window.location.origin,
        })
        if (!data) {
            return
        }
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.id = SCRIPT_ID
        script.textContent = JSON.stringify(data)
        document.getElementById(SCRIPT_ID)?.remove()
        document.head.appendChild(script)
        return () => script.remove()
    }, [content, testimonials, contact])

    return null
}
