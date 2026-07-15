/**
 * Copy for the public-facing pages.
 *
 * Hardcoded for now. REQ-008 replaces this module with content fetched from
 * `GET /site-content` and edited by the teacher in-app — the shape here
 * deliberately mirrors that future payload, so the swap is a change of source
 * rather than a change of shape.
 *
 * TODO(REQ-007): `contact` holds placeholder details. Replace with the real
 * email address and phone number before the public pages are announced.
 */

export type SiteContent = {
    contact: {
        email: string
        phone: string
    }
}

export const siteContent: SiteContent = {
    contact: {
        email: 'hello@example.com',
        phone: '+44 7700 900000',
    },
}

/** Strips spacing so a displayed number is still a valid `tel:` target. */
export const toTelHref = (phone: string): string =>
    `tel:${phone.replace(/[^+\d]/g, '')}`
