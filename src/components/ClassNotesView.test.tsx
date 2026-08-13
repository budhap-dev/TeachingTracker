import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ClassNotesView } from './ClassNotesView'
import type { ScheduledSession } from '../data/students'

const session = (
    overrides: Partial<ScheduledSession> & { id: number }
): ScheduledSession => ({
    studentId: 1,
    studentName: 'Asha Perera',
    year: '10',
    subject: 'Mathematics',
    date: '2026-09-01',
    time: '16:00',
    durationMinutes: 60,
    notes: '',
    status: 'Scheduled',
    ...overrides,
})

const sessions: ScheduledSession[] = [
    session({ id: 1, date: '2026-09-01', time: '16:00', notes: 'Ratios clicked today.' }),
    session({
        id: 2,
        date: '2026-09-08',
        time: '09:00',
        studentId: 2,
        studentName: 'Nimal Perera',
        subject: 'Physics',
        notes: 'Needs another go at moments.',
    }),
    // No note: never appears.
    session({ id: 3, date: '2026-09-10', notes: '   ' }),
]

const renderNotes = (list = sessions) =>
    render(
        <MemoryRouter>
            <ClassNotesView sessions={list} />
        </MemoryRouter>
    )

describe('ClassNotesView', () => {
    it('reads the notes newest day first, and skips classes with none', () => {
        renderNotes()

        const dates = screen
            .getAllByRole('heading', { level: 4 })
            .map((heading) => heading.textContent)
        expect(dates).toEqual([
            'Tuesday, 8 September 2026',
            'Tuesday, 1 September 2026',
        ])
        // The note-less class contributes no day at all.
        expect(dates).toHaveLength(2)
        expect(screen.getByText('Ratios clicked today.')).toBeInTheDocument()
    })

    it('names the class each note came from', () => {
        renderNotes()

        const note = screen.getByText('Needs another go at moments.')
            .closest('li') as HTMLElement
        expect(within(note).getByText('09:00')).toBeInTheDocument()
        expect(within(note).getByText('Nimal Perera')).toBeInTheDocument()
        expect(within(note).getByText('Physics')).toBeInTheDocument()
    })

    it('opens the exact class it came from, not just the day', () => {
        renderNotes()

        const note = screen.getByText('Ratios clicked today.')
            .closest('li') as HTMLElement
        expect(within(note).getByRole('link', { name: /open class/i })).toHaveAttribute(
            'href',
            '/scheduling?day=2026-09-01&entry=solo-1'
        )
    })

    it('keeps a cancelled class’s note, and says so', () => {
        renderNotes([
            session({ id: 4, notes: 'Called off — illness.', status: 'Cancelled' }),
        ])

        expect(screen.getByText('Called off — illness.')).toBeInTheDocument()
        expect(screen.getByText('Cancelled')).toBeInTheDocument()
    })

    it('filters by student, and says when a filter leaves nothing', async () => {
        const user = userEvent.setup()
        renderNotes()

        await user.click(screen.getByRole('combobox', { name: /student/i }))
        await user.click(await screen.findByRole('option', { name: 'Nimal Perera' }))

        expect(screen.getByText('Needs another go at moments.')).toBeInTheDocument()
        expect(screen.queryByText('Ratios clicked today.')).not.toBeInTheDocument()
        expect(screen.getByText('1 note')).toBeInTheDocument()

        // Narrow to a month that student has nothing in.
        await user.click(screen.getByRole('combobox', { name: /month/i }))
        const options = await screen.findAllByRole('option')
        const septemberOnly = options.find((option) =>
            /september/i.test(option.textContent ?? '')
        ) as HTMLElement
        await user.click(septemberOnly)
        expect(screen.getByText('Needs another go at moments.')).toBeInTheDocument()
    })

    it('offers only students and months that actually have notes', async () => {
        const user = userEvent.setup()
        renderNotes()

        await user.click(screen.getByRole('combobox', { name: /student/i }))
        const names = (await screen.findAllByRole('option')).map(
            (option) => option.textContent
        )
        // The note-less class's student is not offered.
        expect(names).toEqual(['All students', 'Asha Perera', 'Nimal Perera'])
    })

    it('says so plainly when nothing has been written yet', () => {
        renderNotes([session({ id: 9, notes: '' })])

        expect(screen.getByText(/no class notes yet/i)).toBeInTheDocument()
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })
})
