import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Student } from '../data/students'
import { AlumniView } from './AlumniView'

const buildStudent = (overrides: Partial<Student> = {}): Student => ({
    id: 1,
    studentId: 'STU-1',
    firstName: 'Asha',
    lastName: 'Perera',
    dob: '2011-05-14',
    subjects: ['Mathematics'],
    school: 'Kingston',
    year: '11',
    progress: 88,
    mode: 'Face to Face',
    fees: 120,
    notes: '',
    parentName: 'Nadia',
    contactNumber: '1',
    address: 'A',
    ...overrides,
})

describe('AlumniView', () => {
    it('invites the teacher to archive when there are no alumni', () => {
        render(<AlumniView alumni={[]} onOpenStudentPage={vi.fn()} />)
        expect(screen.getByText(/no alumni yet/i)).toBeInTheDocument()
    })

    it('lists alumni with their archive date and note, and links to their page', async () => {
        const user = userEvent.setup()
        const onOpenStudentPage = vi.fn()
        render(
            <AlumniView
                alumni={[
                    buildStudent({
                        id: 7,
                        firstName: 'Old',
                        lastName: 'Scholar',
                        archivedOn: '2026-07-19',
                        archiveNotes: 'Finished A-levels',
                    }),
                ]}
                onOpenStudentPage={onOpenStudentPage}
            />
        )

        expect(screen.getByText('2026-07-19')).toBeInTheDocument()
        expect(screen.getByText('Finished A-levels')).toBeInTheDocument()

        await user.click(screen.getByRole('link', { name: /old scholar/i }))
        expect(onOpenStudentPage).toHaveBeenCalledWith(7)
    })

    it('dashes the gaps for an alumnus with no year, date or note', () => {
        render(
            <AlumniView
                alumni={[
                    buildStudent({
                        id: 8,
                        year: '',
                        archivedOn: undefined,
                        archiveNotes: '',
                    }),
                ]}
                onOpenStudentPage={vi.fn()}
            />
        )
        // Three em-dash fallbacks (year, archived date, note).
        expect(screen.getAllByRole('cell').filter((c) => c.textContent === '—'))
            .toHaveLength(3)
    })
})
