import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
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

const onBack = vi.fn()

const renderNotes = (list = sessions) =>
    render(
        <MemoryRouter>
            <ClassNotesView sessions={list} onBack={onBack} />
        </MemoryRouter>
    )

/** A YYYY-MM-DD `days` from today — so "taught" and "to come" never rot. */
const fromToday = (days: number): string => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

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
        // The count rides on the toggle, and follows the filter.
        expect(
            screen.getByRole('button', { name: 'Taught · 1' })
        ).toBeInTheDocument()

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

    it('leaves the planner’s placeholder out of the list and the pickers', async () => {
        const user = userEvent.setup()
        renderNotes([
            ...sessions,
            session({
                id: 5,
                studentId: 3,
                studentName: 'Placeholder Only',
                notes: 'Scheduled from the class planner',
            }),
        ])

        expect(
            screen.queryByText(/scheduled from the class planner/i)
        ).not.toBeInTheDocument()
        // And the student it belongs to is not offered as a filter, since
        // choosing them would lead to an empty page.
        await user.click(screen.getByRole('combobox', { name: /student/i }))
        const names = (await screen.findAllByRole('option')).map(
            (option) => option.textContent
        )
        expect(names).not.toContain('Placeholder Only')
    })

    it('goes back to the planner it was opened from', async () => {
        const user = userEvent.setup()
        renderNotes()

        await user.click(screen.getByRole('button', { name: /^back$/i }))
        expect(onBack).toHaveBeenCalled()
    })

    it('says so plainly when nothing has been written yet', () => {
        renderNotes([session({ id: 9, notes: '' })])

        expect(screen.getByText(/no class notes yet/i)).toBeInTheDocument()
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('opens on classes taught, newest first, not on next term’s bookings', async () => {
        const user = userEvent.setup()
        renderNotes([
            session({ id: 10, date: fromToday(-7), notes: 'Last week.' }),
            session({ id: 11, date: fromToday(0), notes: 'Today.' }),
            session({ id: 12, date: fromToday(21), notes: 'In three weeks.' }),
            session({ id: 13, date: fromToday(7), notes: 'Next week.' }),
        ])

        expect(
            screen.getByRole('button', { name: 'Taught · 2' })
        ).toHaveAttribute('aria-pressed', 'true')
        const taught = screen
            .getAllByRole('listitem')
            .filter((item) => item.classList.contains('class-note'))
            .map((item) => within(item).getByText(/\.$/).textContent)
        expect(taught).toEqual(['Today.', 'Last week.'])
        expect(screen.queryByText('Next week.')).not.toBeInTheDocument()

        // Coming up reads the other way: soonest first.
        await user.click(screen.getByRole('button', { name: 'Coming up · 2' }))
        const coming = screen
            .getAllByRole('listitem')
            .filter((item) => item.classList.contains('class-note'))
            .map((item) => within(item).getByText(/\.$/).textContent)
        expect(coming).toEqual(['Next week.', 'In three weeks.'])
    })

    it('opens on what’s coming up when nothing has been taught yet', () => {
        renderNotes([
            session({ id: 20, date: fromToday(3), notes: 'First lesson plan.' }),
        ])

        expect(
            screen.getByRole('button', { name: 'Coming up · 1' })
        ).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByText('First lesson plan.')).toBeInTheDocument()
    })

    it('shows ten days at a time, with more on request', async () => {
        const user = userEvent.setup()
        renderNotes(
            Array.from({ length: 23 }, (_, index) =>
                session({
                    id: 100 + index,
                    date: fromToday(-index),
                    notes: `Note ${index}`,
                })
            )
        )

        expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(10)
        await user.click(
            screen.getByRole('button', { name: /show more \(13 days left\)/i })
        )
        expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(20)
        await user.click(
            screen.getByRole('button', { name: /show more \(3 days left\)/i })
        )
        expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(23)
        expect(
            screen.queryByRole('button', { name: /show more/i })
        ).not.toBeInTheDocument()
    })
})
