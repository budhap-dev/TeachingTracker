export type Student = {
    id: number
    studentId: string
    firstName: string
    lastName: string
    dob: string
    subjects: string[]
    school: string
    year: string
    progress: number
    mode: 'Online' | 'Face to Face'
    notes: string
    parentName: string
    contactNumber: string
    address: string
}

export type ScheduledSession = {
    id: number
    studentId: number
    studentName: string
    year: string
    subject: string
    date: string
    time: string
    notes: string
}

export type PaymentStatus = 'Paid' | 'Partial' | 'Pending'

export type PaymentRecord = {
    id: number
    studentId: number
    studentName: string
    month: string
    monthlyFee: number
    amountPaid: number
    status: PaymentStatus
    notes: string
}

/** Fields on a student that can be edited inline from the detail page. */
export const editableStudentFields = [
    'parentName',
    'contactNumber',
    'address',
    'notes',
] as const

export type StudentDetailField = (typeof editableStudentFields)[number]

/** Payload accepted by the updatePaymentRecord reducer. */
export type PaymentRecordInput = {
    studentId: number
    month: string
    status: PaymentStatus
    amountPaid: number
    notes: string
}

let studentIdCounter = 0

/** Generates a unique human-facing student code, e.g. STU-4F9K2Q. */
export const generateStudentCode = (): string => {
    studentIdCounter += 1
    const suffix = `${Date.now().toString(36)}${studentIdCounter.toString(36)}`
        .toUpperCase()
        .slice(-6)
    return `STU-${suffix}`
}

export const initialStudents: Student[] = [
    {
        id: 1,
        studentId: 'STU-AX7M2P',
        firstName: 'Asha',
        lastName: 'Perera',
        dob: '2011-05-14',
        subjects: ['Mathematics', 'Physics'],
        school: 'Kingston Grammar School',
        year: '10',
        progress: 88,
        mode: 'Face to Face',
        notes: 'Excellent problem solving skills.',
        parentName: 'Nadia Patel',
        contactNumber: '+44 7700 900123',
        address: '12 Oak Road, Kingston upon Thames, KT2 6LP',
    },
    {
        id: 2,
        studentId: 'STU-CL4Q8R',
        firstName: 'Nimal',
        lastName: 'Fernando',
        dob: '2012-08-22',
        subjects: ['Physics'],
        school: 'St. Pauls School',
        year: '9',
        progress: 74,
        mode: 'Online',
        notes: 'Needs extra practice with experiments.',
        parentName: 'Martin Foster',
        contactNumber: '+44 7710 123456',
        address: '23 Elm Grove, Wimbledon, SW19 7HQ',
    },
    {
        id: 3,
        studentId: 'STU-KV9P1T',
        firstName: 'Kavindi',
        lastName: 'Silva',
        dob: '2013-01-11',
        subjects: ['English'],
        school: 'Epsom College',
        year: '8',
        progress: 82,
        mode: 'Face to Face',
        notes: 'Strong writing and reading confidence.',
        parentName: 'Helen Clarke',
        contactNumber: '+44 7720 456789',
        address: '5 Willow Lane, Guildford, GU1 2AB',
    },
    {
        id: 4,
        studentId: 'STU-DJ2L6N',
        firstName: 'Dilan',
        lastName: 'Jayawardena',
        dob: '2010-11-03',
        subjects: ['Chemistry'],
        school: 'Harrow School',
        year: '11',
        progress: 70,
        mode: 'Online',
        notes: 'Needs more consistent revision habits.',
        parentName: 'David Hughes',
        contactNumber: '+44 7730 987654',
        address: '88 High Street, Harrow, HA1 4DX',
    },
    {
        id: 5,
        studentId: 'STU-RP8N4W',
        firstName: 'Rashmi',
        lastName: 'Weerasinghe',
        dob: '2011-09-16',
        subjects: ['Biology', 'Chemistry'],
        school: 'Wycombe Abbey',
        year: '10',
        progress: 86,
        mode: 'Face to Face',
        notes: 'Very attentive during lab sessions.',
        parentName: 'Laura Bennett',
        contactNumber: '+44 7740 111222',
        address: '14 Lake View, Buckingham, MK18 1PT',
    },
    {
        id: 6,
        studentId: 'STU-MT5V2Q',
        firstName: 'Chaminda',
        lastName: 'Ratnayake',
        dob: '2012-03-09',
        subjects: ['Mathematics'],
        school: 'The Perse School',
        year: '9',
        progress: 78,
        mode: 'Online',
        notes: 'Improving steadily with guided practice.',
        parentName: 'James Carter',
        contactNumber: '+44 7750 333444',
        address: '40 Station Road, Cambridge, CB1 3EN',
    },
    {
        id: 7,
        studentId: 'STU-LZ3K7C',
        firstName: 'Tharushi',
        lastName: 'Kumari',
        dob: '2013-07-28',
        subjects: ['History', 'English'],
        school: 'RGS Guildford',
        year: '8',
        progress: 84,
        mode: 'Face to Face',
        notes: 'Excellent participation in class discussions.',
        parentName: 'Sophie Turner',
        contactNumber: '+44 7760 555666',
        address: '7 Flower Road, Guildford, GU2 4RT',
    },
    {
        id: 8,
        studentId: 'STU-QP1J9F',
        firstName: 'Sanjaya',
        lastName: 'Bandara',
        dob: '2010-12-01',
        subjects: ['Physics', 'Mathematics'],
        school: 'Benenden School',
        year: '11',
        progress: 72,
        mode: 'Online',
        notes: 'Needs occasional reminders to complete homework.',
        parentName: 'Richard Mason',
        contactNumber: '+44 7770 777888',
        address: '19 Park Road, Tunbridge Wells, TN1 2LP',
    },
    {
        id: 9,
        studentId: 'STU-WY6H3N',
        firstName: 'Mihiri',
        lastName: 'Gunasekara',
        dob: '2011-01-20',
        subjects: ['English'],
        school: 'Cheltenham Ladies College',
        year: '10',
        progress: 89,
        mode: 'Face to Face',
        notes: 'Confident speaker and thoughtful writer.',
        parentName: 'Claire Evans',
        contactNumber: '+44 7780 999000',
        address: '3 Church Lane, Cheltenham, GL50 3JW',
    },
    {
        id: 10,
        studentId: 'STU-TN4B8K',
        firstName: 'Kasun',
        lastName: 'Mendis',
        dob: '2012-06-17',
        subjects: ['Chemistry', 'Biology'],
        school: 'Wellington College',
        year: '9',
        progress: 76,
        mode: 'Online',
        notes: 'Shows strong curiosity in practical work.',
        parentName: 'Timothy Reed',
        contactNumber: '+44 7790 123789',
        address: '55 High Level Road, Crowthorne, RG45 6ZZ',
    },
]
