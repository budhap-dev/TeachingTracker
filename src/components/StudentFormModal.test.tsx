import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StudentFormModal } from './StudentFormModal'

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
})
