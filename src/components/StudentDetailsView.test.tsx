import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ScheduledSession, Student } from '../data/students'
import { parseSubjects, StudentDetailsView } from './StudentDetailsView'

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
    fees: overrides.fees ?? 120,
    notes: overrides.notes ?? 'Excellent problem solving skills.',
    parentName: overrides.parentName ?? 'Nadia Patel',
    contactNumber: overrides.contactNumber ?? '+44 7700 900123',
    address: overrides.address ?? '12 Oak Road, Kingston upon Thames, KT2 6LP',
})

const scheduledSessions: ScheduledSession[] = [
    {
        id: 1,
        studentId: 10,
        studentName: 'Asha Perera',
        year: '10',
        subject: 'Mathematics',
        date: '2026-07-11',
        time: '16:00',
        notes: 'Problem solving practice',
    },
]

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
        expect(screen.getByLabelText(/monthly fees/i)).toBeDisabled()
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
        expect(screen.getByLabelText(/monthly fees/i)).toHaveValue(150)
        expect(screen.getByText('Fees: £150/month')).toBeInTheDocument()
        expect(screen.getByText('60%')).toBeInTheDocument()

        await user.type(screen.getByLabelText(/last name/i), 'x')
        expect(onDraftChange).toHaveBeenCalledWith(
            'lastName',
            expect.any(String)
        )

        await user.clear(screen.getByLabelText(/monthly fees/i))
        await user.type(screen.getByLabelText(/monthly fees/i), '9')
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

        await user.click(screen.getByLabelText(/^mode$/i))
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

describe('parseSubjects', () => {
    it('passes an array through untouched', () => {
        expect(parseSubjects(['Maths', 'Physics'])).toEqual([
            'Maths',
            'Physics',
        ])
    })

    it('splits the comma-joined string an autofill can produce', () => {
        expect(parseSubjects('Maths,Physics')).toEqual(['Maths', 'Physics'])
    })
})
