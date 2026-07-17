import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ScheduledSession, Student } from '../data/students'
import { StudentDetailsView } from './StudentDetailsView'

const buildStudent = (overrides: Partial<Student> = {}): Student => ({
    id: overrides.id ?? 10,
    studentId: overrides.studentId ?? 'STU-100010',
    firstName: overrides.firstName ?? 'Asha',
    lastName: overrides.lastName ?? 'Perera',
    dob: overrides.dob ?? '2011-05-14',
    subjects: overrides.subjects ?? ['Mathematics', 'Physics'],
    school: overrides.school ?? 'Kingston Grammar School',
    year: overrides.year ?? '10',
    progress: overrides.progress ?? 88,
    mode: overrides.mode ?? 'Face to Face',
    progressBySubject: overrides.progressBySubject,
    fees: overrides.fees ?? 120,
    notes: overrides.notes ?? 'Excellent problem solving skills.',
    parentName: overrides.parentName ?? 'Nadia Patel',
    contactNumber: overrides.contactNumber ?? '+44 7700 900123',
    address: overrides.address ?? '12 Oak Road, Kingston upon Thames, KT2 6LP',
})

/** A future YYYY-MM-DD, `days` from now — "upcoming" must not rot with time. */
const futureDate = (days: number): string => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const buildSession = (
    id: number,
    days: number,
    overrides: Partial<ScheduledSession> = {}
): ScheduledSession => ({
    id,
    studentId: 10,
    studentName: 'Asha Perera',
    year: '10',
    subject: 'Mathematics',
    date: futureDate(days),
    time: '16:00',
    durationMinutes: 60,
    notes: 'Problem solving practice',
    status: 'Scheduled',
    ...overrides,
})

const scheduledSessions: ScheduledSession[] = [buildSession(1, 2)]

const renderView = (props: Partial<
    React.ComponentProps<typeof StudentDetailsView>
> = {}) =>
    render(
        <StudentDetailsView
            student={buildStudent()}
            scheduledSessions={scheduledSessions}
            editingStudentId={null}
            draftStudent={null}
            hasUnsavedChanges={false}
            saving={false}
            onBack={vi.fn()}
            onBeginEdit={vi.fn()}
            onDraftChange={vi.fn()}
            onSaveDetails={vi.fn()}
            onCancelEdit={vi.fn()}
            {...props}
        />
    )

describe('StudentDetailsView', () => {
    it('shows the stored student and locks every field until Edit', async () => {
        const user = userEvent.setup()
        const onBack = vi.fn()
        const onBeginEdit = vi.fn()

        renderView({ onBack, onBeginEdit })

        expect(
            screen.getByRole('heading', { name: /asha perera/i })
        ).toBeInTheDocument()
        expect(
            screen.getByText(
                (_, element) =>
                    element?.textContent === 'Subjects: Mathematics, Physics'
            )
        ).toBeInTheDocument()

        // Read-only until Edit: the identifiers are never offered at all.
        expect(screen.getByLabelText(/first name/i)).toBeDisabled()
        expect(screen.getByLabelText(/fee per session/i)).toBeDisabled()
        expect(screen.getByRole('slider', { name: /progress/i })).toBeDisabled()
        expect(screen.queryByLabelText(/student id/i)).not.toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /back to students/i })
        )
        expect(onBack).toHaveBeenCalledTimes(1)

        await user.click(screen.getByRole('button', { name: /^edit$/i }))
        expect(onBeginEdit).toHaveBeenCalledWith(
            expect.objectContaining({ id: 10 })
        )
    })

    it('edits every field from the draft and saves once', async () => {
        const user = userEvent.setup()
        const onDraftChange = vi.fn()
        const onSaveDetails = vi.fn()
        const onCancelEdit = vi.fn()

        renderView({
            editingStudentId: 10,
            draftStudent: buildStudent({
                firstName: 'Drafted',
                fees: 150,
                progress: 60,
            }),
            hasUnsavedChanges: true,
            onDraftChange,
            onSaveDetails,
            onCancelEdit,
        })

        // The draft, not the stored student, is what's on screen.
        expect(screen.getByLabelText(/first name/i)).toHaveValue('Drafted')
        expect(screen.getByLabelText(/fee per session/i)).toHaveValue(150)
        expect(screen.getByText('Fees: £150/session')).toBeInTheDocument()
        expect(screen.getByText('60%')).toBeInTheDocument()

        await user.type(screen.getByLabelText(/last name/i), 'x')
        expect(onDraftChange).toHaveBeenCalledWith(
            'lastName',
            expect.any(String)
        )

        await user.clear(screen.getByLabelText(/fee per session/i))
        await user.type(screen.getByLabelText(/fee per session/i), '9')
        expect(onDraftChange).toHaveBeenCalledWith('fees', expect.any(Number))

        fireEvent.change(screen.getByRole('slider', { name: /progress/i }), {
            target: { value: '92' },
        })
        expect(onDraftChange).toHaveBeenCalledWith('progress', 92)

        await user.type(screen.getByLabelText(/school/i), 'y')
        await user.type(screen.getByLabelText(/parent name/i), 'x')
        await user.type(screen.getByLabelText(/contact number/i), '1')
        await user.type(screen.getByLabelText(/address/i), 'x')
        await user.type(screen.getByLabelText(/notes/i), 'x')
        await user.type(screen.getByLabelText(/first name/i), 'z')
        fireEvent.change(screen.getByLabelText(/date of birth/i), {
            target: { value: '2012-01-01' },
        })
        expect(onDraftChange).toHaveBeenCalledWith('dob', '2012-01-01')

        await user.click(screen.getByRole('button', { name: /^save$/i }))
        expect(onSaveDetails).toHaveBeenCalledTimes(1)

        await user.click(screen.getByRole('button', { name: /cancel/i }))
        expect(onCancelEdit).toHaveBeenCalledTimes(1)
    })

    it('shows a bar per subject and derives the overall figure', () => {
        renderView({
            student: buildStudent({
                subjects: ['Mathematics', 'Physics', 'Chemistry'],
                progressBySubject: { Mathematics: 90, Physics: 70 },
            }),
        })

        // Overall = rounded average of the map (80), not the stored figure.
        // (Selector-scoped: Chemistry's fallback bar also reads 80%.)
        expect(
            screen.getByText('80%', { selector: '.progress-value' })
        ).toBeInTheDocument()

        const maths = screen.getByRole('progressbar', {
            name: /mathematics progress/i,
        })
        expect(maths).toHaveAttribute('aria-valuenow', '90')
        expect(
            screen.getByRole('progressbar', { name: /physics progress/i })
        ).toHaveAttribute('aria-valuenow', '70')
        // A subject missing from the map falls back to the overall.
        expect(
            screen.getByRole('progressbar', { name: /chemistry progress/i })
        ).toHaveAttribute('aria-valuenow', '80')
        // The single blended slider belongs to map-less records only.
        expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    })

    it('edits each subject through its own slider', () => {
        const onDraftChange = vi.fn()
        const withMap = buildStudent({
            progressBySubject: { Mathematics: 90, Physics: 70 },
        })
        renderView({
            student: withMap,
            editingStudentId: 10,
            draftStudent: withMap,
            hasUnsavedChanges: true,
            onDraftChange,
        })

        fireEvent.change(
            screen.getByRole('slider', { name: /mathematics progress/i }),
            { target: { value: '95' } }
        )
        expect(onDraftChange).toHaveBeenCalledWith('progressBySubject', {
            Mathematics: 95,
            Physics: 70,
        })
    })

    it('adopts per-subject tracking from the single blended slider', async () => {
        const user = userEvent.setup()
        const onDraftChange = vi.fn()
        renderView({
            editingStudentId: 10,
            draftStudent: buildStudent(),
            hasUnsavedChanges: false,
            onDraftChange,
        })

        await user.click(
            screen.getByRole('button', { name: /track per subject/i })
        )
        // Each subject seeds at the current blended figure.
        expect(onDraftChange).toHaveBeenCalledWith('progressBySubject', {
            Mathematics: 88,
            Physics: 88,
        })
    })

    it('offers no per-subject opt-in when the student has no subjects', () => {
        renderView({
            editingStudentId: 10,
            draftStudent: buildStudent({ subjects: [] }),
            hasUnsavedChanges: false,
        })
        expect(
            screen.queryByRole('button', { name: /track per subject/i })
        ).not.toBeInTheDocument()
    })

    it('keeps the progress map in step with subject changes', async () => {
        const user = userEvent.setup()
        const onDraftChange = vi.fn()
        const withMap = buildStudent({
            progressBySubject: { Mathematics: 90, Physics: 70 },
        })
        renderView({
            student: withMap,
            editingStudentId: 10,
            draftStudent: withMap,
            hasUnsavedChanges: true,
            onDraftChange,
        })

        // Removing a subject drops its entry.
        const picker = screen.getByRole('combobox', { name: /subjects/i })
        const chip = within(picker)
            .getByText('Physics')
            .closest('.MuiChip-root') as HTMLElement
        await user.click(within(chip).getByTestId('CancelIcon'))
        expect(onDraftChange).toHaveBeenCalledWith('subjects', ['Mathematics'])
        expect(onDraftChange).toHaveBeenCalledWith('progressBySubject', {
            Mathematics: 90,
        })

        // Adding one seeds it at the current overall (80).
        await user.click(picker)
        await user.click(screen.getByRole('option', { name: 'Chemistry' }))
        expect(onDraftChange).toHaveBeenCalledWith('progressBySubject', {
            Mathematics: 90,
            Physics: 70,
            Chemistry: 80,
        })
    })

    it('removes a subject via its chip ✕ or its menu option', async () => {
        const user = userEvent.setup()
        const onDraftChange = vi.fn()

        renderView({
            editingStudentId: 10,
            draftStudent: buildStudent(),
            hasUnsavedChanges: true,
            onDraftChange,
        })

        // The chip's ✕ removes just that subject, without opening the menu.
        // (Scoped to the picker: the sessions table says Mathematics too.)
        const picker = screen.getByRole('combobox', { name: /subjects/i })
        const chip = within(picker)
            .getByText('Mathematics')
            .closest('.MuiChip-root') as HTMLElement
        await user.click(within(chip).getByTestId('CancelIcon'))
        expect(onDraftChange).toHaveBeenCalledWith('subjects', ['Physics'])
        expect(
            screen.queryByRole('option', { name: 'Physics' })
        ).not.toBeInTheDocument()

        // Clicking an already-selected menu option also deselects it.
        await user.click(screen.getByRole('combobox', { name: /subjects/i }))
        await user.click(screen.getByRole('option', { name: 'Physics' }))
        expect(onDraftChange).toHaveBeenCalledWith('subjects', ['Mathematics'])
    })

    it('changes subjects, year and mode from their pickers', async () => {
        const user = userEvent.setup()
        const onDraftChange = vi.fn()

        renderView({
            editingStudentId: 10,
            draftStudent: buildStudent(),
            hasUnsavedChanges: true,
            onDraftChange,
        })

        await user.click(screen.getByRole('combobox', { name: /subjects/i }))
        await user.click(screen.getByRole('option', { name: 'Chemistry' }))
        expect(onDraftChange).toHaveBeenCalledWith(
            'subjects',
            expect.arrayContaining(['Chemistry'])
        )
        await user.keyboard('{Escape}')

        await user.click(screen.getByLabelText(/^year$/i))
        await user.click(screen.getByRole('option', { name: '11' }))
        expect(onDraftChange).toHaveBeenCalledWith('year', '11')

        await user.click(screen.getByLabelText(/study mode/i))
        await user.click(screen.getByRole('option', { name: 'Online' }))
        expect(onDraftChange).toHaveBeenCalledWith('mode', 'Online')
    })

    it('falls back gracefully when a student has nothing filled in', () => {
        renderView({
            student: buildStudent({
                dob: '',
                parentName: '',
                contactNumber: '',
                address: '',
                notes: '',
                year: '',
                school: '',
                subjects: [],
            }),
            scheduledSessions: [],
        })

        expect(screen.getByText(/year unassigned/i)).toBeInTheDocument()
        expect(
            screen.getByText(
                (_, element) =>
                    element?.textContent === 'Date of birth: Not provided'
            )
        ).toBeInTheDocument()
        expect(
            screen.getByText(
                (_, element) => element?.textContent === 'Subjects: None selected'
            )
        ).toBeInTheDocument()
        expect(
            screen.getByText(
                (_, element) => element?.textContent === 'School: Not provided'
            )
        ).toBeInTheDocument()
        expect(
            screen.getByText(/no notes added yet/i)
        ).toBeInTheDocument()
        expect(screen.getByText(/no classes scheduled yet/i)).toBeInTheDocument()
    })

    it('caps upcoming sessions at three, expandable to the full list', async () => {
        const user = userEvent.setup()
        renderView({
            scheduledSessions: [
                buildSession(1, 1),
                buildSession(2, 2, { durationMinutes: 90 }),
                buildSession(3, 3),
                buildSession(4, 4),
                // Cancelled and past classes are not "upcoming".
                buildSession(5, 5, { status: 'Cancelled' }),
                buildSession(6, -7),
                buildSession(7, 6),
            ],
        })

        // 5 upcoming (1,2,3,4,7) -> only the first three table rows show
        // (one extra row is the Date/Time/Subject header).
        const bodyRowCount = () => screen.getAllByRole('row').length - 1
        expect(bodyRowCount()).toBe(3)
        // Duration reads like a teacher says it, tucked under the time.
        expect(screen.getByText('1.5 hours')).toBeInTheDocument()
        expect(
            screen.getByRole('columnheader', { name: /subject/i })
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /show all 5/i }))
        expect(bodyRowCount()).toBe(5)

        await user.click(screen.getByRole('button', { name: /show fewer/i }))
        expect(bodyRowCount()).toBe(3)
    })

    it('omits the duration for classes booked before durations existed', () => {
        // The API guarantees the field going forward; a record from the old
        // contract may lack it, and must not render as "NaN hours".
        const legacy = buildSession(1, 2)
        delete (legacy as Partial<ScheduledSession>).durationMinutes
        renderView({ scheduledSessions: [legacy] })

        // Header row + the one class.
        expect(screen.getAllByRole('row')).toHaveLength(2)
        const [, row] = screen.getAllByRole('row')
        expect(row.textContent).toContain('16:00')
        expect(row.textContent).toContain('Mathematics')
        expect(row.textContent).not.toMatch(/NaN|hour/)
    })

    it('blocks a second submit while the first is still saving', () => {
        renderView({
            editingStudentId: 10,
            draftStudent: buildStudent(),
            hasUnsavedChanges: true,
            saving: true,
        })

        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    })

    it('keeps Save disabled until something actually changes', () => {
        renderView({
            editingStudentId: 10,
            draftStudent: buildStudent(),
            hasUnsavedChanges: false,
        })

        expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled()
    })
})
