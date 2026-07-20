import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { DatedNote } from '../data/students'
import { StudentNotesSection } from './StudentNotesSection'

const renderSection = (notes: DatedNote[] = []) => {
    const onChange = vi.fn()
    render(<StudentNotesSection notes={notes} onChange={onChange} />)
    return { onChange }
}

const todayKey = () => new Date().toISOString().slice(0, 10)

describe('StudentNotesSection', () => {
    it('shows an empty state and disables Add until an entry is written', async () => {
        const user = userEvent.setup()
        const { onChange } = renderSection()

        expect(screen.getByText(/no entries yet/i)).toBeInTheDocument()
        const add = screen.getByRole('button', { name: /add entry/i })
        expect(add).toBeDisabled()

        // Whitespace alone is not an entry.
        await user.type(screen.getByLabelText('New note text'), '   ')
        expect(add).toBeDisabled()

        await user.clear(screen.getByLabelText('New note text'))
        await user.type(screen.getByLabelText('New note text'), 'First lesson')
        expect(add).toBeEnabled()
        expect(onChange).not.toHaveBeenCalled()
    })

    it('adds a trimmed, dated entry with the next id', async () => {
        const user = userEvent.setup()
        const { onChange } = renderSection([
            { id: 4, date: '2026-07-01', text: 'Existing' },
        ])

        await user.clear(screen.getByLabelText('New note date'))
        await user.type(screen.getByLabelText('New note date'), '2026-07-15')
        await user.type(
            screen.getByLabelText('New note text'),
            '  Worked on fractions  '
        )
        await user.click(screen.getByRole('button', { name: /add entry/i }))

        expect(onChange).toHaveBeenCalledWith([
            { id: 4, date: '2026-07-01', text: 'Existing' },
            { id: 5, date: '2026-07-15', text: 'Worked on fractions' },
        ])
    })

    it('defaults a new entry to today', () => {
        renderSection()
        expect(screen.getByLabelText('New note date')).toHaveValue(todayKey())
    })

    it('orders entries newest first, breaking ties by most recently added', () => {
        renderSection([
            { id: 1, date: '2026-07-01', text: 'Oldest' },
            { id: 2, date: '2026-07-20', text: 'Same day A' },
            { id: 3, date: '2026-07-20', text: 'Same day B' },
        ])
        const entries = screen.getAllByRole('listitem')
        expect(entries[0]).toHaveTextContent('Same day B')
        expect(entries[1]).toHaveTextContent('Same day A')
        expect(entries[2]).toHaveTextContent('Oldest')
    })

    it('renders the diary date rail, and falls back on a bad date', () => {
        renderSection([
            { id: 1, date: '2026-07-04', text: 'Good date' },
            { id: 2, date: '2026-13-40', text: 'Bad date' },
        ])
        // 2026-07-04 is a Saturday.
        expect(screen.getByText('Saturday')).toBeInTheDocument()
        expect(screen.getByText('4')).toBeInTheDocument()
        expect(screen.getByText('July 2026')).toBeInTheDocument()
        // The unparseable day is shown raw rather than mislabelled.
        expect(screen.getByText('2026-13-40')).toBeInTheDocument()
    })

    it('edits one entry in place, leaving the others untouched', async () => {
        const user = userEvent.setup()
        const notes = [
            { id: 7, date: '2026-07-04', text: 'Draft note' },
            { id: 9, date: '2026-07-02', text: 'Another note' },
        ]
        const { onChange } = renderSection(notes)

        await user.click(
            screen.getByRole('button', { name: /edit note from 4 july 2026/i })
        )
        const box = screen.getByLabelText('Edit note text')
        await user.clear(box)
        await user.type(box, 'Polished note')
        await user.click(screen.getByRole('button', { name: /^save$/i }))

        expect(onChange).toHaveBeenCalledWith([
            { id: 7, date: '2026-07-04', text: 'Polished note' },
            { id: 9, date: '2026-07-02', text: 'Another note' },
        ])
    })

    it('cancels an edit without saving', async () => {
        const user = userEvent.setup()
        const { onChange } = renderSection([
            { id: 7, date: '2026-07-04', text: 'Draft note' },
        ])

        await user.click(
            screen.getByRole('button', { name: /edit note from 4 july 2026/i })
        )
        await user.type(screen.getByLabelText('Edit note text'), ' more')
        await user.click(screen.getByRole('button', { name: /cancel/i }))

        expect(onChange).not.toHaveBeenCalled()
        expect(screen.queryByLabelText('Edit note text')).not.toBeInTheDocument()
    })

    it('treats an emptied edit as a delete', async () => {
        const user = userEvent.setup()
        const { onChange } = renderSection([
            { id: 7, date: '2026-07-04', text: 'Draft note' },
        ])

        await user.click(
            screen.getByRole('button', { name: /edit note from 4 july 2026/i })
        )
        await user.clear(screen.getByLabelText('Edit note text'))
        await user.click(screen.getByRole('button', { name: /^save$/i }))

        expect(onChange).toHaveBeenCalledWith([])
    })

    it('deletes one entry from among several', async () => {
        const user = userEvent.setup()
        const notes = [
            { id: 7, date: '2026-07-04', text: 'Keep me' },
            { id: 8, date: '2026-07-05', text: 'Remove me' },
        ]
        const { onChange } = renderSection(notes)

        await user.click(
            screen.getByRole('button', { name: /delete note from 5 july 2026/i })
        )
        expect(onChange).toHaveBeenCalledWith([
            { id: 7, date: '2026-07-04', text: 'Keep me' },
        ])
    })

    it('deletes the only entry', async () => {
        const user = userEvent.setup()
        const { onChange } = renderSection([
            { id: 7, date: '2026-07-04', text: 'Solo note' },
        ])
        await user.click(
            within(screen.getByRole('listitem')).getByRole('button', {
                name: /delete note from 4 july 2026/i,
            })
        )
        expect(onChange).toHaveBeenCalledWith([])
    })
})
