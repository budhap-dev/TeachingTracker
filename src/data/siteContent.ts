/**
 * Copy for the public-facing pages.
 *
 * Hardcoded for now. REQ-008 replaces this module with content fetched from
 * `GET /site-content` and edited by the teacher in-app — the shape here
 * deliberately mirrors that future payload, so the swap is a change of source
 * rather than a change of shape.
 *
 * TODO(REQ-006/007): the copy below is placeholder. Replace `contact` with the
 * real email and phone, and `offerings` with the real subject list and selling
 * points, before the public pages are announced.
 */

/** One selling point: a short claim, plus the detail that backs it up. */
export type ApproachPoint = {
    title: string
    detail: string
}

export type SiteContent = {
    contact: {
        email: string
        phone: string
    }
    offerings: {
        intro: string
        subjects: string[]
        approach: ApproachPoint[]
    }
}

export const siteContent: SiteContent = {
    contact: {
        email: 'hello@example.com',
        phone: '+44 7700 900000',
    },
    offerings: {
        intro: 'One-to-one tutoring for Years 8 to 11, in person or online.',
        subjects: [
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology',
            'English',
            'History',
        ],
        approach: [
            {
                title: 'Grouped by year and subject',
                detail: 'Students are matched to the syllabus and exam board they are actually sitting, never to whatever slot happened to be free.',
            },
            {
                title: 'Progress recorded every session',
                detail: 'Each lesson ends with a written note: what we covered, what went well, and what to practise before next time.',
            },
            {
                title: 'Planned around school, not on top of it',
                detail: 'Lessons follow the school scheme of work, so tutoring reinforces the week rather than competing with it.',
            },
            {
                title: 'Parents kept in the loop',
                detail: 'You get a clear picture of where your child stands, without having to ask for it.',
            },
        ],
    },
}

/** Strips spacing so a displayed number is still a valid `tel:` target. */
export const toTelHref = (phone: string): string =>
    `tel:${phone.replace(/[^+\d]/g, '')}`
