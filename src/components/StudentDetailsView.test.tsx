import { fireEvent, render, screen } from '@testing-library/react'
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

describe('StudentDetailsView', () => {
    it('renders details and triggers back/edit/progress callbacks', async () => {
        const user = userEvent.setup()
        const onBack = vi.fn()
        const onBeginEdit = vi.fn()
        const onProgressChange = vi.fn()

        render(
            <StudentDetailsView
                student={buildStudent()}
                scheduledSessions={scheduledSessions}
                editingStudentId={null}
                draftStudent={null}
                hasUnsavedChanges={false}
                onBack={onBack}
                onBeginEdit={onBeginEdit}
                onDraftChange={vi.fn()}
                onSaveDetails={vi.fn()}
                onCancelEdit={vi.fn()}
                onProgressChange={onProgressChange}
            />
        )

        expect(
            screen.getByRole('heading', { name: /asha perera/i })
        ).toBeInTheDocument()
        expect(
            screen.getByText(
                (_, element) =>
                    element?.textContent === 'Subjects: Mathematics, Physics'
            )
        ).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /back to students/i })
        )
        expect(onBack).toHaveBeenCalledTimes(1)

        await user.click(screen.getByRole('button', { name: /^edit$/i }))
        expect(onBeginEdit).toHaveBeenCalledWith(
            expect.objectContaining({ id: 10 })
        )

        fireEvent.change(screen.getByRole('slider', { name: /progress/i }), {
            target: { value: '92' },
        })
        expect(onProgressChange).toHaveBeenCalledWith(10, 92)
    })

    it('renders editing state with fallbacks and save/cancel callbacks', async () => {
        const user = userEvent.setup()
        const onDraftChange = vi.fn()
        const onSaveDetails = vi.fn()
        const onCancelEdit = vi.fn()

        render(
            <StudentDetailsView
                student={buildStudent({
                    dob: '',
                    parentName: '',
                    contactNumber: '',
                    address: '',
                    notes: '',
                    year: '',
                })}
                scheduledSessions={[]}
                editingStudentId={10}
                draftStudent={{
                    parentName: 'Updated Parent',
                    contactNumber: '0700000000',
                    address: 'Updated Address',
                    notes: 'Updated Note',
                }}
                hasUnsavedChanges
                onBack={vi.fn()}
                onBeginEdit={vi.fn()}
                onDraftChange={onDraftChange}
                onSaveDetails={onSaveDetails}
                onCancelEdit={onCancelEdit}
                onProgressChange={vi.fn()}
            />
        )

        expect(screen.getByText(/year unassigned/i)).toBeInTheDocument()
        expect(
            screen.getByText(
                (_, element) =>
                    element?.textContent === 'Date of birth: Not provided'
            )
        ).toBeInTheDocument()

        await user.type(screen.getByLabelText(/parent name/i), 'x')
        await user.type(screen.getByLabelText(/contact number/i), '1')
        await user.type(screen.getByLabelText(/address/i), 'x')
        await user.type(screen.getByLabelText(/notes/i), 'x')
        expect(onDraftChange).toHaveBeenCalled()

        await user.click(screen.getByRole('button', { name: /^save$/i }))
        expect(onSaveDetails).toHaveBeenCalledWith(10)

        await user.click(screen.getByRole('button', { name: /cancel/i }))
        expect(onCancelEdit).toHaveBeenCalledTimes(1)
    })
})
