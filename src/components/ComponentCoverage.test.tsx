import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
    MonthlyPaymentGroup,
    PaymentRecord,
    ScheduledSession,
    Student,
} from '../data/students'
import { ClassSchedulingView } from './ClassSchedulingView'
import { DashboardView } from './DashboardView'
import { PaymentTrackerView } from './PaymentTrackerView'
import { PaymentsView } from './PaymentsView'
import { StudentFormModal } from './StudentFormModal'
import { StudentList } from './StudentList'

beforeEach(() => {
    window.scrollTo = vi.fn()
})

const today = new Date()

/** The planner's day key: local calendar, matching the grid (never toISOString). */
const dateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** The button that opens a day. The cell itself is a gridcell, not a button. */
const openDayCell = (day: Date) =>
    screen.getByRole('button', { name: `Open ${day.toDateString()}` })

/** The numbered chip for the nth class on a day (1-based), as shown on the grid. */
const classChip = (day: Date, number: number) =>
    screen.getByRole('button', {
        name: new RegExp(`^Class ${number} on ${day.toDateString()}`),
    })

/** Groups flat payment records the way GET /payments/by-month does. */
/** Mirrors the API: a bill is classes taught x the per-session fee. */
const buildPayment = (
    overrides: Partial<PaymentRecord> & { month: string }
): PaymentRecord => {
    const feePerSession = overrides.feePerSession ?? 120
    const sessionsHeld = overrides.sessionsHeld ?? 4
    const amountDue = overrides.amountDue ?? feePerSession * sessionsHeld
    const amountPaid = overrides.amountPaid ?? 0
    return {
        id: overrides.id ?? 1,
        studentId: overrides.studentId ?? 1,
        studentName: overrides.studentName ?? 'Asha Perera',
        month: overrides.month,
        feePerSession,
        sessionsHeld,
        amountDue,
        amountPaid,
        outstanding: Math.max(amountDue - amountPaid, 0),
        status:
            overrides.status ??
            (amountDue > 0 && amountPaid >= amountDue
                ? 'Paid'
                : amountPaid > 0
                  ? 'Partial'
                  : 'Pending'),
        notes: overrides.notes ?? '',
        sessions: overrides.sessions ?? [],
        totalDurationMinutes: overrides.totalDurationMinutes ?? 0,
    }
}

const toGroups = (records: PaymentRecord[]): MonthlyPaymentGroup[] => {
    const byMonth = new Map<string, PaymentRecord[]>()
    records.forEach((record) => {
        const existing = byMonth.get(record.month)
        if (existing) {
            existing.push(record)
        } else {
            byMonth.set(record.month, [record])
        }
    })
    return [...byMonth.entries()].map(([month, list]) => {
        const totalDue = list.reduce((sum, r) => sum + r.amountDue, 0)
        const totalReceived = list.reduce((sum, r) => sum + r.amountPaid, 0)
        return {
            month,
            totalDue,
            totalReceived,
            totalOutstanding: Math.max(totalDue - totalReceived, 0),
            sessionsHeld: list.reduce((sum, r) => sum + r.sessionsHeld, 0),
            records: list,
        }
    })
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
    fees: overrides.fees ?? 120,
    notes: overrides.notes ?? 'Excellent problem solving skills.',
    parentName: overrides.parentName ?? 'Nadia Patel',
    contactNumber: overrides.contactNumber ?? '+44 7700 900123',
    address: overrides.address ?? '12 Oak Road, Kingston upon Thames, KT2 6LP',
})

const upcomingSessions = [
    {
        id: 1,
        subject: 'Mathematics',
        date: '2026-07-11',
        time: '16:00',
        notes: 'Problem solving practice',
        members: [
            { studentId: 1, studentName: 'Asha Perera', year: '10' },
        ],
    },
]

describe('component-level coverage', () => {
    it('renders dashboard summary data and triggers the student-management action', async () => {
        const user = userEvent.setup()
        const onManageStudents = vi.fn()
        const onOpenSnapshot = vi.fn()

        render(
            <DashboardView
                stats={{
                    onlineStudents: 2,
                    faceToFaceStudents: 3,
                    avgProgress: 82,
                    totalStudents: 5,
                }}
                attention={{
                    onTrack: [
                        { id: 2, name: 'Bea Two' },
                        { id: 3, name: 'Cy Three' },
                        { id: 4, name: 'Dee Four' },
                    ],
                    developing: [{ id: 5, name: 'Evan Five' }],
                    needsAttention: [{ id: 1, name: 'Asha Perera' }],
                    total: 5,
                }}
                upcomingSessions={upcomingSessions}
                weekLoad={[]}
                onManageStudents={onManageStudents}
                onOpenSnapshot={onOpenSnapshot}
                onOpenStudentPage={vi.fn()}
                onOpenDay={vi.fn()}
            />
        )

        expect(screen.getByText('Today at a glance')).toBeInTheDocument()
        expect(screen.getByText('Total students')).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /manage students/i })
        )

        expect(onManageStudents).toHaveBeenCalledTimes(1)

        // The stat tiles are doors, not decoration: each opens the page
        // behind its number.
        await user.click(
            screen.getByRole('button', { name: /total students/i })
        )
        expect(onManageStudents).toHaveBeenCalledTimes(2)
        await user.click(
            screen.getByRole('button', { name: /avg progress/i })
        )
        expect(onOpenSnapshot).toHaveBeenCalledTimes(1)
    })

    it('renders student link rows and emits navigation callback', async () => {
        const user = userEvent.setup()
        const onOpenStudentPage = vi.fn()

        render(
            <StudentList
                students={[buildStudent()]}
                onOpenStudentPage={onOpenStudentPage}
            />
        )

        await user.click(screen.getByRole('link', { name: /asha perera/i }))

        expect(onOpenStudentPage).toHaveBeenCalledWith(1)
    })

    it('renders the student form modal fields', () => {
        render(
            <StudentFormModal
                open
                form={{
                    studentId: '',
                    firstName: '',
                    lastName: '',
                    dob: '',
                    subjects: [],
                    school: '',
                    year: '',
                    progress: 0,
                    mode: 'Face to Face',
                    notes: '',
                    parentName: '',
                    contactNumber: '',
                    address: '',
                }}
                onClose={vi.fn()}
                onChange={vi.fn()}
                onSubmit={vi.fn()}
            />
        )

        expect(
            screen.getByRole('heading', { name: /add a new student/i })
        ).toBeInTheDocument()
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/subjects/i)).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /save student/i })
        ).toBeInTheDocument()
    })

    it('sorts the study snapshot table and paginates through the rows', async () => {
        const user = userEvent.setup()
        const students = Array.from({ length: 6 }, (_, index) =>
            buildStudent({
                id: index + 1,
                firstName: `Student${index + 1}`,
                lastName: 'Example',
                subjects: [index % 2 === 0 ? 'Biology' : 'Chemistry'],
            })
        )

        render(<PaymentsView students={students} sessions={[]} />)

        await user.selectOptions(
            screen.getByRole('combobox', { name: /rows per page/i }),
            '5'
        )

        expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()
        expect(screen.getByText('Student1 Example')).toBeInTheDocument()
        expect(screen.queryByText('Student6 Example')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /subject/i }))

        const bodyRows = screen.getAllByRole('row')
        expect(bodyRows[1]).toHaveTextContent('Biology')

        await user.click(screen.getByRole('button', { name: /next/i }))

        expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument()
        expect(screen.getByText('Student6 Example')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /previous/i }))

        expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()
    })

    it('renders and updates the payment tracker for a selected month', async () => {
        const user = userEvent.setup()
        const onUpdatePaymentRecord = vi.fn()
        const onOpenStudentPage = vi.fn()
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

        render(
            <PaymentTrackerView
                students={[buildStudent()]}
                paymentsByMonth={toGroups([
                    buildPayment({ id: 1, studentId: 1, studentName: 'Asha Perera', month: currentMonth, feePerSession: 120, sessionsHeld: 1, amountPaid: 0, notes: 'Awaiting payment' }),
                ])}
                onUpdatePaymentRecord={onUpdatePaymentRecord}
                onOpenStudentPage={onOpenStudentPage}
            />
        )

        expect(
            screen.getByRole('heading', { name: /monthly payment tracking/i })
        ).toBeInTheDocument()
        expect(screen.getByText(/payments received/i)).toBeInTheDocument()

        // Status is derived by the API — the row shows it as a read-only pill,
        // with no control that could contradict what is owed.
        expect(
            screen.queryByRole('button', {
                name: /mark asha perera as paid/i,
            })
        ).not.toBeInTheDocument()

        // The student's name opens their page, so details can be fixed from here.
        await user.click(screen.getByRole('button', { name: 'Asha Perera' }))
        expect(onOpenStudentPage).toHaveBeenCalledWith(1)

        // The amount box is free to type in — typing (and any non-Enter key)
        // must NOT hit the API on every keystroke.
        const amountInput = screen.getByRole('spinbutton', {
            name: /asha perera amount received/i,
        })
        const saveAmount = screen.getByRole('button', {
            name: /save asha perera amount received/i,
        })
        // Nothing typed yet, so there is nothing to save.
        expect(saveAmount).toBeDisabled()

        const beforeTyping = onUpdatePaymentRecord.mock.calls.length
        fireEvent.change(amountInput, { target: { value: '9' } })
        fireEvent.change(amountInput, { target: { value: '90' } })
        fireEvent.keyDown(amountInput, { key: 'a' })
        expect(onUpdatePaymentRecord.mock.calls.length).toBe(beforeTyping)

        // Blur must NOT commit — leaving the box is no longer a save.
        fireEvent.blur(amountInput)
        expect(onUpdatePaymentRecord.mock.calls.length).toBe(beforeTyping)

        // The Save button commits the typed amount.
        expect(saveAmount).toBeEnabled()
        fireEvent.click(saveAmount)
        expect(onUpdatePaymentRecord).toHaveBeenLastCalledWith(
            expect.objectContaining({ amountPaid: 90 })
        )

        // Enter is also an explicit commit; an empty box settles to 0.
        const afterSave = onUpdatePaymentRecord.mock.calls.length
        fireEvent.change(amountInput, { target: { value: '' } })
        fireEvent.keyDown(amountInput, { key: 'Enter' })
        expect(onUpdatePaymentRecord).toHaveBeenLastCalledWith(
            expect.objectContaining({ amountPaid: 0 })
        )
        expect(onUpdatePaymentRecord.mock.calls.length).toBeGreaterThan(
            afterSave
        )

        fireEvent.change(screen.getByLabelText(/asha perera payment notes/i), {
            target: { value: 'Paid in cash' },
        })
        expect(onUpdatePaymentRecord).toHaveBeenCalledWith(
            expect.objectContaining({ notes: 'Paid in cash' })
        )
    })

    it('resets the payment tracker month to the current period', async () => {
        const user = userEvent.setup()
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        const nextMonth = `${new Date().getFullYear()}-${String(Math.min(new Date().getMonth() + 2, 12)).padStart(2, '0')}`

        render(
            <PaymentTrackerView
                students={[buildStudent()]}
                paymentsByMonth={toGroups([
                    buildPayment({ id: 1, studentId: 1, studentName: 'Asha Perera', month: currentMonth, feePerSession: 120, sessionsHeld: 1, amountPaid: 0, notes: 'Awaiting payment' }),
                    buildPayment({ id: 2, studentId: 1, studentName: 'Asha Perera', month: nextMonth, feePerSession: 120, sessionsHeld: 1, amountPaid: 50, notes: 'Carry over balance' }),
                ])}
                onUpdatePaymentRecord={vi.fn()}
                onOpenStudentPage={vi.fn()}
            />
        )

        await user.selectOptions(screen.getByLabelText(/month/i), nextMonth)
        expect(screen.getByLabelText(/month/i)).toHaveValue(nextMonth)

        await user.click(
            screen.getByRole('button', { name: /reset to current month/i })
        )

        expect(screen.getByLabelText(/month/i)).toHaveValue(currentMonth)
    })

    it('omits students without payment records for the selected month', () => {
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

        render(
            <PaymentTrackerView
                students={[
                    buildStudent(),
                    buildStudent({
                        id: 2,
                        firstName: 'Maya',
                        lastName: 'Fernando',
                    }),
                ]}
                paymentsByMonth={toGroups([
                    buildPayment({ id: 1, studentId: 1, studentName: 'Asha Perera', month: currentMonth, feePerSession: 120, sessionsHeld: 1, amountPaid: 120, notes: 'Settled' }),
                ])}
                onUpdatePaymentRecord={vi.fn()}
                onOpenStudentPage={vi.fn()}
            />
        )

        expect(screen.getByText(/asha perera/i)).toBeInTheDocument()
        expect(screen.queryByText(/maya fernando/i)).not.toBeInTheDocument()
    })

    it('shows zeroed totals when the selected month has no payment group', () => {
        render(
            <PaymentTrackerView
                students={[buildStudent()]}
                paymentsByMonth={[]}
                onUpdatePaymentRecord={vi.fn()}
                onOpenStudentPage={vi.fn()}
            />
        )

        expect(
            screen.getByRole('heading', { name: /monthly payment tracking/i })
        ).toBeInTheDocument()
        // No group for this month -> totals fall back to zero.
        expect(screen.getAllByText('£0').length).toBeGreaterThan(0)
        expect(screen.queryByText(/asha perera/i)).not.toBeInTheDocument()
    })

    it('summarizes payment statuses for the selected month', () => {
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

        render(
            <PaymentTrackerView
                students={[
                    buildStudent(),
                    buildStudent({
                        id: 2,
                        firstName: 'Maya',
                        lastName: 'Fernando',
                    }),
                    buildStudent({
                        id: 3,
                        firstName: 'Nimal',
                        lastName: 'Silva',
                    }),
                ]}
                paymentsByMonth={toGroups([
                    buildPayment({ id: 1, studentId: 1, studentName: 'Asha Perera', month: currentMonth, feePerSession: 120, sessionsHeld: 1, amountPaid: 120, notes: 'Settled' }),
                    buildPayment({ id: 2, studentId: 2, studentName: 'Maya Fernando', month: currentMonth, feePerSession: 130, sessionsHeld: 1, amountPaid: 65, notes: 'Half received' }),
                    buildPayment({ id: 3, studentId: 3, studentName: 'Nimal Silva', month: currentMonth, feePerSession: 140, sessionsHeld: 1, amountPaid: 0, notes: 'Awaiting payment' }),
                ])}
                onUpdatePaymentRecord={vi.fn()}
                onOpenStudentPage={vi.fn()}
            />
        )

        // The status card names each count in a small three-column table.
        const statusTable = screen
            .getByRole('columnheader', { name: 'Paid' })
            .closest('table') as HTMLElement
        expect(
            within(statusTable).getByRole('columnheader', { name: 'Partial' })
        ).toBeInTheDocument()
        expect(
            within(statusTable).getByRole('columnheader', { name: 'Pending' })
        ).toBeInTheDocument()
        expect(
            within(statusTable)
                .getAllByRole('cell')
                .map((cell) => cell.textContent)
        ).toEqual(['1', '1', '1'])
        expect(screen.getByText(/£390/i)).toBeInTheDocument()
        expect(screen.getByText(/£185/i)).toBeInTheDocument()
    })


    it('numbers a day\'s classes by time and opens the one whose number is clicked', async () => {
        const user = userEvent.setup()
        const session = (
            id: number,
            date: string,
            time: string,
            studentName: string
        ): ScheduledSession => ({
            id,
            studentId: 1,
            studentName,
            year: '10',
            subject: 'Mathematics',
            date,
            time,
            notes: `${studentName} notes`,
            status: 'Scheduled',
        })

        const day = new Date(today.getFullYear(), today.getMonth(), 12, 12)
        const dayKey = dateKey(day)
        const otherKey = dateKey(
            new Date(today.getFullYear(), today.getMonth(), 13, 12)
        )

        render(
            <ClassSchedulingView
                students={[buildStudent()]}
                sessions={[
                    // Deliberately out of time order, and not id order.
                    session(1, dayKey, '16:00', 'Third Student'),
                    session(2, dayKey, '09:00', 'First Student'),
                    session(3, otherKey, '10:00', 'Other Day Student'),
                    session(4, dayKey, '11:00', 'Second Student'),
                ]}
                onScheduleClass={vi.fn()}
                onEditClass={vi.fn()}
                onSetSessionStatus={vi.fn()}
            />
        )

        // Numbered 1..3 by time — the neighbouring day's class is not among them.
        expect(classChip(day, 1)).toHaveAccessibleName(/09:00 First Student/)
        expect(classChip(day, 2)).toHaveAccessibleName(/11:00 Second Student/)
        expect(classChip(day, 3)).toHaveAccessibleName(/16:00 Third Student/)
        expect(
            screen.queryByRole('button', {
                name: new RegExp(`^Class 4 on ${day.toDateString()}`),
            })
        ).not.toBeInTheDocument()

        // Clicking number 3 opens that class into the form, not the day's first.
        await user.click(classChip(day, 3))
        const dialog = screen.getByRole('dialog')
        expect(within(dialog).getByLabelText(/time/i)).toHaveValue('16:00')
        expect(within(dialog).getByLabelText(/notes/i)).toHaveValue(
            'Third Student notes'
        )

        // The numbers repeat inside the modal, and switch which one is shown.
        await user.click(within(dialog).getByRole('tab', { name: '1' }))
        expect(within(dialog).getByLabelText(/time/i)).toHaveValue('09:00')
        expect(within(dialog).getByLabelText(/notes/i)).toHaveValue(
            'First Student notes'
        )
    })

    it('opens a day on its earliest class when the date itself is clicked', async () => {
        const user = userEvent.setup()
        const day = new Date(today.getFullYear(), today.getMonth(), 9, 12)
        const base = {
            studentId: 1,
            studentName: 'Asha Perera',
            year: '10',
            subject: 'Mathematics',
            date: dateKey(day),
            status: 'Scheduled' as const,
        }

        render(
            <ClassSchedulingView
                students={[buildStudent()]}
                sessions={[
                    { ...base, id: 1, time: '15:00', notes: '' },
                    { ...base, id: 2, time: '08:00', notes: 'Morning' },
                ]}
                onScheduleClass={vi.fn()}
                onEditClass={vi.fn()}
                onSetSessionStatus={vi.fn()}
            />
        )

        await user.click(openDayCell(day))

        // Populated with the existing schedule, starting at the earliest class.
        const dialog = screen.getByRole('dialog')
        expect(within(dialog).getByLabelText(/time/i)).toHaveValue('08:00')
        expect(within(dialog).getByLabelText(/notes/i)).toHaveValue('Morning')
        expect(within(dialog).getByRole('tab', { name: '1' })).toHaveAttribute(
            'aria-selected',
            'true'
        )

        // A class booked without notes fills the notes field blank.
        await user.click(within(dialog).getByRole('tab', { name: '2' }))
        expect(within(dialog).getByLabelText(/time/i)).toHaveValue('15:00')
        expect(within(dialog).getByLabelText(/notes/i)).toHaveValue('')
    })

    it('shades a busy day and reveals its classes on hover', async () => {
        const user = userEvent.setup()
        const onScheduleClass = vi.fn()
        const today = new Date()
        const scheduledDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            1,
            12
        )
        const day = scheduledDay.toISOString().slice(0, 10)
        const session = (
            id: number,
            studentId: number,
            studentName: string,
            subject: string,
            time: string,
            status: ScheduledSession['status'] = 'Scheduled'
        ): ScheduledSession => ({
            id,
            studentId,
            studentName,
            year: '10',
            subject,
            date: day,
            time,
            notes: '',
            status,
        })

        render(
            <ClassSchedulingView
                students={[
                    buildStudent(),
                    buildStudent({
                        id: 2,
                        firstName: 'Maya',
                        lastName: 'Fernando',
                        subjects: ['Physics', 'Chemistry'],
                    }),
                ]}
                sessions={[
                    // Four classes on one day, two students, one cancelled.
                    session(1, 1, 'Asha Perera', 'Mathematics', '09:00'),
                    session(2, 1, 'Asha Perera', 'Mathematics', '10:00'),
                    session(3, 2, 'Maya Fernando', 'Physics', '11:00'),
                    session(4, 2, 'Maya Fernando', 'Physics', '12:00', 'Cancelled'),
                ]}
                onScheduleClass={onScheduleClass}
                onSetSessionStatus={vi.fn()}
            />
        )

        expect(
            screen.getByRole('heading', { name: /class scheduling/i })
        ).toBeInTheDocument()

        // The cancelled one is not counted: three classes are actually on.
        const busyDay = screen.getByRole('gridcell', {
            name: new RegExp(`${scheduledDay.toDateString()}: 3 classes`),
        })
        expect(busyDay).toHaveClass('booked-medium')

        // Details are revealed on hover, not printed into the grid.
        expect(screen.queryByText('Maya Fernando · Physics')).not.toBeInTheDocument()
        await user.hover(busyDay)

        // All four classes are listed with their times, including both
        // students and both of Asha's back-to-back slots.
        expect(await screen.findByText('09:00')).toBeInTheDocument()
        expect(screen.getByText('10:00')).toBeInTheDocument()
        expect(screen.getByText('11:00')).toBeInTheDocument()
        expect(screen.getByText('12:00')).toBeInTheDocument()
        // Scope to the tooltip: the student picker also says "Asha Perera".
        const tooltip = screen.getByRole('tooltip')
        expect(within(tooltip).getAllByText(/Asha Perera/)).toHaveLength(2)
        expect(within(tooltip).getAllByText(/Maya Fernando/)).toHaveLength(2)
        // The cancelled one still appears, labelled rather than struck through.
        expect(screen.getByText('Cancelled')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /next/i }))
        await user.click(screen.getByRole('button', { name: /previous/i }))
    })

    it("filters the calendar to one student's classes, view-only", async () => {
        const user = userEvent.setup()
        const scheduledDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            1,
            12
        )
        const day = scheduledDay.toISOString().slice(0, 10)
        const session = (
            id: number,
            studentId: number,
            studentName: string,
            time: string
        ): ScheduledSession => ({
            id,
            studentId,
            studentName,
            year: '10',
            subject: 'Mathematics',
            date: day,
            time,
            notes: '',
            status: 'Scheduled',
        })

        render(
            <ClassSchedulingView
                students={[
                    buildStudent(),
                    buildStudent({
                        id: 2,
                        firstName: 'Maya',
                        lastName: 'Fernando',
                        subjects: ['Physics'],
                    }),
                ]}
                sessions={[
                    session(1, 1, 'Asha Perera', '09:00'),
                    session(2, 1, 'Asha Perera', '10:00'),
                    session(3, 2, 'Maya Fernando', '11:00'),
                ]}
                onScheduleClass={vi.fn()}
                onSetSessionStatus={vi.fn()}
            />
        )

        // Unfiltered: the day carries all three classes.
        expect(
            screen.getByRole('gridcell', {
                name: new RegExp(`${scheduledDay.toDateString()}: 3 classes`),
            })
        ).toBeInTheDocument()

        // Filter to Maya: the calendar shows only her class.
        await user.click(
            screen.getByLabelText(/show one student's classes/i)
        )
        await user.click(await screen.findByText('Maya Fernando • Year 10'))
        expect(
            screen.getByRole('gridcell', {
                name: new RegExp(`${scheduledDay.toDateString()}: 1 class`),
            })
        ).toBeInTheDocument()
        expect(
            screen.getByText(/showing maya's classes/i)
        ).toBeInTheDocument()

        // View-only: opening the day still lists every class booked on it
        // (three class tabs + the add tab), so an edit made while filtered
        // can never drop other students.
        await user.click(
            screen.getByRole('button', {
                name: `Open ${scheduledDay.toDateString()}`,
            })
        )
        expect(screen.getAllByRole('tab')).toHaveLength(4)
    })

    it('switches to a week view listing classes readably, and back', async () => {
        const user = userEvent.setup()
        const todayNoon = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            12
        )
        render(
            <ClassSchedulingView
                students={[buildStudent()]}
                sessions={[
                    {
                        id: 1,
                        studentId: 1,
                        studentName: 'Asha Perera',
                        year: '10',
                        subject: 'Mathematics',
                        date: dateKey(todayNoon),
                        time: '09:00',
                        notes: '',
                        status: 'Scheduled',
                    },
                ]}
                onScheduleClass={vi.fn()}
                onEditClass={vi.fn()}
                onSetSessionStatus={vi.fn()}
            />
        )

        await user.click(screen.getByRole('button', { name: /^week$/i }))

        // Today's class reads as a row — time, student, subject — and the
        // day is openable like a month cell.
        const entry = screen.getByRole('button', {
            name: new RegExp(
                `^09:00 Asha Perera, Mathematics on ${todayNoon.toDateString()}`
            ),
        })
        expect(entry).toBeInTheDocument()
        expect(
            screen.getByRole('grid', { name: /class schedule week/i })
        ).toBeInTheDocument()

        // A week step moves seven days: this week's class leaves the view.
        await user.click(screen.getByRole('button', { name: /next/i }))
        expect(
            screen.queryByRole('button', { name: /^09:00 Asha Perera/ })
        ).not.toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /previous/i }))

        // Clicking the class opens the same edit modal as the month view.
        await user.click(
            screen.getByRole('button', { name: /^09:00 Asha Perera/ })
        )
        const dialog = await screen.findByRole('dialog')
        expect(within(dialog).getByLabelText(/time/i)).toHaveValue('09:00')

        // And back to the familiar month grid.
        await user.keyboard('{Escape}')
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )
        await user.click(screen.getByRole('button', { name: /^month$/i }))
        expect(
            screen.getByRole('grid', { name: /class schedule calendar/i })
        ).toBeInTheDocument()
    })

    it('returns to the current month with Current', async () => {
        const user = userEvent.setup()
        render(
            <ClassSchedulingView
                students={[buildStudent()]}
                sessions={[]}
                onScheduleClass={vi.fn()}
                onEditClass={vi.fn()}
                onSetSessionStatus={vi.fn()}
            />
        )
        const currentLabel = today.toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric',
        })
        expect(
            screen.getByRole('heading', { name: currentLabel })
        ).toBeInTheDocument()
        // Already looking at now: nowhere for Current to go.
        expect(
            screen.getByRole('button', { name: /^current$/i })
        ).toBeDisabled()

        await user.click(screen.getByRole('button', { name: /next/i }))
        expect(
            screen.queryByRole('heading', { name: currentLabel })
        ).not.toBeInTheDocument()

        const currentButton = screen.getByRole('button', {
            name: /^current$/i,
        })
        expect(currentButton).toBeEnabled()
        await user.click(currentButton)
        expect(
            screen.getByRole('heading', { name: currentLabel })
        ).toBeInTheDocument()
        expect(currentButton).toBeDisabled()
    })

    it('warns about an overlapping class without blocking the booking', async () => {
        const user = userEvent.setup()
        const day = new Date(today.getFullYear(), today.getMonth(), 14, 12)
        render(
            <ClassSchedulingView
                students={[buildStudent()]}
                sessions={[
                    {
                        id: 1,
                        studentId: 1,
                        studentName: 'Asha Perera',
                        year: '10',
                        subject: 'Mathematics',
                        date: dateKey(day),
                        time: '09:00',
                        notes: '',
                        status: 'Scheduled',
                    },
                ]}
                onScheduleClass={vi.fn()}
                onEditClass={vi.fn()}
                onSetSessionStatus={vi.fn()}
            />
        )

        await user.click(openDayCell(day))
        // Editing the 09:00 class itself: its own slot is not a clash.
        expect(screen.queryByText(/overlaps/i)).not.toBeInTheDocument()

        // A second class for the same student, half-way through the first.
        await user.click(screen.getByRole('tab', { name: /add a class/i }))
        await user.type(screen.getByLabelText(/students/i), 'Asha')
        await user.click(await screen.findByRole('option', { name: /asha/i }))
        fireEvent.change(screen.getByLabelText(/time/i), {
            target: { value: '09:30' },
        })
        expect(
            screen.getByText(/overlaps asha perera’s 09:00 class/i)
        ).toBeInTheDocument()
        // A warning, never a blocker — the booking stays available.
        expect(
            screen.getByRole('button', { name: /add class/i })
        ).toBeEnabled()

        // Clear of the slot, the warning goes.
        fireEvent.change(screen.getByLabelText(/time/i), {
            target: { value: '11:00' },
        })
        expect(screen.queryByText(/overlaps/i)).not.toBeInTheDocument()
    })

    it('shows the empty scheduler state when there are no students', async () => {
        const user = userEvent.setup()
        const onOpenStudentPage = vi.fn()
        const onScheduleClass = vi.fn()

        render(
            <ClassSchedulingView
                students={[]}
                sessions={[]}
                onOpenStudentPage={onOpenStudentPage}
                onScheduleClass={onScheduleClass}
            />
        )

        await user.click(openDayCell(today))

        // No students to pick, so the picker holds no one.
        expect(screen.getByLabelText(/students/i)).toHaveValue('')

        // A subject alone (typed, then committed as a chip) is not enough.
        await user.type(screen.getByLabelText(/subject/i), 'Biology{Enter}')
        fireEvent.click(screen.getByRole('button', { name: /add class/i }))

        expect(onOpenStudentPage).not.toHaveBeenCalled()
        expect(onScheduleClass).not.toHaveBeenCalled()
    })

    it('marks the required class fields on an empty Add attempt (REQ-029)', async () => {
        const user = userEvent.setup()
        const onScheduleClass = vi.fn()

        render(
            <ClassSchedulingView
                students={[buildStudent()]}
                sessions={[]}
                onOpenStudentPage={vi.fn()}
                onScheduleClass={onScheduleClass}
            />
        )

        await user.click(openDayCell(today))
        // Add with nothing chosen — no student, no subject, no time.
        fireEvent.click(screen.getByRole('button', { name: /add class/i }))

        expect(onScheduleClass).not.toHaveBeenCalled()
        expect(
            screen.getByText('Pick at least one student')
        ).toBeInTheDocument()
        expect(
            screen.getByText('Pick at least one subject')
        ).toBeInTheDocument()
        expect(screen.getByText('Time is required')).toBeInTheDocument()
    })

    it('switches the scheduler selection from autocomplete options', async () => {
        const user = userEvent.setup()
        const onOpenStudentPage = vi.fn()
        const onScheduleClass = vi.fn()

        render(
            <ClassSchedulingView
                students={[
                    buildStudent(),
                    buildStudent({
                        id: 2,
                        firstName: 'Maya',
                        lastName: 'Fernando',
                        subjects: ['Physics', 'Chemistry'],
                    }),
                ]}
                sessions={[]}
                onOpenStudentPage={onOpenStudentPage}
                onScheduleClass={onScheduleClass}
            />
        )

        await user.click(openDayCell(today))

        const studentSearch = screen.getByRole('combobox', {
            name: /students/i,
        })
        await user.type(studentSearch, 'Maya')
        await user.click(
            screen.getByRole('option', { name: /maya fernandoyear 10/i })
        )

        expect(
            screen.getByRole('button', { name: /maya fernando • year 10/i })
        ).toBeInTheDocument()

        // The Subject dropdown offers only Maya's registered subjects —
        // Physics and Chemistry — not every subject taught (no Mathematics).
        const subjectSearch = screen.getByRole('combobox', {
            name: /subject/i,
        })
        await user.click(subjectSearch)
        expect(
            screen.getByRole('option', { name: 'Physics' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('option', { name: 'Chemistry' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('option', { name: 'Mathematics' })
        ).not.toBeInTheDocument()

        // Teacher picks one of the offered subjects.
        await user.click(screen.getByRole('option', { name: 'Physics' }))
        expect(
            screen.getByRole('button', { name: 'Physics' })
        ).toBeInTheDocument()

        // A second student joins — the options widen to the union of both
        // students' subjects, so Mathematics (Asha's) becomes selectable, while
        // the already-picked Physics stays.
        await user.type(studentSearch, 'Asha')
        await user.click(
            screen.getByRole('option', { name: /asha pererayear 10/i })
        )
        expect(
            screen.getByRole('button', { name: /asha perera • year 10/i })
        ).toBeInTheDocument()
        await user.click(subjectSearch)
        expect(
            screen.getByRole('option', { name: 'Mathematics' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Physics' })
        ).toBeInTheDocument()

        expect(onOpenStudentPage).not.toHaveBeenCalled()
        expect(onScheduleClass).not.toHaveBeenCalled()
    })

    it('leaves the subject blank for a student who has none', async () => {
        const user = userEvent.setup()
        render(
            <ClassSchedulingView
                students={[buildStudent({ subjects: [] })]}
                sessions={[]}
                onScheduleClass={vi.fn()}
                onEditClass={vi.fn()}
                onSetSessionStatus={vi.fn()}
            />
        )

        await user.click(openDayCell(today))
        await user.type(screen.getByLabelText(/students/i), 'Asha')
        await user.click(await screen.findByRole('option', { name: /asha/i }))
        expect(screen.getByLabelText(/subject/i)).toHaveValue('')

        // Unpicking her again (backspace eats the chip) still defaults to
        // no subjects — there is no one left to borrow one from.
        await user.type(screen.getByLabelText(/students/i), '{Backspace}')
        expect(screen.getByLabelText(/subject/i)).toHaveValue('')
    })

    it('saves a scheduled class with the default note when notes are empty', async () => {
        const user = userEvent.setup()
        const onOpenStudentPage = vi.fn()
        const onScheduleClass = vi.fn()

        render(
            <ClassSchedulingView
                students={[buildStudent()]}
                sessions={[]}
                onOpenStudentPage={onOpenStudentPage}
                onScheduleClass={onScheduleClass}
            />
        )

        const day = new Date(today.getFullYear(), today.getMonth(), 18, 12)
        await user.click(openDayCell(day))

        // An empty day presets nothing, so the whole class is entered by hand.
        await user.type(screen.getByLabelText(/students/i), 'Asha')
        await user.click(await screen.findByRole('option', { name: /asha/i }))
        // Subject is limited to the student's registered subjects — pick it.
        await user.click(screen.getByRole('combobox', { name: /subject/i }))
        await user.click(screen.getByRole('option', { name: 'Mathematics' }))
        fireEvent.change(screen.getByLabelText(/time/i), {
            target: { value: '16:00' },
        })

        await user.click(screen.getByRole('button', { name: /add class/i }))

        // The date is the day that was clicked — there is no date field to type.
        expect(onScheduleClass).toHaveBeenCalledWith(
            expect.objectContaining({
                studentIds: [1],
                notes: 'Scheduled from the class planner',
                date: dateKey(day),
            })
        )

        // Saving closes the day. Awaited: the dialog lingers in the DOM while
        // its exit transition runs.
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )
    })

    it('books with a chosen duration, and the ✕ dismisses the day', async () => {
        const user = userEvent.setup()
        const onScheduleClass = vi.fn()

        render(
            <ClassSchedulingView
                students={[buildStudent()]}
                sessions={[]}
                onOpenStudentPage={vi.fn()}
                onScheduleClass={onScheduleClass}
            />
        )

        const day = new Date(today.getFullYear(), today.getMonth(), 19, 12)
        await user.click(openDayCell(day))

        await user.type(screen.getByLabelText(/students/i), 'Asha')
        await user.click(await screen.findByRole('option', { name: /asha/i }))
        // Subject is limited to the student's registered subjects — pick it.
        await user.click(screen.getByRole('combobox', { name: /subject/i }))
        await user.click(screen.getByRole('option', { name: 'Mathematics' }))
        fireEvent.change(screen.getByLabelText(/time/i), {
            target: { value: '10:00' },
        })

        // 1 hour is the default; pick 1.5 hours instead.
        await user.click(screen.getByLabelText(/duration/i))
        await user.click(
            await screen.findByRole('option', { name: /1\.5 hours/i })
        )
        await user.click(screen.getByRole('button', { name: /add class/i }))

        expect(onScheduleClass).toHaveBeenCalledWith(
            expect.objectContaining({ durationMinutes: 90 })
        )
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )

        // Reopen; the ✕ dismisses without saving anything further.
        await user.click(openDayCell(day))
        await user.click(screen.getByRole('button', { name: /^close$/i }))
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )
        expect(onScheduleClass).toHaveBeenCalledTimes(1)
    })

    it('mirrors the selected class into the form, and presets nothing on an empty day', async () => {
        const user = userEvent.setup()
        const booked = new Date(today.getFullYear(), today.getMonth(), 21, 12)
        const empty = new Date(today.getFullYear(), today.getMonth(), 22, 12)
        const base = {
            year: '10',
            date: dateKey(booked),
            notes: '',
            status: 'Scheduled' as const,
        }

        render(
            <ClassSchedulingView
                students={[
                    buildStudent(),
                    buildStudent({
                        id: 2,
                        firstName: 'Maya',
                        lastName: 'Fernando',
                        subjects: ['Physics', 'Chemistry'],
                    }),
                ]}
                sessions={[
                    {
                        ...base,
                        id: 1,
                        studentId: 1,
                        studentName: 'Asha Perera',
                        subject: 'Mathematics',
                        time: '09:00',
                    },
                    {
                        ...base,
                        id: 2,
                        studentId: 2,
                        studentName: 'Maya Fernando',
                        subject: 'Physics',
                        time: '13:00',
                    },
                ]}
                onScheduleClass={vi.fn()}
                onSetSessionStatus={vi.fn()}
            />
        )

        // Opening the day fills the form from its first class — the student
        // rides as a chip on the (locked-while-editing) picker.
        await user.click(openDayCell(booked))
        expect(screen.getByText('Asha Perera • Year 10')).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Mathematics' })
        ).toBeInTheDocument()
        expect(screen.getByLabelText(/time/i)).toHaveValue('09:00')

        // Picking another number re-fills it from that class — the first
        // class's subject chip makes way for the new one.
        await user.click(screen.getByRole('tab', { name: '2' }))
        expect(screen.getByText('Maya Fernando • Year 10')).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Physics' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Mathematics' })
        ).not.toBeInTheDocument()
        expect(screen.getByLabelText(/time/i)).toHaveValue('13:00')

        // A day with nothing booked presets nothing at all.
        await user.keyboard('{Escape}')
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )
        await user.click(openDayCell(empty))
        expect(screen.getByLabelText(/students/i)).toHaveValue('')
        expect(screen.getByLabelText(/subject/i)).toHaveValue('')
        expect(
            screen.queryByRole('button', { name: 'Physics' })
        ).not.toBeInTheDocument()
        expect(screen.getByLabelText(/time/i)).toHaveValue('')
        // In add mode there is no chip row (nothing booked to pick).
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })

    it('dismisses the day without booking anything', async () => {
        const user = userEvent.setup()
        const onScheduleClass = vi.fn()

        render(
            <ClassSchedulingView
                students={[buildStudent()]}
                sessions={[]}
                onScheduleClass={onScheduleClass}
                onSetSessionStatus={vi.fn()}
            />
        )

        await user.click(openDayCell(today))
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        await user.keyboard('{Escape}')

        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )
        expect(onScheduleClass).not.toHaveBeenCalled()
    })

    describe('editing and cancelling a booked class', () => {
        const day = new Date(today.getFullYear(), today.getMonth(), 14, 12)
        const bookedClass = (
            overrides: Partial<ScheduledSession> = {}
        ): ScheduledSession => ({
            id: 1,
            studentId: 1,
            studentName: 'Asha Perera',
            year: '10',
            subject: 'Mathematics',
            date: dateKey(day),
            time: '09:00',
            notes: 'Algebra',
            status: 'Scheduled',
            ...overrides,
        })

        const renderBooked = (
            handlers: Partial<{
                onEditClass: ReturnType<typeof vi.fn>
                onScheduleClass: ReturnType<typeof vi.fn>
                onSetSessionStatus: ReturnType<typeof vi.fn>
                onDeleteClass: ReturnType<typeof vi.fn>
            }>,
            session: ScheduledSession = bookedClass(),
            student: Student = buildStudent()
        ) =>
            render(
                <ClassSchedulingView
                    students={[student]}
                    sessions={[session]}
                    onScheduleClass={handlers.onScheduleClass ?? vi.fn()}
                    onEditClass={handlers.onEditClass ?? vi.fn()}
                    onSetSessionStatus={
                        handlers.onSetSessionStatus ?? vi.fn()
                    }
                    onDeleteClass={handlers.onDeleteClass ?? vi.fn()}
                />
            )

        it('deletes a class from the modal, behind a confirm', async () => {
            const user = userEvent.setup()
            const onDeleteClass = vi.fn()
            renderBooked({ onDeleteClass })

            await user.click(openDayCell(day))

            // Dismissing the confirm with Escape keeps the class.
            await user.click(
                await screen.findByRole('button', { name: /delete class/i })
            )
            expect(
                screen.getByRole('heading', { name: /delete this class\?/i })
            ).toBeInTheDocument()
            await user.keyboard('{Escape}')
            expect(onDeleteClass).not.toHaveBeenCalled()

            // Backing out with Keep also keeps it.
            await user.click(
                await screen.findByRole('button', { name: /delete class/i })
            )
            await user.click(screen.getByRole('button', { name: /^keep$/i }))
            expect(onDeleteClass).not.toHaveBeenCalled()

            // Confirming deletes it and closes the day modal.
            await user.click(
                await screen.findByRole('button', { name: /delete class/i })
            )
            await user.click(screen.getByRole('button', { name: /^delete$/i }))
            expect(onDeleteClass).toHaveBeenCalledWith(1)
        })

        it('deletes a whole group class with the everyone confirm', async () => {
            const user = userEvent.setup()
            const onDeleteClass = vi.fn()
            render(
                <ClassSchedulingView
                    students={[
                        buildStudent(),
                        buildStudent({
                            id: 2,
                            firstName: 'Maya',
                            lastName: 'Fernando',
                        }),
                    ]}
                    sessions={[
                        bookedClass({ id: 11, groupId: 'grp-1' }),
                        bookedClass({
                            id: 12,
                            studentId: 2,
                            studentName: 'Maya Fernando',
                            groupId: 'grp-1',
                        }),
                    ]}
                    onScheduleClass={vi.fn()}
                    onEditClass={vi.fn()}
                    onSetSessionStatus={vi.fn()}
                    onDeleteClass={onDeleteClass}
                />
            )

            await user.click(classChip(day, 1))
            await user.click(
                screen.getByRole('button', { name: /delete class/i })
            )
            expect(
                screen.getByRole('heading', {
                    name: /delete this class for everyone\?/i,
                })
            ).toBeInTheDocument()
            await user.click(screen.getByRole('button', { name: /^delete$/i }))
            // The lead row's id — the service deletes the whole group.
            expect(onDeleteClass).toHaveBeenCalledWith(11)
        })

        it('names a cancelled class whose student has left the active roster', async () => {
            const user = userEvent.setup()
            // The student isn't in the picker (archived → auto-cancelled), so
            // the field must fall back to the row's stored name, not blank.
            render(
                <ClassSchedulingView
                    students={[]}
                    sessions={[
                        bookedClass({
                            id: 5,
                            studentId: 99,
                            studentName: 'Sam Bailey',
                            year: '9',
                            status: 'Cancelled',
                        }),
                    ]}
                    onScheduleClass={vi.fn()}
                    onEditClass={vi.fn()}
                    onSetSessionStatus={vi.fn()}
                    onDeleteClass={vi.fn()}
                />
            )

            await user.click(classChip(day, 1))
            const dialog = await screen.findByRole('dialog')
            expect(
                within(dialog).getByText(/Sam Bailey/)
            ).toBeInTheDocument()
        })

        it('copies the open class to another date as a new booking', async () => {
            const user = userEvent.setup()
            const onScheduleClass = vi.fn()
            const onEditClass = vi.fn()
            renderBooked({ onScheduleClass, onEditClass })

            await user.click(openDayCell(day))
            const copyField = screen.getByLabelText(/copy to date/i)
            const copyButton = screen.getByRole('button', {
                name: /copy class/i,
            })
            // Nowhere to copy to yet; and the same day is not a copy.
            expect(copyButton).toBeDisabled()
            fireEvent.change(copyField, { target: { value: dateKey(day) } })
            expect(copyButton).toBeDisabled()

            const target = new Date(
                today.getFullYear(),
                today.getMonth(),
                day.getDate() + 7,
                12
            )
            fireEvent.change(copyField, { target: { value: dateKey(target) } })
            await user.click(copyButton)

            // A brand-new booking on the target date with the same details —
            // never an edit of the original.
            expect(onEditClass).not.toHaveBeenCalled()
            expect(onScheduleClass).toHaveBeenCalledWith({
                studentIds: [1],
                subject: 'Mathematics',
                date: dateKey(target),
                time: '09:00',
                durationMinutes: 60,
                notes: 'Algebra',
            })
            await waitFor(() =>
                expect(
                    screen.queryByRole('dialog')
                ).not.toBeInTheDocument()
            )
        })

        it('saves an edit to the open class via onEditClass', async () => {
            const user = userEvent.setup()
            const onEditClass = vi.fn()
            const onScheduleClass = vi.fn()
            // A class booked without notes: Save must still start disabled
            // (nothing changed) and the empty notes baseline is honoured. The
            // student teaches both subjects, so both are selectable here.
            renderBooked(
                { onEditClass, onScheduleClass },
                bookedClass({ notes: undefined }),
                buildStudent({ subjects: ['Mathematics', 'Physics'] })
            )

            await user.click(openDayCell(day))
            expect(
                screen.getByRole('heading', { name: /edit class/i })
            ).toBeInTheDocument()
            expect(
                screen.getByRole('button', { name: /save changes/i })
            ).toBeDisabled()

            // A second subject joins the first — the class covers both, and
            // the wire format is the joined string. Subject is limited to the
            // student's registered subjects, so Physics is picked from those.
            await user.click(screen.getByRole('combobox', { name: /subject/i }))
            await user.click(screen.getByRole('option', { name: 'Physics' }))
            await user.click(
                screen.getByRole('button', { name: /save changes/i })
            )

            // Edits the existing class, never creates a second one.
            expect(onScheduleClass).not.toHaveBeenCalled()
            expect(onEditClass).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    subject: 'Mathematics, Physics',
                    date: dateKey(day),
                    time: '09:00',
                }),
                false
            )
        })

        it('switches from editing to adding with the + chip', async () => {
            const user = userEvent.setup()
            const onEditClass = vi.fn()
            const onScheduleClass = vi.fn()
            renderBooked({ onEditClass, onScheduleClass })

            await user.click(openDayCell(day))
            // Prefilled in edit mode.
            expect(
                screen.getByRole('button', { name: 'Mathematics' })
            ).toBeInTheDocument()

            await user.click(screen.getByRole('tab', { name: /add a class/i }))
            // Now adding: blank form, and the heading and button say so.
            expect(
                screen.getByRole('heading', { name: /add a class/i })
            ).toBeInTheDocument()
            expect(
                screen.queryByRole('button', { name: 'Mathematics' })
            ).not.toBeInTheDocument()
            expect(screen.getByLabelText(/time/i)).toHaveValue('')

            await user.type(screen.getByLabelText(/students/i), 'Asha')
            await user.click(
                await screen.findByRole('option', { name: /asha/i })
            )
            // Pick the student's subject from the (now student-limited) list.
            await user.click(screen.getByRole('combobox', { name: /subject/i }))
            await user.click(screen.getByRole('option', { name: 'Mathematics' }))
            fireEvent.change(screen.getByLabelText(/time/i), {
                target: { value: '13:00' },
            })
            await user.click(screen.getByRole('button', { name: /add class/i }))

            // Adds a new class, does not edit the one that was open.
            expect(onEditClass).not.toHaveBeenCalled()
            expect(onScheduleClass).toHaveBeenCalledWith(
                expect.objectContaining({ time: '13:00', date: dateKey(day) })
            )
        })

        it('books a group class and runs its whole lifecycle', async () => {
            const user = userEvent.setup()
            const onEditClass = vi.fn()
            const onSetSessionStatus = vi.fn()
            const groupRows: ScheduledSession[] = [
                bookedClass({ id: 11, groupId: 'grp-1' }),
                bookedClass({
                    id: 12,
                    studentId: 2,
                    studentName: 'Maya Fernando',
                    groupId: 'grp-1',
                }),
            ]

            render(
                <ClassSchedulingView
                    students={[
                        buildStudent(),
                        buildStudent({
                            id: 2,
                            firstName: 'Maya',
                            lastName: 'Fernando',
                        }),
                    ]}
                    sessions={groupRows}
                    onScheduleClass={vi.fn()}
                    onEditClass={onEditClass}
                    onSetSessionStatus={onSetSessionStatus}
                />
            )

            // One chip for the group — labelled with its size — not two.
            const chip = classChip(day, 1)
            expect(chip).toHaveTextContent('×2')
            await user.click(chip)

            expect(
                screen.getByRole('heading', {
                    name: /edit group class \(2 students\)/i,
                })
            ).toBeInTheDocument()
            // Membership is editable now, and Save waits for an actual change.
            expect(screen.getByLabelText(/students/i)).toBeEnabled()
            expect(
                screen.getByRole('button', { name: /save changes/i })
            ).toBeDisabled()

            // Shared-field edits move the whole group.
            fireEvent.change(screen.getByLabelText(/time/i), {
                target: { value: '11:30' },
            })
            expect(
                screen.getByRole('button', { name: /save changes/i })
            ).toBeEnabled()
            await user.click(
                screen.getByRole('button', { name: /save changes/i })
            )
            expect(onEditClass).toHaveBeenCalledWith(
                11,
                expect.objectContaining({ time: '11:30' }),
                true
            )

            // Reopen and drop a member by removing their chip from the field;
            // Save cancels just that row.
            await waitFor(() =>
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
            )
            await user.click(classChip(day, 1))
            const studentsRoot = screen
                .getByLabelText(/students/i)
                .closest('.MuiAutocomplete-root') as HTMLElement
            // Chips are the active members in id order: [Asha, Maya].
            await user.click(
                within(studentsRoot).getAllByTestId('CancelIcon')[1]
            )
            await user.click(
                screen.getByRole('button', { name: /save changes/i })
            )
            expect(onSetSessionStatus).toHaveBeenCalledWith(12, 'Cancelled', false)

            // Cancel for everyone, behind its own confirmation. (findBy: the
            // closing confirm briefly aria-hides the day modal beneath it.)
            await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )
            await user.click(classChip(day, 1))
            await user.click(
                await screen.findByRole('button', {
                    name: /cancel for everyone/i,
                })
            )
            expect(
                screen.getByRole('heading', {
                    name: /cancel this class for everyone\?/i,
                })
            ).toBeInTheDocument()
            await user.click(screen.getByRole('button', { name: /^yes$/i }))
            expect(onSetSessionStatus).toHaveBeenCalledWith(
                11,
                'Cancelled',
                true
            )
        })

        it('adds a student to a group class from the day modal', async () => {
            const user = userEvent.setup()
            const onAddMember = vi.fn()
            const groupRows: ScheduledSession[] = [
                bookedClass({ id: 11, groupId: 'grp-1' }),
                bookedClass({
                    id: 12,
                    studentId: 2,
                    studentName: 'Maya Fernando',
                    groupId: 'grp-1',
                }),
            ]

            render(
                <ClassSchedulingView
                    students={[
                        buildStudent(),
                        buildStudent({
                            id: 2,
                            firstName: 'Maya',
                            lastName: 'Fernando',
                        }),
                        // On the roster but not in the class — the only one the
                        // Students field should offer to add.
                        buildStudent({
                            id: 3,
                            firstName: 'Rohan',
                            lastName: 'Silva',
                        }),
                    ]}
                    sessions={groupRows}
                    onScheduleClass={vi.fn()}
                    onEditClass={vi.fn()}
                    onSetSessionStatus={vi.fn()}
                    onAddMember={onAddMember}
                />
            )

            await user.click(classChip(day, 1))
            // Add the roster student straight in the Students field, then Save.
            await user.type(
                screen.getByRole('combobox', { name: /students/i }),
                'Rohan'
            )
            await user.click(
                await screen.findByRole('option', { name: /Rohan Silva/i })
            )
            await user.click(
                screen.getByRole('button', { name: /save changes/i })
            )

            // Save applies the membership diff: the joiner is added to the lead.
            expect(onAddMember).toHaveBeenCalledWith(11, 3)
        })

        it('re-adds an excused member, and restores everyone once all are cancelled', async () => {
            const user = userEvent.setup()
            const onSetSessionStatus = vi.fn()
            const onAddMember = vi.fn()
            const render2 = (rows: ScheduledSession[]) =>
                render(
                    <ClassSchedulingView
                        students={[
                            buildStudent(),
                            buildStudent({
                                id: 2,
                                firstName: 'Maya',
                                lastName: 'Fernando',
                            }),
                        ]}
                        sessions={rows}
                        onScheduleClass={vi.fn()}
                        onEditClass={vi.fn()}
                        onSetSessionStatus={onSetSessionStatus}
                        onAddMember={onAddMember}
                    />
                )

            // One member was excused: the field seeds with the active member
            // only, so re-adding the other brings them back (the API restores
            // their cancelled row).
            const { unmount } = render2([
                bookedClass({ id: 21, groupId: 'g' }),
                bookedClass({
                    id: 22,
                    studentId: 2,
                    studentName: 'Maya Fernando',
                    groupId: 'g',
                    status: 'Cancelled',
                }),
            ])
            await user.click(classChip(day, 1))
            await user.type(
                screen.getByRole('combobox', { name: /students/i }),
                'Maya'
            )
            await user.click(
                await screen.findByRole('option', { name: /Maya Fernando/i })
            )
            await user.click(
                screen.getByRole('button', { name: /save changes/i })
            )
            expect(onAddMember).toHaveBeenCalledWith(21, 2)
            unmount()

            // The whole class was cancelled: restore it for everyone.
            render2([
                bookedClass({ id: 31, groupId: 'g2', status: 'Cancelled' }),
                bookedClass({
                    id: 32,
                    studentId: 2,
                    studentName: 'Maya Fernando',
                    groupId: 'g2',
                    status: 'Cancelled',
                }),
            ])
            await user.click(classChip(day, 1))
            await user.click(
                screen.getByRole('button', { name: /restore for everyone/i })
            )
            expect(onSetSessionStatus).toHaveBeenCalledWith(
                31,
                'Scheduled',
                true
            )
        })

        it('tells a partially cancelled group apart on hover', async () => {
            const user = userEvent.setup()
            render(
                <ClassSchedulingView
                    students={[buildStudent()]}
                    sessions={[
                        bookedClass({ id: 41, groupId: 'g3' }),
                        bookedClass({
                            id: 42,
                            studentId: 2,
                            studentName: 'Maya Fernando',
                            groupId: 'g3',
                            status: 'Cancelled',
                        }),
                    ]}
                    onScheduleClass={vi.fn()}
                    onEditClass={vi.fn()}
                    onSetSessionStatus={vi.fn()}
                />
            )

            await user.hover(classChip(day, 1))
            expect(
                await screen.findByText(/1 of 2 cancelled/i)
            ).toBeInTheDocument()
            expect(
                screen.getByText(/group of 2 — asha perera, maya fernando/i)
            ).toBeInTheDocument()
        })

        it('backs out of a cancel with Escape, changing nothing', async () => {
            const user = userEvent.setup()
            const onSetSessionStatus = vi.fn()
            renderBooked({ onSetSessionStatus })

            await user.click(openDayCell(day))
            await user.click(
                screen.getByRole('button', { name: /cancel class/i })
            )
            expect(
                screen.getByRole('heading', { name: /cancel this class\?/i })
            ).toBeInTheDocument()

            await user.keyboard('{Escape}')
            // The confirm content unmounts with its target — instantly.
            expect(
                screen.queryByRole('heading', { name: /cancel this class\?/i })
            ).not.toBeInTheDocument()
            expect(onSetSessionStatus).not.toHaveBeenCalled()
        })

        it('restores a cancelled class without confirmation', async () => {
            const user = userEvent.setup()
            const onSetSessionStatus = vi.fn()
            renderBooked(
                { onSetSessionStatus },
                bookedClass({ status: 'Cancelled' })
            )

            await user.click(openDayCell(day))
            // A cancelled class offers Restore, not the red Cancel action.
            expect(
                screen.queryByRole('button', { name: /cancel class/i })
            ).not.toBeInTheDocument()

            await user.click(screen.getByRole('button', { name: /restore/i }))
            expect(onSetSessionStatus).toHaveBeenCalledWith(1, 'Scheduled')
        })
    })
})
