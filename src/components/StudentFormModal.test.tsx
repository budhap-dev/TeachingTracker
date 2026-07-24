import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StudentFormModal } from './StudentFormModal'
import type { Student } from '../data/students'

const emptyForm: Omit<Student, 'id'> = {
    studentId: '',
    firstName: '',
    lastName: '',
    dob: '',
    subjects: [],
    school: '',
    year: '',
    progress: 0,
    mode: 'Face to Face',
    fees: 0,
    notes: '',
    parentName: '',
    contactNumber: '',
    address: '',
}

describe('StudentFormModal', () => {
    it('renders the add-student form fields', () => {
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
                    fees: 0,
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

    it('emits field changes for date and subjects', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()

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
                    fees: 0,
                    notes: '',
                    parentName: '',
                    contactNumber: '',
                    address: '',
                }}
                onClose={vi.fn()}
                onChange={onChange}
                onSubmit={vi.fn()}
            />
        )

        fireEvent.change(screen.getByLabelText(/date of birth/i), {
            target: { value: '2012-04-05' },
        })
        expect(onChange).toHaveBeenCalledWith('dob', '2012-04-05')

        await user.click(screen.getByRole('combobox', { name: /subjects/i }))
        await user.click(screen.getByRole('option', { name: 'Mathematics' }))

        expect(onChange).toHaveBeenCalledWith('subjects', ['Mathematics'])

        fireEvent.change(screen.getByLabelText(/fee per session/i), {
            target: { value: '145' },
        })
        expect(onChange).toHaveBeenCalledWith('fees', 145)
    })

    it('labels the fee amount by type and emits the chosen fee type', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()

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
                    fees: 0,
                    feeType: 'monthly',
                    notes: '',
                    parentName: '',
                    contactNumber: '',
                    address: '',
                }}
                onClose={vi.fn()}
                onChange={onChange}
                onSubmit={vi.fn()}
            />
        )

        // A monthly student's amount is labelled per month, not per session.
        expect(screen.getByLabelText(/monthly fee/i)).toBeInTheDocument()
        expect(
            screen.queryByLabelText(/fee per session/i)
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('combobox', { name: /fee type/i }))
        await user.click(screen.getByRole('option', { name: 'Per session' }))
        expect(onChange).toHaveBeenCalledWith('feeType', 'per-session')
    })

    it('marks required fields on a Save attempt, and clears them on reopen (REQ-029)', async () => {
        const user = userEvent.setup()
        const { rerender } = render(
            <StudentFormModal
                open
                form={emptyForm}
                onClose={vi.fn()}
                onChange={vi.fn()}
                onSubmit={vi.fn()}
            />
        )

        // Nothing is flagged until Save is pressed (on-submit only).
        expect(
            screen.queryByText('First name is required')
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /save student/i }))

        // Each empty required field names its problem; optional ones stay quiet.
        expect(
            screen.getByText('First name is required')
        ).toBeInTheDocument()
        expect(screen.getByText('Last name is required')).toBeInTheDocument()
        expect(screen.getByText('Pick at least one subject')).toBeInTheDocument()
        expect(screen.getByText('School is required')).toBeInTheDocument()
        expect(screen.getByText('Year is required')).toBeInTheDocument()

        // Reopening resets the attempt, so a fresh Add starts without red fields.
        rerender(
            <StudentFormModal
                open={false}
                form={emptyForm}
                onClose={vi.fn()}
                onChange={vi.fn()}
                onSubmit={vi.fn()}
            />
        )
        rerender(
            <StudentFormModal
                open
                form={emptyForm}
                onClose={vi.fn()}
                onChange={vi.fn()}
                onSubmit={vi.fn()}
            />
        )
        expect(
            screen.queryByText('First name is required')
        ).not.toBeInTheDocument()
    })
})
