/**
 * The public site's content (REQ-008).
 *
 * The live document comes from `GET /site-content` — teacher-edited in the
 * portal, published with no deploy. This module holds its type and the
 * bundled fallback: what renders until the API answers, and what keeps the
 * public pages whole if it never does (graceful degradation, never blank).
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
 * fields are optional so a subject with nothing but a name still renders.
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

/** The hero: the promise, and the nudge to act (REQ-015). */
export type OfferingsHero = {
    headline: string
    subhead: string
    /** A scarcity/availability line, e.g. "Now taking Year 10 & 11". */
    availability: string
}

/** The free-form section: a heading plus a Markdown body (REQ-008). */
export type FreeformSection = {
    heading: string
    /** Markdown only — the API strips raw HTML on write, and the frontend
        renders it to React nodes, never to raw markup. */
    markdown: string
}

/** The reorderable page sections, in their canonical order (REQ-008). */
export const sectionKeys = [
    'hero',
    'subjects',
    'journey',
    'approach',
    'freeform',
] as const

export type SectionKey = (typeof sectionKeys)[number]

/**
 * The whole editable document, as served by `GET /site-content`.
 * `sectionOrder` holds each key exactly once and dictates the order the
 * Offerings page renders its sections.
 */
export type SiteContent = {
    siteName: string
    hero: OfferingsHero
    subjects: SubjectOffering[]
    journey: JourneyStep[]
    approach: ApproachPoint[]
    freeform: FreeformSection
    sectionOrder: SectionKey[]
}

/** The bundled fallback — the same copy the site has always shipped. */
export const defaultSiteContent: SiteContent = {
    siteName: 'Springboard Tutoring',
    hero: {
        headline: 'Confident tutoring for Years 7 to 13.',
        subhead: 'One-to-one lessons in maths and the sciences, from KS3 through GCSE to A-level — in person or online, matched to your child’s exam board and built around their school week.',
        // Blank by default — the page hides the line until the teacher
        // publishes one via the site editor.
        availability: '',
    },
    subjects: [
        {
            name: 'Mathematics',
            keyStages: ['KS3', 'GCSE', 'A-level'],
            examBoards: ['AQA', 'Edexcel', 'OCR'],
            modes: ['Online', 'In person'],
        },
        {
            name: 'Physics',
            keyStages: ['KS3', 'GCSE', 'A-level'],
            examBoards: ['AQA', 'OCR'],
            modes: ['Online', 'In person'],
        },
        {
            name: 'Chemistry',
            keyStages: ['KS3', 'GCSE', 'A-level'],
            examBoards: ['AQA', 'Edexcel'],
            modes: ['Online', 'In person'],
        },
        {
            name: 'Biology',
            keyStages: ['KS3', 'GCSE', 'A-level'],
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
    // Empty until the teacher writes one — an empty section renders nothing.
    freeform: { heading: '', markdown: '' },
    sectionOrder: ['hero', 'subjects', 'journey', 'approach', 'freeform'],
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
