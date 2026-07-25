import type {
    MonthlyPaymentGroup,
    PaymentRecord,
    PaymentStatus,
    ScheduledSession,
    Student,
    Testimonial,
} from '../data/students'
import type { Contact } from '../data/contact'
import type { Lead } from '../data/students'

/**
 * Test-only data. The app ships no static data — it loads students, payments
 * and sessions from the API — so these fixtures exist purely to back the mocked
 * API in tests (see setup.ts). They are never imported by app code.
 */
export const fixtureStudents: Student[] = [
    {
        id: 1,
        studentId: 'STU-0001',
        firstName: 'Asha',
        lastName: 'Perera',
        dob: '2011-05-14',
        subjects: ['Mathematics', 'Physics'],
        school: 'Kingston Grammar School',
        year: '10',
        progress: 88,
        mode: 'Face to Face',
        fees: 120,
        notes: 'Excellent problem solving skills.',
        parentName: 'Nadia Patel',
        contactNumber: '+44 7700 900123',
        address: '12 Oak Road, Kingston upon Thames, KT2 6LP',
    },
    {
        id: 2,
        studentId: 'STU-0002',
        firstName: 'Nimal',
        lastName: 'Fernando',
        dob: '2012-08-22',
        subjects: ['Physics'],
        school: 'St. Pauls School',
        year: '9',
        progress: 74,
        mode: 'Online',
        fees: 135,
        notes: 'Needs extra practice with experiments.',
        parentName: 'Martin Foster',
        contactNumber: '+44 7710 123456',
        address: '23 Elm Grove, Wimbledon, SW19 7HQ',
    },
    {
        id: 3,
        studentId: 'STU-0003',
        firstName: 'Kavindi',
        lastName: 'Silva',
        dob: '2013-01-11',
        subjects: ['English'],
        school: 'Epsom College',
        year: '8',
        progress: 82,
        mode: 'Face to Face',
        fees: 150,
        notes: 'Strong writing and reading confidence.',
        parentName: 'Helen Clarke',
        contactNumber: '+44 7720 456789',
        address: '5 Willow Lane, Guildford, GU1 2AB',
    },
    {
        id: 4,
        studentId: 'STU-0004',
        firstName: 'Dilan',
        lastName: 'Jayawardena',
        dob: '2010-11-03',
        subjects: ['Chemistry'],
        school: 'Harrow School',
        year: '11',
        progress: 70,
        mode: 'Online',
        fees: 165,
        notes: 'Needs more consistent revision habits.',
        parentName: 'David Hughes',
        contactNumber: '+44 7730 987654',
        address: '88 High Street, Harrow, HA1 4DX',
    },
    {
        id: 5,
        studentId: 'STU-0005',
        firstName: 'Rashmi',
        lastName: 'Weerasinghe',
        dob: '2011-09-16',
        subjects: ['Biology', 'Chemistry'],
        school: 'Wycombe Abbey',
        year: '10',
        progress: 86,
        mode: 'Face to Face',
        fees: 120,
        notes: 'Very attentive during lab sessions.',
        parentName: 'Laura Bennett',
        contactNumber: '+44 7740 111222',
        address: '14 Lake View, Buckingham, MK18 1PT',
    },
]

/** Scheduled classes, dated relative to today so they read as upcoming. */
export const buildFixtureSessions = (
    students: Student[] = fixtureStudents
): ScheduledSession[] => {
    const today = new Date()
    const notes = [
        'Problem solving practice',
        'Lab preparation',
        'Reading and writing review',
        'Revision session',
    ]
    const times = ['16:00', '17:30', '09:30', '11:00']

    return students.slice(0, 4).map((student, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() + i + 1)
        return {
            id: 101 + i,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            year: student.year,
            subject: student.subjects[0],
            // The last fixture class is cancelled, so tests always have one.
            status: i === 3 ? 'Cancelled' : 'Scheduled',
            date: date.toISOString().slice(0, 10),
            time: times[i],
            durationMinutes: [60, 90, 30, 120][i],
            notes: notes[i],
        }
    })
}

const paymentStatusNotes: Record<PaymentStatus, string> = {
    Paid: 'Received in full',
    Partial: 'Partial payment received',
    Pending: 'Awaiting payment',
}

/** Builds 12 months of payment records for the fixture students (current year). */
export const buildFixturePayments = (
    students: Student[] = fixtureStudents
): PaymentRecord[] => {
    const year = new Date().getFullYear()
    const months = Array.from(
        { length: 12 },
        (_, monthIndex) => `${year}-${String(monthIndex + 1).padStart(2, '0')}`
    )

    return students.flatMap((student) =>
        months.map((month, monthIndex) => {
            // Mirrors the API: a bill is classes taught x the per-session fee.
            const sessionsHeld = (student.id + monthIndex) % 5
            const amountDue = sessionsHeld * student.fees
            const pattern = (student.id + monthIndex) % 3
            const amountPaid =
                pattern === 0 ? amountDue : pattern === 1 ? Math.round(amountDue * 0.5) : 0
            const status: PaymentStatus =
                amountDue > 0 && amountPaid >= amountDue
                    ? 'Paid'
                    : amountPaid > 0
                      ? 'Partial'
                      : 'Pending'

            // One line item per held class (fixture students are per-session),
            // so their fees sum to amountDue — mirrors the API's PaymentRecord.
            const sessions = Array.from(
                { length: sessionsHeld },
                (_, sessionIndex) => ({
                    date: `${month}-${String(sessionIndex + 3).padStart(2, '0')}`,
                    subject: student.subjects[sessionIndex % student.subjects.length],
                    durationMinutes: [60, 90, 30, 120][sessionIndex % 4],
                    fee: student.fees,
                })
            )

            return {
                id: student.id * 100 + monthIndex,
                studentId: student.id,
                studentName: `${student.firstName} ${student.lastName}`,
                month,
                feePerSession: student.fees,
                sessionsHeld,
                totalDurationMinutes: sessions.reduce(
                    (total, session) => total + session.durationMinutes,
                    0
                ),
                amountDue,
                amountPaid,
                outstanding: Math.max(amountDue - amountPaid, 0),
                status,
                notes: paymentStatusNotes[status],
                sessions,
            }
        })
    )
}

/** Testimonials for the mocked reviews API — two approved, one pending. */
export const buildFixtureTestimonials = (): Testimonial[] => [
    {
        id: 1,
        authorName: 'Nadia D.',
        role: 'Parent',
        subject: 'Mathematics',
        year: '10',
        rating: 5,
        quote: 'My daughter went from dreading maths to volunteering answers.',
        status: 'Approved',
        submittedOn: '2026-05-12',
        moderatedOn: '2026-05-13',
    },
    {
        id: 2,
        authorName: 'James',
        role: 'Student',
        subject: 'Physics',
        rating: 5,
        quote: 'Lessons finally made sense and my mock grade jumped two levels.',
        status: 'Approved',
        submittedOn: '2026-06-03',
        moderatedOn: '2026-06-04',
    },
    {
        id: 3,
        authorName: 'Helen W.',
        role: 'Parent',
        rating: 4,
        quote: 'Reliable, patient and genuinely invested.',
        status: 'Pending',
        submittedOn: '2026-07-15',
    },
]

/** Enquiries for the mocked leads API — one New, one Contacted (REQ-018/019). */
export const buildFixtureLeads = (): Lead[] => [
    {
        id: 2,
        parentName: 'Priya Sharma',
        email: 'priya@example.com',
        year: '10',
        subjects: ['Mathematics', 'Physics'],
        goal: 'Confidence before GCSE mocks.',
        mode: 'Online',
        status: 'New',
        submittedOn: '2026-07-20',
    },
    {
        id: 1,
        parentName: 'Tom Riley',
        phone: '+44 7700 900456',
        year: '8',
        subjects: ['English'],
        goal: 'Structure for essay writing.',
        mode: 'Either',
        status: 'Contacted',
        submittedOn: '2026-07-12',
    },
]

/** The public contact details, mirroring GET /contact. */
export const buildFixtureContact = (): Contact => ({
    email: 'hello@example.com',
    phone: '+44 7700 900000',
})

/** Groups the fixture payments by month, mirroring GET /payments/by-month. */
export const buildFixturePaymentsByMonth = (
    students: Student[] = fixtureStudents
): MonthlyPaymentGroup[] => {
    const byMonth = new Map<string, PaymentRecord[]>()

    buildFixturePayments(students).forEach((record) => {
        const existing = byMonth.get(record.month)
        if (existing) {
            existing.push(record)
        } else {
            byMonth.set(record.month, [record])
        }
    })

    return [...byMonth.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([month, records]) => {
            const sum = (pick: (record: PaymentRecord) => number) =>
                records.reduce((total, record) => total + pick(record), 0)
            const totalDue = sum((record) => record.amountDue)
            const totalReceived = sum((record) => record.amountPaid)
            return {
                month,
                totalDue,
                totalReceived,
                totalOutstanding: Math.max(totalDue - totalReceived, 0),
                sessionsHeld: sum((record) => record.sessionsHeld),
                records,
            }
        })
}
