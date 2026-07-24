import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
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
    feeType: overrides.feeType,
    notes: overrides.notes ?? 'Excellent problem solving skills.',
    parentName: overrides.parentName ?? 'Nadia Patel',
    contactNumber: overrides.contactNumber ?? '+44 7700 900123',
    address: overrides.address ?? '12 Oak Road, Kingston upon Thames, KT2 6LP',
    isArchived: overrides.isArchived,
    archivedOn: overrides.archivedOn,
    archiveNotes: overrides.archiveNotes,
    datedNotes: overrides.datedNotes,
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
            students={[buildStudent()]}
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
            onOpenStudentPage={vi.fn()}
            onArchive={vi.fn()}
            onRestore={vi.fn()}
            onEditSession={vi.fn()}
            onCancelSession={vi.fn()}
            onAddMember={vi.fn()}
            onRemoveMember={vi.fn()}
            onUpdateNotes={vi.fn()}
            activeTab="details"
            onSelectTab={vi.fn()}
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
            screen.getByRole('button', { name: /^back$/i })
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

    it('blocks saving edits with required fields cleared, marking each (REQ-029)', async () => {
        const user = userEvent.setup()
        const onSaveDetails = vi.fn()
        renderView({
            editingStudentId: 10,
            // A draft with every required field blanked out.
            draftStudent: buildStudent({
                firstName: '',
                lastName: '',
                subjects: [],
                school: '',
                year: '',
            }),
            hasUnsavedChanges: true,
            onSaveDetails,
        })

        await user.click(screen.getByRole('button', { name: /^save$/i }))

        // The blank save is refused and each empty field names its problem.
        expect(onSaveDetails).not.toHaveBeenCalled()
        expect(
            screen.getByText('First name is required')
        ).toBeInTheDocument()
        expect(screen.getByText('Last name is required')).toBeInTheDocument()
        expect(
            screen.getByText('Pick at least one subject')
        ).toBeInTheDocument()
        expect(screen.getByText('School is required')).toBeInTheDocument()
        expect(screen.getByText('Year is required')).toBeInTheDocument()
    })

    it('shows the monthly fee basis and edits the fee type', async () => {
        const user = userEvent.setup()
        const onDraftChange = vi.fn()
        const { container } = renderView({
            editingStudentId: 10,
            draftStudent: buildStudent({ feeType: 'monthly', fees: 400 }),
            hasUnsavedChanges: true,
            onDraftChange,
        })

        // A monthly student's fee reads per month, and the amount field is
        // labelled to match.
        expect(container.querySelector('.fees-pill')?.textContent).toMatch(
            /£400\s*\/month/
        )
        expect(screen.getByLabelText(/monthly fee/i)).toBeInTheDocument()

        // Switching the basis emits the draft change.
        await user.click(screen.getByRole('combobox', { name: /fee type/i }))
        await user.click(screen.getByRole('option', { name: 'Per session' }))
        expect(onDraftChange).toHaveBeenCalledWith('feeType', 'per-session')
    })

    it('reads "No fee" and hides the amount for a no-fee student', () => {
        const { container } = renderView({
            editingStudentId: 10,
            draftStudent: buildStudent({ feeType: 'none' }),
        })

        expect(container.querySelector('.fees-pill')?.textContent).toBe(
            'Fees: No fee'
        )
        // No amount field for a student who isn't billed.
        expect(
            screen.queryByLabelText(/fee per session|monthly fee/i)
        ).not.toBeInTheDocument()
    })

    it('links group classmates to their pages, sorted, and marks solo 1:1', async () => {
        const user = userEvent.setup()
        const onOpenStudentPage = vi.fn()
        const maya = buildStudent({
            id: 2,
            firstName: 'Maya',
            lastName: 'Fernando',
        })
        const ben = buildStudent({ id: 3, firstName: 'Ben', lastName: 'Adams' })
        renderView({
            onOpenStudentPage,
            students: [buildStudent(), maya, ben],
            scheduledSessions: [
                // A solo class for our student.
                buildSession(1, 4, { time: '09:00' }),
                // A group class: our student (id 10) plus Maya and Ben.
                buildSession(2, 4, { groupId: 'grp-1', time: '11:00' }),
                {
                    ...buildSession(3, 4, { groupId: 'grp-1', time: '11:00' }),
                    studentId: 2,
                    studentName: 'Stale Copy',
                },
                {
                    ...buildSession(4, 4, { groupId: 'grp-1', time: '11:00' }),
                    studentId: 3,
                },
            ],
        })

        // Both classmates are links, resolved live and sorted (Ben < Maya) —
        // not the stale session copy.
        const ada = screen.getByRole('link', { name: 'Ben Adams' })
        const may = screen.getByRole('link', { name: 'Maya Fernando' })
        expect(ada.compareDocumentPosition(may)).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING
        )
        expect(screen.queryByText(/Stale Copy/)).not.toBeInTheDocument()

        // Clicking a classmate opens their page.
        await user.click(may)
        expect(onOpenStudentPage).toHaveBeenCalledWith(2)

        // The solo row reads 1:1.
        expect(screen.getAllByText('1:1').length).toBeGreaterThan(0)
    })

    it('falls back to 1:1 when every group classmate has cancelled', () => {
        renderView({
            students: [buildStudent()],
            scheduledSessions: [
                buildSession(2, 4, { groupId: 'grp-9', time: '11:00' }),
                {
                    ...buildSession(3, 4, { groupId: 'grp-9', time: '11:00' }),
                    studentId: 2,
                    status: 'Cancelled' as const,
                },
            ],
        })
        // The only classmate cancelled, so the class is effectively 1:1.
        expect(screen.getByText('1:1')).toBeInTheDocument()
    })

    it('names an orphaned classmate from the session when off-roster', () => {
        renderView({
            students: [buildStudent()], // classmate id 2 not in the roster
            scheduledSessions: [
                buildSession(2, 4, { groupId: 'grp-2', time: '11:00' }),
                {
                    ...buildSession(3, 4, { groupId: 'grp-2', time: '11:00' }),
                    studentId: 2,
                    studentName: 'Ghost Mate',
                },
            ],
        })
        expect(screen.getByText('Ghost Mate')).toBeInTheDocument()
    })

    it('edits an upcoming session in place on the student page', async () => {
        const user = userEvent.setup()
        const onEditSession = vi.fn()
        const session = buildSession(1, 3)
        renderView({ onEditSession, scheduledSessions: [session] })

        await user.click(
            screen.getByRole('button', { name: /edit mathematics on/i })
        )
        // The edit form opens on the page — no navigation away. Every field
        // is editable.
        const dialog = screen.getByRole('dialog')
        const subject = within(dialog).getByLabelText(/subject/i)
        await user.clear(subject)
        await user.type(subject, 'Physics')
        fireEvent.change(within(dialog).getByLabelText(/time/i), {
            target: { value: '17:30' },
        })
        await user.click(within(dialog).getByLabelText(/duration/i))
        await user.click(
            await screen.findByRole('option', { name: /1\.5 hours/i })
        )
        await user.type(within(dialog).getByLabelText(/notes/i), ' extra')

        await user.click(
            within(dialog).getByRole('button', { name: /save changes/i })
        )
        expect(onEditSession).toHaveBeenCalledWith(
            1,
            {
                subject: 'Physics',
                time: '17:30',
                durationMinutes: 90,
                notes: 'Problem solving practice extra',
            },
            false
        )
    })

    it('applies a group class edit to everyone', async () => {
        const user = userEvent.setup()
        const onEditSession = vi.fn()
        renderView({
            onEditSession,
            scheduledSessions: [buildSession(1, 3, { groupId: 'grp-1' })],
        })

        await user.click(
            screen.getByRole('button', { name: /edit mathematics on/i })
        )
        const dialog = screen.getByRole('dialog')
        expect(
            within(dialog).getByText(/applies to everyone/i)
        ).toBeInTheDocument()
        await user.click(
            within(dialog).getByRole('button', { name: /save changes/i })
        )
        expect(onEditSession).toHaveBeenCalledWith(
            1,
            expect.any(Object),
            true // applyToGroup
        )
    })

    it('adds a student to the class from the edit dialog', async () => {
        const user = userEvent.setup()
        const onAddMember = vi.fn()
        renderView({
            onAddMember,
            // Two students on the roster; only the joiner (id 20) is addable —
            // id 10 is already the class member.
            students: [
                buildStudent(),
                buildStudent({ id: 20, firstName: 'Ben', lastName: 'Kaur' }),
            ],
            scheduledSessions: [buildSession(1, 3)],
        })

        await user.click(
            screen.getByRole('button', { name: /edit mathematics on/i })
        )
        const dialog = screen.getByRole('dialog')
        await user.click(within(dialog).getByLabelText(/add a student/i))
        await user.click(await screen.findByRole('option', { name: 'Ben Kaur' }))

        expect(onAddMember).toHaveBeenCalledWith(1, 20)
    })

    it('removes a member from a group class, but never the last one', async () => {
        const user = userEvent.setup()
        const onRemoveMember = vi.fn()
        renderView({
            onRemoveMember,
            scheduledSessions: [
                buildSession(1, 3, {
                    groupId: 'grp-1',
                    studentName: 'Asha Perera',
                }),
                buildSession(2, 3, {
                    groupId: 'grp-1',
                    studentId: 20,
                    studentName: 'Ben Kaur',
                }),
            ],
        })

        await user.click(
            screen.getByRole('button', { name: /edit mathematics on/i })
        )
        const dialog = screen.getByRole('dialog')
        // Two chips, each removable while more than one member remains.
        const deletes = within(dialog).getAllByTestId('CancelIcon')
        expect(deletes).toHaveLength(2)
        await user.click(deletes[1])

        expect(onRemoveMember).toHaveBeenCalledWith(2)
    })

    it('cannot remove the sole member of a solo class', async () => {
        renderView({ scheduledSessions: [buildSession(1, 3)] })

        fireEvent.click(
            screen.getByRole('button', { name: /edit mathematics on/i })
        )
        const dialog = screen.getByRole('dialog')
        // The one attendee's chip has no delete affordance.
        expect(within(dialog).queryByTestId('CancelIcon')).toBeNull()
    })

    it('dismisses the edit dialog without saving', async () => {
        const user = userEvent.setup()
        const onEditSession = vi.fn()
        renderView({ onEditSession, scheduledSessions: [buildSession(1, 3)] })

        const editBtn = screen.getByRole('button', {
            name: /edit mathematics on/i,
        })
        // Dismiss via Escape (the dialog's onClose)…
        await user.click(editBtn)
        await user.keyboard('{Escape}')
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )
        // …and via the Cancel button.
        await user.click(editBtn)
        await user.click(screen.getByRole('button', { name: /^cancel$/i }))
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )
        expect(onEditSession).not.toHaveBeenCalled()
    })

    it('removes an upcoming session behind a confirm', async () => {
        const user = userEvent.setup()
        const onCancelSession = vi.fn()
        const session = buildSession(1, 3)
        renderView({ onCancelSession, scheduledSessions: [session] })

        await user.click(
            screen.getByRole('button', { name: /remove mathematics on/i })
        )
        // Confirms before cancelling.
        expect(
            screen.getByRole('heading', { name: /remove this class\?/i })
        ).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /^remove$/i }))
        expect(onCancelSession).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1 })
        )
    })

    it('keeps the session when the remove dialog is dismissed', async () => {
        const user = userEvent.setup()
        const onCancelSession = vi.fn()
        renderView({ onCancelSession, scheduledSessions: [buildSession(1, 3)] })

        const removeBtn = screen.getByRole('button', {
            name: /remove mathematics on/i,
        })
        // Dismiss via the Keep button…
        await user.click(removeBtn)
        await user.click(screen.getByRole('button', { name: /^keep$/i }))
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )
        // …and via Escape (the dialog's own onClose).
        await user.click(removeBtn)
        await user.keyboard('{Escape}')
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )
        expect(onCancelSession).not.toHaveBeenCalled()
    })

    it('only offers Archive while editing the student', () => {
        // Not editing → the header Archive button is disabled.
        renderView({ scheduledSessions: [] })
        expect(
            screen.getByRole('button', { name: /^archive$/i })
        ).toBeDisabled()
    })

    it('archives a student behind a required closing note', async () => {
        const user = userEvent.setup()
        const onArchive = vi.fn()
        // Archiving is offered while editing (no future classes here).
        renderView({
            onArchive,
            scheduledSessions: [],
            editingStudentId: 10,
            draftStudent: buildStudent(),
        })

        await user.click(screen.getByRole('button', { name: /^archive$/i }))
        const dialog = screen.getByRole('dialog')
        // The Archive action is disabled until a note is written.
        const confirm = within(dialog).getByRole('button', {
            name: /^archive$/i,
        })
        expect(confirm).toBeDisabled()

        await user.type(
            within(dialog).getByLabelText(/closing note/i),
            'Finished GCSEs — great progress'
        )
        expect(confirm).toBeEnabled()
        await user.click(confirm)
        expect(onArchive).toHaveBeenCalledWith(
            10,
            'Finished GCSEs — great progress'
        )
    })

    it('warns that upcoming classes will be cancelled on archive', async () => {
        const user = userEvent.setup()
        renderView({
            scheduledSessions: [buildSession(1, 5)], // one future class
            editingStudentId: 10,
            draftStudent: buildStudent(),
        })
        // Archiving cancels the class rather than blocking.
        const archive = screen.getByRole('button', { name: /^archive$/i })
        expect(archive).toBeEnabled()

        await user.click(archive)
        expect(
            screen.getByText(/1 upcoming class/i)
        ).toBeInTheDocument()
        expect(screen.getByText(/will be cancelled/i)).toBeInTheDocument()
    })

    it('closes the archive dialog on cancel without archiving', async () => {
        const user = userEvent.setup()
        const onArchive = vi.fn()
        renderView({
            onArchive,
            scheduledSessions: [],
            editingStudentId: 10,
            draftStudent: buildStudent(),
        })

        // Close via the dialog's Cancel button…
        await user.click(screen.getByRole('button', { name: /^archive$/i }))
        await user.click(
            within(screen.getByRole('dialog')).getByRole('button', {
                name: /^cancel$/i,
            })
        )
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )

        // …and via Escape (the dialog's own onClose).
        await user.click(screen.getByRole('button', { name: /^archive$/i }))
        await user.keyboard('{Escape}')
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        )
        expect(onArchive).not.toHaveBeenCalled()
    })

    it('shows a bare archived banner when there is no date or note', () => {
        renderView({
            student: buildStudent({ isArchived: true }),
        })
        expect(screen.getByText(/archived/i)).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /restore to active/i })
        ).toBeInTheDocument()
    })

    it('shows the archived banner and restores an alumnus', async () => {
        const user = userEvent.setup()
        const onRestore = vi.fn()
        renderView({
            onRestore,
            student: buildStudent({
                isArchived: true,
                archivedOn: '2026-07-19',
                archiveNotes: 'Moved abroad',
            }),
        })

        // Archived students show a banner, not an Archive button.
        expect(screen.getByText(/archived/i)).toBeInTheDocument()
        expect(screen.getByText('Moved abroad')).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: /^archive$/i })
        ).not.toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /restore to active/i })
        )
        expect(onRestore).toHaveBeenCalledWith(10)
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

        // The label now carries a required * (REQ-029), so match its start.
        await user.click(screen.getByLabelText(/^year\b/i))
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
        expect(screen.getByText(/no classes scheduled yet/i)).toBeInTheDocument()
    })

    it('shows Details by default, with the diary behind its own tab', async () => {
        const user = userEvent.setup()
        const onSelectTab = vi.fn()
        renderView({
            student: buildStudent({
                datedNotes: [{ id: 1, date: '2026-07-04', text: 'Great progress' }],
            }),
            onSelectTab,
        })

        // Details tab is active: profile fields show; the diary heading does not.
        expect(
            screen.getByRole('tab', { name: /details/i })
        ).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
        expect(
            screen.queryByRole('heading', { name: /^diary$/i })
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('tab', { name: /diary/i }))
        expect(onSelectTab).toHaveBeenCalledWith('diary')
    })

    it('shows the diary, not the profile fields, on the Diary tab', async () => {
        const user = userEvent.setup()
        const onSelectTab = vi.fn()
        renderView({
            activeTab: 'diary',
            student: buildStudent({
                datedNotes: [{ id: 1, date: '2026-07-04', text: 'Great progress' }],
            }),
            onSelectTab,
        })

        expect(
            screen.getByRole('tab', { name: /diary/i })
        ).toHaveAttribute('aria-selected', 'true')
        expect(
            screen.getByRole('heading', { name: /^diary$/i })
        ).toBeInTheDocument()
        expect(screen.getByText('Great progress')).toBeInTheDocument()
        // Profile fields are hidden while the diary is open.
        expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument()

        await user.click(screen.getByRole('tab', { name: /details/i }))
        expect(onSelectTab).toHaveBeenCalledWith('details')
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
