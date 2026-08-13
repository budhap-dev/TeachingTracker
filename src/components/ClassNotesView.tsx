import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import { MenuItem, TextField } from '@mui/material'
import type { ScheduledSession } from '../data/students'
import { formatDayLabel } from '../utils/calendar'
import { groupNotesByDate, hasWrittenNote } from '../utils/classNotes'
import { paths } from '../paths'

type ClassNotesViewProps = {
    /** Every session the teacher can see; the view keeps no server state. */
    sessions: ScheduledSession[]
}

const ALL = 'all'

/** `2026-09` → `September 2026`, parsed by parts so the month never shifts. */
const monthLabel = (monthKey: string): string => {
    const [year, month] = monthKey.split('-').map(Number)
    return new Date(year, month - 1, 1).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
    })
}

/**
 * Class notes, read date-wise (REQ-052).
 *
 * The notes live on the classes themselves, written while booking or editing
 * one. This is the read: newest day first, classes without notes left out,
 * and every row a door back to the class it came from — editing stays in the
 * planner, so there is one place a note can be changed.
 */
export const ClassNotesView = ({ sessions }: ClassNotesViewProps) => {
    const [student, setStudent] = useState(ALL)
    const [month, setMonth] = useState(ALL)

    // Both filter lists are built from classes that actually carry notes, so
    // the pickers never offer a choice that leads to an empty page.
    const noted = useMemo(
        () => sessions.filter(hasWrittenNote),
        [sessions]
    )
    const students = useMemo(
        () =>
            [...new Set(noted.map((session) => session.studentName))].sort(
                (left, right) => left.localeCompare(right)
            ),
        [noted]
    )
    const months = useMemo(
        () =>
            [...new Set(noted.map((session) => session.date.slice(0, 7)))].sort(
                (left, right) => right.localeCompare(left)
            ),
        [noted]
    )

    const days = useMemo(() => {
        // Filtering by student keeps that student's own note from a group
        // class; the group's shared note still reads under everyone in it.
        const matching = sessions.filter(
            (session) =>
                (student === ALL || session.studentName === student) &&
                (month === ALL || session.date.startsWith(month))
        )
        return groupNotesByDate(matching)
    }, [sessions, student, month])

    const total = days.reduce((count, day) => count + day.notes.length, 0)

    return (
        <section className="content-stack">
            <div className="card">
                <div className="section-header">
                    <div>
                        <h3 className="page-heading">
                            <EventNoteOutlinedIcon fontSize="small" />
                            Class notes
                        </h3>
                        <p className="section-subtitle">
                            What you wrote on each class, newest first. Open a
                            class to change its note.
                        </p>
                    </div>
                </div>

                {noted.length > 0 && (
                    <div className="class-notes-filters">
                        <TextField
                            select
                            size="small"
                            label="Student"
                            value={student}
                            onChange={(event) => setStudent(event.target.value)}
                        >
                            <MenuItem value={ALL}>All students</MenuItem>
                            {students.map((name) => (
                                <MenuItem key={name} value={name}>
                                    {name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            size="small"
                            label="Month"
                            value={month}
                            onChange={(event) => setMonth(event.target.value)}
                        >
                            <MenuItem value={ALL}>All months</MenuItem>
                            {months.map((monthKey) => (
                                <MenuItem key={monthKey} value={monthKey}>
                                    {monthLabel(monthKey)}
                                </MenuItem>
                            ))}
                        </TextField>
                        <span className="class-notes-count">
                            {total} {total === 1 ? 'note' : 'notes'}
                        </span>
                    </div>
                )}

                {days.length === 0 ? (
                    <p className="section-subtitle">
                        {noted.length === 0
                            ? 'No class notes yet. Anything you write on a class in the planner shows up here.'
                            : 'No notes match those filters.'}
                    </p>
                ) : (
                    <ol className="class-notes-log">
                        {days.map((day) => (
                            <li key={day.date} className="class-notes-day">
                                <h4 className="class-notes-date">
                                    {formatDayLabel(day.date)}
                                </h4>
                                <ul className="class-notes-entries">
                                    {day.notes.map((note) => (
                                        <li
                                            key={note.key}
                                            className={`class-note ${
                                                note.isCancelled
                                                    ? 'is-cancelled'
                                                    : ''
                                            }`.trim()}
                                        >
                                            <div className="class-note-head">
                                                <span className="class-note-time">
                                                    {note.time}
                                                </span>
                                                <span className="class-note-who">
                                                    {note.who}
                                                </span>
                                                <span className="class-note-subject">
                                                    {note.subject}
                                                </span>
                                                {note.isCancelled && (
                                                    <span className="class-note-cancelled">
                                                        Cancelled
                                                    </span>
                                                )}
                                                <Link
                                                    className="class-note-open"
                                                    to={`${paths.scheduling}?day=${note.date}&entry=${encodeURIComponent(note.entryKey)}`}
                                                >
                                                    Open class
                                                </Link>
                                            </div>
                                            <p className="class-note-body">
                                                {note.note}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </section>
    )
}
