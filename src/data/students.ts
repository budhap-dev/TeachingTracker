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
    /** Agreed monthly tuition fee for this student, in GBP. */
    fees: number
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

/** Payment records for one month with server-computed totals (/payments/by-month). */
export type MonthlyPaymentGroup = {
    month: string
    totalExpected: number
    totalReceived: number
    totalOutstanding: number
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
