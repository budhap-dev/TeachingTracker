import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Student } from '../data/students'
import { StudySnapshotView } from './StudySnapshotView'

const onOpenStudentPage = vi.fn()

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

describe('StudySnapshotView', () => {
    it('sorts and paginates the student snapshot table', async () => {
        const user = userEvent.setup()
        const students = Array.from({ length: 6 }, (_, index) =>
            buildStudent({
                id: index + 1,
                firstName: `Student${index + 1}`,
                lastName: 'Example',
                subjects: [index % 2 === 0 ? 'Biology' : 'Chemistry'],
            })
        )

        render(
            <StudySnapshotView
                students={students}
                onOpenStudentPage={onOpenStudentPage}
            />
        )

        await user.selectOptions(
            screen.getByRole('combobox', { name: /rows per page/i }),
            '5'
        )

        expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()
        expect(screen.getByText('Student1 Example')).toBeInTheDocument()
        expect(screen.queryByText('Student6 Example')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /subject/i }))

        const rows = screen.getAllByRole('row')
        expect(rows[1]).toHaveTextContent('Biology')

        await user.click(screen.getByRole('button', { name: /next/i }))

        expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument()
        expect(screen.getByText('Student6 Example')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /previous/i }))

        expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()
    })

    it('lets users change rows per page from a dropdown', async () => {
        const user = userEvent.setup()
        const students = Array.from({ length: 6 }, (_, index) =>
            buildStudent({
                id: index + 1,
                firstName: `Student${index + 1}`,
                lastName: 'Example',
                subjects: ['Mathematics'],
            })
        )

        render(
            <StudySnapshotView
                students={students}
                onOpenStudentPage={onOpenStudentPage}
            />
        )

        expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument()
        expect(screen.getByText('Student6 Example')).toBeInTheDocument()

        await user.selectOptions(
            screen.getByRole('combobox', { name: /rows per page/i }),
            '5'
        )

        expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()
        expect(screen.queryByText('Student6 Example')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /next/i }))

        expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument()
        expect(screen.getByText('Student6 Example')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /previous/i }))

        expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()
    })

    it('toggles sort direction on same header and respects pagination bounds', async () => {
        const user = userEvent.setup()
        const students = [
            buildStudent({
                id: 1,
                firstName: 'Zed',
                mode: 'Online',
                school: 'School B',
                subjects: ['Biology'],
            }),
            buildStudent({
                id: 2,
                firstName: 'Amy',
                mode: 'Face to Face',
                school: 'School A',
                subjects: ['Chemistry'],
            }),
            buildStudent({
                id: 3,
                firstName: 'Noah',
                mode: 'Online',
                school: 'School C',
                subjects: ['Mathematics'],
            }),
            buildStudent({
                id: 4,
                firstName: 'Ben',
                mode: 'Face to Face',
                school: 'School D',
                subjects: ['Physics'],
            }),
            buildStudent({
                id: 5,
                firstName: 'Kai',
                mode: 'Online',
                school: 'School E',
                subjects: ['English'],
            }),
            buildStudent({
                id: 6,
                firstName: 'Mia',
                mode: 'Face to Face',
                school: 'School F',
                subjects: ['History'],
            }),
        ]

        render(
            <StudySnapshotView
                students={students}
                onOpenStudentPage={onOpenStudentPage}
            />
        )

        const previousButton = screen.getByRole('button', { name: /previous/i })
        expect(previousButton).toBeDisabled()

        await user.click(screen.getByRole('button', { name: /student/i }))
        await user.click(screen.getByRole('button', { name: /student/i }))
        await user.click(screen.getByRole('button', { name: /school/i }))
        await user.click(screen.getByRole('button', { name: /mode/i }))

        await user.click(screen.getByRole('button', { name: /next/i }))
        expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument()

        expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()

        await user.click(screen.getByRole('button', { name: /previous/i }))
        expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument()
    })

    it('opens a student page from their name in the table', async () => {
        const user = userEvent.setup()
        onOpenStudentPage.mockClear()
        render(
            <StudySnapshotView
                students={[
                    buildStudent({
                        id: 7,
                        firstName: 'Asha',
                        lastName: 'Perera',
                    }),
                ]}
                onOpenStudentPage={onOpenStudentPage}
            />
        )

        await user.click(screen.getByRole('link', { name: /asha perera/i }))
        expect(onOpenStudentPage).toHaveBeenCalledWith(7)
    })
})
