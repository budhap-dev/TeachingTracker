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
    /** Profile photo as a small data-URI (browser-downscaled JPEG). */
    photo: string
    /** CV timelines (REQ-037): teaching first, then education. */
    experience: CvEntry[]
    education: CvEntry[]
    /** The "What you can expect" tick list. */
    expectations: string[]
    /** Free sections — philosophy, promise, whatever comes next. */
    sections: AboutSection[]
}

/** One dated CV entry on the About page (REQ-037). */
export type CvEntry = {
    /** e.g. "Since 2019", "2005". Free text, shown quietly. */
    years: string
    title: string
    place: string
    detail: string
}

/** A repeating About section: a heading plus a Markdown body (REQ-037). */
export type AboutSection = {
    heading: string
    /** Markdown only — raw HTML is stripped on write. */
    markdown: string
}

/** One per-level from-rate (REQ-022), e.g. GCSE from £20/hr. */
export type PricingRate = {
    /** The level the rate anchors, e.g. "GCSE", "A-level". */
    label: string
    /** Whole pounds per hour, per student. */
    fromPerHour: number
}

/** One named factor that shapes the exact rate (REQ-022). */
export type PricingFactor = {
    title: string
    detail: string
}

/**
 * Transparent pricing (REQ-022). Rates vary by level (owner 2026-08-04:
 * generally from GCSE £20/hr and A-level £30/hr, per student); factors
 * are NAMED, never fake-quantified. No rates = pricing not published.
 */
export type PricingSection = {
    rates: PricingRate[]
    factors: PricingFactor[]
    /** e.g. "Your exact rate is agreed at the free assessment." */
    note: string
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
    pricing: PricingSection
    /** Hero highlight tiles (REQ-038). */
    highlights: string[]
    /** The services checklist on Offerings (owner list, 2026-08-07). */
    services: string[]
    freeform: FreeformSection
    sectionOrder: SectionKey[]
}

/** An empty bio — what older documents' gaps are filled with. */
export const emptyBio: BioSection = {
    heading: '',
    photo: '',
    body: '',
    qualifications: [],
    dbsChecked: false,
    safeguarding: '',
    experience: [],
    education: [],
    expectations: [],
    sections: [],
}

/** A bio with no heading, body or experience has nothing to say — serve
    the owner's prepared About copy instead (owner call 2026-08-04: these
    are the owner's own approved words). */
const withPreparedBioFallback = (bio: BioSection): BioSection =>
    !bio.heading && !bio.body && bio.experience.length === 0
        ? defaultSiteContent.bio
        : bio

/**
 * Fills a document from an older API (no bio/faq, 5-key order) so every
 * consumer sees the full shape — with EMPTY new sections, never drafts the
 * owner hasn't approved.
 */
export const normaliseSiteContent = (
    content: SiteContent
): SiteContent => ({
    ...content,
    bio: withPreparedBioFallback({ ...emptyBio, ...(content.bio ?? {}) }),
    faq: content.faq ?? [],
    pricing: content.pricing ?? { rates: [], factors: [], note: '' },
    // Owner-approved by provision (2026-08-05), like the About copy.
    highlights: content.highlights ?? defaultSiteContent.highlights,
    services: content.services ?? defaultSiteContent.services,
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
        subhead: 'One-to-one or small-group lessons in maths and the sciences, from KS3 through GCSE to A-level — in person or online, matched to your child’s exam board and built around their school week.',
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
            detail: 'Tell me the subject, year and what your child wants to get out of tutoring.',
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
    // The owner's About copy (provided 2026-08-04) — mirrors the API's
    // bundled default; the About page's "load the prepared content" button
    // draws from here too.
    bio: {
        heading: 'About me',
        // No photo in the prepared copy — the owner uploads their own.
        photo: '',
        body: 'Hello, and welcome! 👋\n\nMy name is **Mrs Abhinanda Pandit**, and I currently work in a secondary school in Leeds as a **Maths Mentor**. Before that I was an **Assistant SENDCo**, supporting students with additional learning needs and helping them overcome barriers to success.\n\nTeaching has always been more than a profession for me — it is my passion. ❤️ My love of working with young people and helping them reach their full potential inspired me to offer private tutoring, both online and in person from my home in the Middleton area of Leeds.\n\nMy journey as a tutor began in my own student years, helping fellow students and junior batches with Physics honours and much else besides. That early experience lit a lifelong passion for teaching and mentoring. ✨',
        qualifications: [
            'BSc (Hons) Physics, First Class',
            'B.Tech Computer Science — University Topper',
            '20+ years teaching and tutoring',
        ],
        dbsChecked: false,
        safeguarding: '',
        experience: [
            {
                years: 'Now',
                title: 'Maths Mentor',
                place: 'Secondary school, Leeds',
                detail: 'Previously Assistant SENDCo — supporting students with additional learning needs.',
            },
            {
                years: 'Since 2019',
                title: 'Tutor across the UK',
                place: 'Tutoring centre and privately',
                detail: 'Helping students build confidence, improve grades, and genuinely understand their subjects.',
            },
            {
                years: 'Earlier',
                title: 'Teacher at several schools',
                place: 'India, before moving to the UK',
                detail: 'Left a software career at a multinational because the pull of the classroom was stronger.',
            },
        ],
        // Education lives on the qualification cards (owner call) —
        // an empty list hides the timeline block.
        education: [],
        expectations: [
            'Personalised one-to-one tuition',
            'Patient and supportive teaching',
            'Tailored learning plans',
            'Regular progress feedback',
            'Focus on understanding, not memorising',
            'Proven exam preparation strategies',
            'A commitment to helping every student achieve their best',
        ],
        sections: [
            {
                heading: 'My teaching philosophy',
                markdown: '✨ ***Every student has the potential to succeed with the right guidance, encouragement and support.***\n\n- 🎯 Every lesson is tailored to individual needs, learning styles and goals.\n- 🤗 A safe, supportive space where it is always okay to ask questions and make mistakes.\n- 🌱 Confidence, resilience and a positive attitude to learning — not just marks.',
            },
            {
                heading: 'My promise',
                markdown: '- 🌱 Learning is not about being the best — it is about becoming better than you were yesterday.\n- 💪 Confidence is the foundation of success, and every lesson is designed to build it.\n- 🤝 Together, we can turn challenges into achievements and goals into results.\n- ⭐ More than improving grades, my goal is to help students believe in themselves.\n\nI look forward to supporting your child on their educational journey. 😊',
            },
        ],
    },
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
    // Transparent pricing (REQ-022): the owner's anchor, factors NAMED,
    // never fake-quantified. Mirrors the API's bundled default.
    pricing: {
        // The owner's anchors (2026-08-04): rates rise with the years.
        rates: [
            { label: 'GCSE', fromPerHour: 20 },
            { label: 'A-level', fromPerHour: 30 },
        ],
        factors: [
            {
                title: 'One-to-one or small group',
                detail: 'Group lessons share the hour — and the rate — between students.',
            },
            {
                title: 'Online or in person',
                detail: 'In-person lessons may reflect travel; online carries no extras.',
            },
        ],
        note: 'Your exact rate is agreed at the free assessment — no obligation, no surprises.',
    },
    // Hero highlights (REQ-038): the owner's list (2026-08-05), deduped.
    highlights: [
        'Flexible scheduling',
        'Clear communication with parents',
        'Regular progress reports',
        'Online convenience',
        'Personalised learning',
        'Confidence-building approach',
        'Exam and assessment preparation',
        'Proven results',
    ],
    // The Offerings services checklist — the owner's list, verbatim
    // (2026-08-07); the view supplies the ticks.
    services: [
        'One-to-One Personalised Tutoring',
        'Small Group Classes for Focused Learning',
        'Homework & Assignment Support',
        'Exam Preparation and Revision Strategies',
        'Confidence Building & Study Skills Development',
        'Progress Tracking and Parent Feedback',
        'Foundation, Intermediate & Advanced Learning Support',
        'GCSE, IGCSE & A-Level Preparation',
        'University Entrance & Scholarship Coaching',
        'Flexible In-Person and Online Sessions',
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
