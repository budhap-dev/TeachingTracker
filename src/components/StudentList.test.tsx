import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Student } from '../data/students'
import { StudentList } from './StudentList'

beforeEach(() => {
    window.scrollTo = vi.fn()
})

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

describe('StudentList', () => {
    it('renders student names as links and opens student page from click', async () => {
        const user = userEvent.setup()
        const onOpenStudentPage = vi.fn()

        render(
            <StudentList
                students={[buildStudent()]}
                onOpenStudentPage={onOpenStudentPage}
            />
        )

        const studentLink = screen.getByRole('link', { name: /asha perera/i })
        expect(studentLink).toBeInTheDocument()

        await user.click(studentLink)

        expect(onOpenStudentPage).toHaveBeenCalledWith(1)
    })

    it('groups students under unassigned year when year is empty', () => {
        render(
            <StudentList
                students={[buildStudent({ id: 2, year: '' })]}
                onOpenStudentPage={vi.fn()}
            />
        )

        expect(screen.getByText(/year unassigned/i)).toBeInTheDocument()
    })

    it('uses fallback year-group styling for unmapped years', () => {
        render(
            <StudentList
                students={[buildStudent({ id: 3, year: '13' })]}
                onOpenStudentPage={vi.fn()}
            />
        )

        expect(screen.getByText(/year 13/i)).toBeInTheDocument()
    })
})
