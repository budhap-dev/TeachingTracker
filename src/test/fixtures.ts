import type {
    MonthlyPaymentGroup,
    PaymentRecord,
    PaymentStatus,
    ScheduledSession,
    Student,
} from '../data/students'

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
            const monthlyFee = student.fees
            const pattern = (student.id + monthIndex) % 3
            const status: PaymentStatus =
                pattern === 0 ? 'Paid' : pattern === 1 ? 'Partial' : 'Pending'
            const amountPaid =
                status === 'Paid'
                    ? monthlyFee
                    : status === 'Partial'
                      ? Math.round(monthlyFee * 0.5)
                      : 0

            return {
                id: student.id * 100 + monthIndex,
                studentId: student.id,
                studentName: `${student.firstName} ${student.lastName}`,
                month,
                monthlyFee,
                amountPaid,
                status,
                notes: paymentStatusNotes[status],
            }
        })
    )
}

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
            const totalExpected = records.reduce(
                (sum, record) => sum + record.monthlyFee,
                0
            )
            const totalReceived = records.reduce(
                (sum, record) => sum + record.amountPaid,
                0
            )
            return {
                month,
                totalExpected,
                totalReceived,
                totalOutstanding: totalExpected - totalReceived,
                records,
            }
        })
}
