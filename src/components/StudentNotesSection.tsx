import { useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Button, IconButton, TextField } from '@mui/material'
import type { DatedNote } from '../data/students'

type StudentNotesSectionProps = {
    /** The student's dated notes; the parent owns and persists the list. */
    notes: DatedNote[]
    /** Called with the full next list whenever a note is added, edited or
     *  removed. The parent saves it — this section keeps no server state. */
    onChange: (notes: DatedNote[]) => void
}

const monthLabels = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

const weekdayLabels = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
]

const todayKey = () => new Date().toISOString().slice(0, 10)

/**
 * Splits an ISO `YYYY-MM-DD` day into the pieces the diary rail shows, parsed by
 * parts so the day never shifts across time zones. Returns `null` for anything
 * that isn't a real day, so the caller can fall back to the raw string.
 */
const noteDateParts = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number)
    if (!year || !month || !day || month > 12 || day > 31) {
        return null
    }
    const weekday = weekdayLabels[new Date(year, month - 1, day).getDay()]
    return {
        day,
        monthName: monthLabels[month - 1],
        year,
        weekday,
        label: `${day} ${monthLabels[month - 1]} ${year}`,
    }
}

/** Newest day first; ties broken by the most recently added (higher id). */
const byNewest = (left: DatedNote, right: DatedNote) =>
    right.date.localeCompare(left.date) || right.id - left.id

export const StudentNotesSection = ({
    notes,
    onChange,
}: StudentNotesSectionProps) => {
    const [draftDate, setDraftDate] = useState(todayKey)
    const [draftText, setDraftText] = useState('')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editText, setEditText] = useState('')

    const nextId = notes.reduce((max, note) => Math.max(max, note.id), 0) + 1
    const canAdd = draftText.trim().length > 0 && draftDate !== ''

    // Only ever called from the Add button, which is disabled until canAdd.
    const addNote = () => {
        onChange([
            ...notes,
            { id: nextId, date: draftDate, text: draftText.trim() },
        ])
        setDraftText('')
        setDraftDate(todayKey())
    }

    const startEditing = (note: DatedNote) => {
        setEditingId(note.id)
        setEditText(note.text)
    }

    const saveEdit = (note: DatedNote) => {
        const text = editText.trim()
        // An emptied edit deletes the note rather than storing a blank one.
        const next = text
            ? notes.map((item) =>
                  item.id === note.id ? { ...item, text } : item
              )
            : notes.filter((item) => item.id !== note.id)
        onChange(next)
        setEditingId(null)
        setEditText('')
    }

    // Delete is only offered on a settled entry (never mid-edit), so there is
    // no open editor to close here.
    const deleteNote = (note: DatedNote) => {
        onChange(notes.filter((item) => item.id !== note.id))
    }

    const ordered = [...notes].sort(byNewest)

    return (
        <section className="student-notes-log" aria-label="Notes diary">
            <div className="notes-log-head">
                <h3>Diary</h3>
                <p>A dated log of how things are going for this student.</p>
            </div>

            <div className="note-add-form">
                <TextField
                    label="Date"
                    type="date"
                    size="small"
                    className="note-date-field"
                    value={draftDate}
                    onChange={(event) => setDraftDate(event.target.value)}
                    slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { 'aria-label': 'New note date' },
                    }}
                />
                <TextField
                    label="Write an entry…"
                    size="small"
                    multiline
                    minRows={2}
                    value={draftText}
                    onChange={(event) => setDraftText(event.target.value)}
                    slotProps={{
                        htmlInput: { 'aria-label': 'New note text' },
                    }}
                    fullWidth
                />
                <Button
                    variant="contained"
                    onClick={addNote}
                    disabled={!canAdd}
                >
                    Add entry
                </Button>
            </div>

            {ordered.length === 0 ? (
                <p className="note-empty">
                    No entries yet — the diary starts with your first note.
                </p>
            ) : (
                <ol className="note-list">
                    {ordered.map((note) => {
                        const parts = noteDateParts(note.date)
                        const dateLabel = parts?.label ?? note.date
                        return (
                            <li key={note.id} className="note-entry">
                                <time
                                    className="note-date-rail"
                                    dateTime={note.date}
                                >
                                    {parts ? (
                                        <>
                                            <span className="note-weekday">
                                                {parts.weekday}
                                            </span>
                                            <span className="note-day">
                                                {parts.day}
                                            </span>
                                            <span className="note-monthyear">
                                                {parts.monthName} {parts.year}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="note-day">
                                            {note.date}
                                        </span>
                                    )}
                                </time>

                                <div className="note-body">
                                    {editingId === note.id ? (
                                        <div className="note-edit">
                                            <TextField
                                                size="small"
                                                multiline
                                                minRows={2}
                                                value={editText}
                                                onChange={(event) =>
                                                    setEditText(
                                                        event.target.value
                                                    )
                                                }
                                                slotProps={{
                                                    htmlInput: {
                                                        'aria-label':
                                                            'Edit note text',
                                                    },
                                                }}
                                                fullWidth
                                            />
                                            <div className="note-edit-actions">
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() =>
                                                        saveEdit(note)
                                                    }
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={() =>
                                                        setEditingId(null)
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="note-text">
                                                {note.text}
                                            </p>
                                            <div className="note-actions">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    aria-label={`Edit note from ${dateLabel}`}
                                                    onClick={() =>
                                                        startEditing(note)
                                                    }
                                                >
                                                    <EditOutlinedIcon fontSize="inherit" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    aria-label={`Delete note from ${dateLabel}`}
                                                    onClick={() =>
                                                        deleteNote(note)
                                                    }
                                                >
                                                    <CloseIcon fontSize="inherit" />
                                                </IconButton>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </li>
                        )
                    })}
                </ol>
            )}
        </section>
    )
}
