/**
 * Copy for the public-facing pages.
 *
 * Hardcoded for now. REQ-008 replaces this module with content fetched from
 * `GET /site-content` and edited by the teacher in-app — the shape here
 * deliberately mirrors that future payload, so the swap is a change of source
 * rather than a change of shape.
 *
 * TODO(REQ-006/007): the copy below is placeholder. Replace `contact` with the
 * real email and phone, and `offerings` with the real hero, subject list and
 * selling points, before the public pages are announced.
 */

/** One selling point: a short claim, plus the detail that backs it up. */
export type ApproachPoint = {
    title: string
    detail: string
}

/** One step in the "how it works" journey (REQ-017). */
export type JourneyStep = {
    title: string
    detail: string
}

/**
 * A subject offered, with the detail a parent looks for (REQ-016). The extra
 * fields are optional so a subject with nothing but a name still renders — and
 * so this shape stays forgiving when it moves behind the REQ-008 editor.
 */
export type SubjectOffering = {
    name: string
    /** Key stages covered, e.g. `['KS3', 'GCSE']`. */
    keyStages?: string[]
    /** Exam boards taught to, e.g. `['AQA', 'Edexcel']`. */
    examBoards?: string[]
    /** How it's delivered, e.g. `['Online', 'In person']`. */
    modes?: string[]
}

/** The Offerings hero: the promise, and the nudge to act (REQ-015). */
export type OfferingsHero = {
    headline: string
    subhead: string
    /** A scarcity/availability line, e.g. "Now taking Year 10 & 11". */
    availability: string
}

export type SiteContent = {
    contact: {
        email: string
        phone: string
    }
    offerings: {
        hero: OfferingsHero
        subjects: SubjectOffering[]
        journey: JourneyStep[]
        approach: ApproachPoint[]
    }
}

export const siteContent: SiteContent = {
    contact: {
        email: 'hello@example.com',
        phone: '+44 7700 900000',
    },
    offerings: {
        hero: {
            headline: 'Confident tutoring for Years 7 to 13.',
            subhead: 'One-to-one lessons in maths and the sciences — in person or online — matched to your child’s exam board and built around their school week.',
            availability:
                'Now taking a few more Year 10 & 11 students for the autumn term.',
        },
        subjects: [
            {
                name: 'Mathematics',
                keyStages: ['KS3', 'GCSE'],
                examBoards: ['AQA', 'Edexcel', 'OCR'],
                modes: ['Online', 'In person'],
            },
            {
                name: 'Physics',
                keyStages: ['KS3', 'GCSE'],
                examBoards: ['AQA', 'OCR'],
                modes: ['Online', 'In person'],
            },
            {
                name: 'Chemistry',
                keyStages: ['KS3', 'GCSE'],
                examBoards: ['AQA', 'Edexcel'],
                modes: ['Online', 'In person'],
            },
            {
                name: 'Biology',
                keyStages: ['KS3', 'GCSE'],
                examBoards: ['AQA', 'OCR'],
                modes: ['Online', 'In person'],
            },
        ],
        journey: [
            {
                title: 'Enquire',
                detail: 'Tell us the subject, year and what your child wants to get out of tutoring.',
            },
            {
                title: 'Free assessment',
                detail: 'A no-obligation first session to find the gaps and agree what to focus on.',
            },
            {
                title: 'A matched plan',
                detail: 'Lessons mapped to the exam board and school scheme of work — not a generic syllabus.',
            },
            {
                title: 'Weekly sessions',
                detail: 'Regular lessons, each ending with a written note of what we covered and what to practise.',
            },
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

/**
 * A `wa.me` deep link for WhatsApp. The number must be digits only, in
 * international form with no leading `+` — so we drop every non-digit.
 */
export const toWhatsAppHref = (phone: string): string =>
    `https://wa.me/${phone.replace(/\D/g, '')}`
