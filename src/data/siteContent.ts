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
    /** Years of tutoring experience — leads the Home outcomes strip as
        "20+ years of tutoring experience". 0/absent hides the tile. */
    experienceYears?: number
}

/** The free-form section: a heading plus a Markdown body (REQ-008). */
export type FreeformSection = {
    heading: string
    /** Markdown only — the API strips raw HTML on write, and the frontend
        renders it to React nodes, never to raw markup. */
    markdown: string
}

/**
 * The tutor bio + safeguarding (REQ-021). Every field may be empty and the
 * public section hides until something is written — nothing here is ever
 * invented on the owner's behalf, least of all the DBS indicator.
 */
export type BioSection = {
    /** e.g. "Meet your tutor". */
    heading: string
    /** Who the tutor is — Markdown, like the free-form section. */
    body: string
    /** Qualification bullet lines, e.g. "PGCE, Secondary Mathematics". */
    qualifications: string[]
    /** Shows the DBS-checked indicator — only ever set by the owner. */
    dbsChecked: boolean
    /** A short safeguarding statement. */
    safeguarding: string
}

/** One FAQ entry (REQ-025). Plain text; the API strips HTML on write. */
export type FaqItem = {
    question: string
    answer: string
}

/** The reorderable page sections, in their canonical order (REQ-008). */
export const sectionKeys = [
    'hero',
    'subjects',
    'journey',
    'approach',
    'bio',
    'faq',
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
    bio: BioSection
    faq: FaqItem[]
    freeform: FreeformSection
    sectionOrder: SectionKey[]
}

/** An empty bio — what older documents are filled with, and the reset. */
export const emptyBio: BioSection = {
    heading: '',
    body: '',
    qualifications: [],
    dbsChecked: false,
    safeguarding: '',
}

/**
 * Fills a document from an older API (no bio/faq, 5-key order) so every
 * consumer sees the full shape — with EMPTY new sections, never drafts the
 * owner hasn't approved.
 */
export const normaliseSiteContent = (
    content: SiteContent
): SiteContent => ({
    ...content,
    bio: content.bio ?? emptyBio,
    faq: content.faq ?? [],
    sectionOrder: [
        ...content.sectionOrder,
        ...sectionKeys.filter((key) => !content.sectionOrder.includes(key)),
    ],
})

/** The bundled fallback — the same copy the site has always shipped. */
export const defaultSiteContent: SiteContent = {
    siteName: 'AbhiTutor',
    hero: {
        headline: 'Confident tutoring for Years 7 to 13.',
        subhead: 'One-to-one lessons in maths and the sciences, from KS3 through GCSE to A-level — in person or online, matched to your child’s exam board and built around their school week.',
        // Blank by default — the page hides the line until the teacher
        // publishes one via the site editor.
        availability: '',
        experienceYears: 20,
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
    // Empty until the teacher writes it — an empty bio renders nothing, and
    // the DBS indicator is only ever switched on by the owner (REQ-021).
    bio: { ...emptyBio },
    // A starter set the owner reviews and edits before publishing (REQ-025);
    // it mirrors the API's bundled default. Every answer sticks to what the
    // site already claims — no invented policies, prices or promises.
    faq: [
        {
            question: 'What subjects and levels do you cover?',
            answer: 'Maths and the sciences, from KS3 through GCSE to A-level. Lessons follow your child’s own exam board and specification, not a generic syllabus.',
        },
        {
            question: 'Are lessons online or in person?',
            answer: 'Both — choose whichever suits your family, or mix the two. Online lessons are live and interactive, never pre-recorded.',
        },
        {
            question: 'Are lessons one-to-one or in groups?',
            answer: 'Most lessons are one-to-one. Small group sessions also run where a few students at the same level learn well together.',
        },
        {
            question: 'How do we get started?',
            answer: 'Request a free assessment. We talk through where your child is now and what success looks like, then agree a plan — no commitment until you’re happy.',
        },
        {
            question: 'How will we know it’s working?',
            answer: 'Every lesson ends with a written note of what was covered and what to practise, and progress is reviewed against the goals we agree at the start — you stay in the loop without having to ask.',
        },
    ],
    // Empty until the teacher writes one — an empty section renders nothing.
    freeform: { heading: '', markdown: '' },
    sectionOrder: [
        'hero',
        'subjects',
        'journey',
        'approach',
        'bio',
        'faq',
        'freeform',
    ],
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
