/**
 * One dated entry in a student's notes log. `id` is stable for the life of the
 * entry so it can be edited or deleted; `date` is an ISO `YYYY-MM-DD` day.
 */
export type DatedNote = {
    id: number
    date: string
    text: string
}

/**
 * How a student's `fees` amount is billed:
 * - `per-session` (default): charged per class held — `fees × classes that month`.
 * - `monthly`: a flat retainer charged every month, regardless of class count.
 * - `none`: the student is not billed at all (their `fees` amount is ignored).
 */
export type FeeType = 'per-session' | 'monthly' | 'none'

export type Student = {
    id: number
    studentId: string
    firstName: string
    lastName: string
    dob: string
    subjects: string[]
    school: string
    year: string
    /** Blended 0–100 figure. With progressBySubject present, the API keeps
        this as the rounded average of its values (REQ-014). */
    progress: number
    /** Progress per studied subject (0–100). Optional — older records carry
        only the blended figure. */
    progressBySubject?: Record<string, number>
    mode: 'Online' | 'Face to Face' | 'Both'
    /** The agreed fee amount in GBP. Its meaning depends on {@link feeType}:
        a per-session price (default) or a flat monthly retainer. */
    fees: number
    /** How `fees` is billed. Optional — absent means `per-session` (older
        records and the default for new students). */
    feeType?: FeeType
    /** Legacy single free-text note. Superseded by {@link datedNotes} in the UI
        but kept on the record for older data; not shown on the profile. */
    notes: string
    /** The student's dated notes log, newest activity first is up to the view.
        Optional — absent on records created before the log existed. */
    datedNotes?: DatedNote[]
    parentName: string
    contactNumber: string
    address: string
    /** Archived students have finished tutoring: they leave the active roster
        for the teacher-only Alumni view but keep their history (REQ-013).
        Absent/false means active. */
    isArchived?: boolean
    /** ISO date the student was archived. */
    archivedOn?: string
    /** The teacher's closing note, kept through archive and restore. */
    archiveNotes?: string
}

/**
 * Whether a class is still on. Only two states: whether a class was *held* is
 * derived (Scheduled + date in the past), not a third state to tick after every
 * lesson — only the exception needs an action.
 */
export type SessionStatus = 'Scheduled' | 'Cancelled'

export type ScheduledSession = {
    id: number
    studentId: number
    studentName: string
    year: string
    subject: string
    date: string
    time: string
    /** Length of the class in minutes (30 / 60 / 90 / 120). */
    durationMinutes: number
    /** Links the rows of a group class; absent on a solo class. */
    groupId?: string
    notes: string
    status: SessionStatus
}

/** Classes that are still on. Cancelled ones stay visible, but never count. */
export const activeSessions = (sessions: ScheduledSession[]) =>
    sessions.filter((session) => session.status !== 'Cancelled')

export type PaymentStatus = 'Paid' | 'Partial' | 'Pending'

/**
 * A student's bill for one month, derived by the API.
 *
 * For a per-session student `amountDue` is the fee times the classes that took
 * place that month (a month with no classes owes nothing). For a monthly
 * student it is the flat monthly fee, charged regardless of class count.
 */
/**
 * One held class as a bill line item — the itemised detail behind a bill.
 * On a per-session bill the fee is the flat per-session price; on a monthly
 * bill each line's fee is 0, the flat retainer covering the classes.
 * `durationMinutes` is shown for context and doesn't change the fee.
 */
export type SessionLine = {
    date: string
    subject: string
    durationMinutes: number
    fee: number
}

export type PaymentRecord = {
    id: number
    studentId: number
    studentName: string
    month: string
    /** The student's fee amount — a per-session price or a monthly retainer,
        per {@link feeType}. */
    feePerSession: number
    /** How this bill is charged; absent means `per-session`. */
    feeType?: FeeType
    /** How many classes actually took place this month. */
    sessionsHeld: number
    /** Total minutes of the classes held this month — accumulated teaching time. */
    totalDurationMinutes: number
    /** Per-session: `feePerSession × sessionsHeld`. Monthly: the flat fee. */
    amountDue: number
    amountPaid: number
    outstanding: number
    status: PaymentStatus
    notes: string
    /** The held classes behind this bill. Per-session fees sum to
        `amountDue`; a monthly student's lines carry fee 0, their flat
        retainer covering the classes. Empty for no-fee students. */
    sessions: SessionLine[]
}

/**
 * A testimonial submitted by a family (REQ-027). Anyone can submit one from the
 * public site; it lands as `Pending` and is only shown once the teacher moderates
 * it to `Approved`. The public API only ever returns Approved reviews.
 */
export type TestimonialStatus = 'Pending' | 'Approved' | 'Rejected'

/** Who left the review. Parent/Student are star-rated family reviews;
    Professional/Personal are recommendations without a rating. */
export type TestimonialRole =
    | 'Parent'
    | 'Student'
    | 'Professional'
    | 'Personal'

/** Recommendation roles carry no star rating. */
export const recommendationRoles: TestimonialRole[] = [
    'Professional',
    'Personal',
]

export type Testimonial = {
    id: number
    /** The display name the submitter gave — a first name or initials are fine. */
    authorName: string
    role: TestimonialRole
    /** Optional subject the tutoring covered, e.g. "Mathematics". */
    subject?: string
    /** Optional school year, e.g. "10". */
    year?: string
    /** Star rating, 1–5 — family reviews only; recommendations have none. */
    rating?: number
    /** The written experience — plain text. */
    quote: string
    status: TestimonialStatus
    /** Set when a profanity screen matched the name/quote (REQ-028) — the
        moderation queue highlights it. It does not change visibility. */
    flagged?: boolean
    /** ISO date, YYYY-MM-DD, when it was submitted. */
    submittedOn: string
    /** ISO date the teacher approved/rejected it; absent while Pending. */
    moderatedOn?: string
}

/**
 * A public enquiry (REQ-018) — a prospect, not a student. Lands as `New` in
 * the teacher's Leads inbox (REQ-019); converting one pre-fills the
 * add-student form rather than linking records.
 */
export type LeadStatus = 'New' | 'Contacted' | 'Converted'

export type Lead = {
    id: number
    /** The parent or guardian enquiring. */
    parentName: string
    /** At least one of email / phone is present (the API validates). */
    email?: string
    phone?: string
    /** The child's school year, e.g. "10". */
    year: string
    subjects: string[]
    /** What they want out of tutoring, in their own words. */
    goal: string
    mode: 'Online' | 'Face to Face' | 'Either'
    status: LeadStatus
    /** ISO date, YYYY-MM-DD, when the enquiry arrived. */
    submittedOn: string
}

/** Payment records for one month with server-computed totals (/payments/by-month). */
export type MonthlyPaymentGroup = {
    month: string
    totalDue: number
    totalReceived: number
    totalOutstanding: number
    /** Classes taught across every student this month. */
    sessionsHeld: number
    records: PaymentRecord[]
}

/**
 * Every student field the teacher can edit.
 *
 * `id` and `studentId` are omitted deliberately: `id` is the database key and
 * `studentId` is a generated human-facing code — both are identifiers, not
 * details, so they stay read-only.
 */
export type EditableStudentField = keyof Omit<Student, 'id' | 'studentId'>

/** The free-text fields, which all edit the same way. */
export const editableTextFields = [
    'firstName',
    'lastName',
    'school',
    'parentName',
    'contactNumber',
    'address',
    'notes',
] as const

export type StudentTextField = (typeof editableTextFields)[number]

/**
 * What the teacher records against a month.
 * Omit `amountPaid` to settle in full — the API pays exactly what the classes
 * came to, rather than a figure typed in the hope it matches.
 */
export type PaymentRecordInput = {
    studentId: number
    month: string
    amountPaid?: number
    notes?: string
}

// Student codes are generated by the API on create (studentService.upsertStudent),
// so the frontend never mints one.
