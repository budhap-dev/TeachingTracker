import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type {
    MonthlyPaymentGroup,
    PaymentRecord,
    Student,
} from '../data/students'
import { PaymentTrackerView } from './PaymentTrackerView'

const currentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const buildStudent = (overrides: Partial<Student> = {}): Student => ({
    id: overrides.id ?? 1,
    studentId: overrides.studentId ?? 'STU-100001',
    firstName: overrides.firstName ?? 'Asha',
    lastName: overrides.lastName ?? 'Perera',
    dob: overrides.dob ?? '2011-05-14',
    subjects: overrides.subjects ?? ['Mathematics'],
    school: overrides.school ?? 'Kingston Grammar School',
    year: overrides.year ?? '10',
    progress: overrides.progress ?? 88,
    mode: overrides.mode ?? 'Face to Face',
    notes: overrides.notes ?? 'Excellent problem solving skills.',
    parentName: overrides.parentName ?? 'Nadia Patel',
    contactNumber: overrides.contactNumber ?? '+44 7700 900123',
    address: overrides.address ?? '12 Oak Road, Kingston upon Thames, KT2 6LP',
})

const buildRecord = (overrides: Partial<PaymentRecord> = {}): PaymentRecord => ({
    id: overrides.id ?? 10,
    studentId: overrides.studentId ?? 1,
    studentName: overrides.studentName ?? 'Asha Perera',
    month: overrides.month ?? currentMonth(),
    feePerSession: overrides.feePerSession ?? 30,
    feeType: overrides.feeType,
    sessionsHeld: overrides.sessionsHeld ?? 4,
    amountDue: overrides.amountDue ?? 120,
    amountPaid: overrides.amountPaid ?? 0,
    outstanding: overrides.outstanding ?? 120,
    status: overrides.status ?? 'Pending',
    notes: overrides.notes ?? '',
})

const buildGroup = (record: PaymentRecord): MonthlyPaymentGroup => ({
    month: record.month,
    totalDue: record.amountDue,
    totalReceived: record.amountPaid,
    totalOutstanding: record.outstanding,
    sessionsHeld: record.sessionsHeld,
    records: [record],
})

const renderView = () => {
    const student = buildStudent()
    const record = buildRecord()
    const onUpdatePaymentRecord = vi.fn()
    render(
        <PaymentTrackerView
            students={[student]}
            paymentsByMonth={[buildGroup(record)]}
            onUpdatePaymentRecord={onUpdatePaymentRecord}
            onOpenStudentPage={vi.fn()}
        />
    )
    return { onUpdatePaymentRecord }
}

describe('PaymentTrackerView amount editing', () => {
    it('does not send the amount on keystroke or blur — only on Save', async () => {
        const user = userEvent.setup()
        const { onUpdatePaymentRecord } = renderView()

        const amountBox = screen.getByRole('spinbutton', {
            name: /amount received/i,
        })
        const saveButton = screen.getByRole('button', {
            name: /save .* amount received/i,
        })

        // Save is inert until the box actually changes.
        expect(saveButton).toBeDisabled()

        await user.clear(amountBox)
        await user.type(amountBox, '75')

        // Typing must not reach the backend...
        expect(onUpdatePaymentRecord).not.toHaveBeenCalled()

        // ...and neither must moving focus away (the old blur behaviour).
        await user.tab()
        expect(onUpdatePaymentRecord).not.toHaveBeenCalled()

        await user.click(saveButton)

        expect(onUpdatePaymentRecord).toHaveBeenCalledTimes(1)
        expect(onUpdatePaymentRecord).toHaveBeenCalledWith(
            expect.objectContaining({
                studentId: 1,
                month: currentMonth(),
                amountPaid: 75,
            })
        )
    })

    it('commits nothing when the box was never touched', async () => {
        const user = userEvent.setup()
        const { onUpdatePaymentRecord } = renderView()

        // Enter on a pristine box (no draft) is a no-op — no draft to commit.
        const amountBox = screen.getByRole('spinbutton', {
            name: /amount received/i,
        })
        amountBox.focus()
        await user.keyboard('{Enter}')

        expect(onUpdatePaymentRecord).not.toHaveBeenCalled()
    })

    it('keeps Save disabled when the typed value matches what is stored', async () => {
        const user = userEvent.setup()
        renderView()

        const amountBox = screen.getByRole('spinbutton', {
            name: /amount received/i,
        })
        const saveButton = screen.getByRole('button', {
            name: /save .* amount received/i,
        })

        await user.type(amountBox, '5')
        expect(saveButton).toBeEnabled()

        await user.clear(amountBox)
        await user.type(amountBox, '0')
        expect(saveButton).toBeDisabled()
    })
})

describe('PaymentTrackerView archived students', () => {
    it('drops records without an active student from the rows and totals', () => {
        // The active student the route still passes down.
        const active = buildStudent({ id: 1, firstName: 'Asha', lastName: 'Perera' })
        const activeRecord = buildRecord({
            id: 10,
            studentId: 1,
            studentName: 'Asha Perera',
            amountDue: 120,
            amountPaid: 30,
            outstanding: 90,
            sessionsHeld: 4,
            status: 'Partial',
        })
        // An archived student is absent from `students`, but the server group
        // still carries their record — it must not reach the screen.
        const archivedRecord = buildRecord({
            id: 99,
            studentId: 99,
            studentName: 'Ghost Alumnus',
            amountDue: 500,
            amountPaid: 500,
            outstanding: 0,
            sessionsHeld: 5,
            status: 'Paid',
        })
        const group: MonthlyPaymentGroup = {
            month: activeRecord.month,
            // Server totals span both students; the view must ignore the ghost.
            totalDue: 620,
            totalReceived: 530,
            totalOutstanding: 90,
            sessionsHeld: 9,
            records: [activeRecord, archivedRecord],
        }

        render(
            <PaymentTrackerView
                students={[active]}
                paymentsByMonth={[group]}
                onUpdatePaymentRecord={vi.fn()}
                onOpenStudentPage={vi.fn()}
            />
        )

        // The archived student never appears as a row.
        expect(screen.queryByText('Ghost Alumnus')).not.toBeInTheDocument()
        expect(screen.getByText('Asha Perera')).toBeInTheDocument()

        // Totals reflect the active student alone, not the server's whole-month
        // figures (£620 / £530). Scoped to the summary cards, since the row
        // repeats some of the same amounts.
        const card = (label: string) =>
            within(
                screen.getByText(label).closest('.payment-summary-card')!
            )
        expect(card('Due for classes taught').getByText('£120')).toBeInTheDocument()
        expect(
            card('Due for classes taught').getByText('4 classes taught')
        ).toBeInTheDocument()
        expect(card('Payments received').getByText('£30')).toBeInTheDocument()
        expect(card('Yet to be paid').getByText('£90')).toBeInTheDocument()

        // Status tally counts the one visible record: a single Partial.
        const cells = card('Payment status').getAllByRole('cell')
        expect(cells.map((cell) => cell.textContent)).toEqual(['0', '1', '0'])
    })
})

describe('PaymentTrackerView fee types', () => {
    it('shows a flat monthly basis for a monthly-fee student', () => {
        const active = buildStudent({
            id: 1,
            firstName: 'Asha',
            lastName: 'Perera',
        })
        const record = buildRecord({
            studentId: 1,
            studentName: 'Asha Perera',
            feeType: 'monthly',
            feePerSession: 400,
            sessionsHeld: 3,
        })

        render(
            <PaymentTrackerView
                students={[active]}
                paymentsByMonth={[buildGroup(record)]}
                onUpdatePaymentRecord={vi.fn()}
                onOpenStudentPage={vi.fn()}
            />
        )

        // The basis reads as a flat monthly fee, not "× £X a session".
        expect(
            screen.getByText(/£400 a month \(flat\)/i)
        ).toBeInTheDocument()
        expect(screen.queryByText(/a session/i)).not.toBeInTheDocument()
    })

    it('shows a no-fee student as "No fee" and excludes them from totals', () => {
        const active = buildStudent({
            id: 1,
            firstName: 'Asha',
            lastName: 'Perera',
        })
        const record = buildRecord({
            studentId: 1,
            studentName: 'Asha Perera',
            feeType: 'none',
            feePerSession: 0,
            amountDue: 0,
            outstanding: 0,
        })

        render(
            <PaymentTrackerView
                students={[active]}
                paymentsByMonth={[buildGroup(record)]}
                onUpdatePaymentRecord={vi.fn()}
                onOpenStudentPage={vi.fn()}
            />
        )

        // The row is present but shows "No fee" — no amount box, no status.
        expect(screen.getByText('Asha Perera')).toBeInTheDocument()
        expect(screen.getAllByText('No fee').length).toBeGreaterThan(0)
        expect(
            screen.queryByRole('spinbutton', { name: /amount received/i })
        ).not.toBeInTheDocument()

        // They don't count toward the summary: Due and the status tally are 0.
        const dueCard = within(
            screen
                .getByText('Due for classes taught')
                .closest('.payment-summary-card')!
        )
        expect(dueCard.getByText('£0')).toBeInTheDocument()
        const cells = within(
            screen.getByText('Payment status').closest('.payment-summary-card')!
        ).getAllByRole('cell')
        expect(cells.map((c) => c.textContent)).toEqual(['0', '0', '0'])
    })
})
