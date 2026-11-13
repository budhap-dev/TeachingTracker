import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import { Button, MenuItem, TextField } from '@mui/material'
import type { ScheduledSession } from '../data/students'
import { formatDayLabel, toDateKey } from '../utils/calendar'
import { groupNotesByDate, hasWrittenNote } from '../utils/classNotes'
import { paths } from '../paths'

type ClassNotesViewProps = {
    /** Every session the teacher can see; the view keeps no server state. */
    sessions: ScheduledSession[]
    /** Back to where the notes were opened from — the planner. */
    onBack: () => void
}

const ALL = 'all'

/** Days of notes drawn at first, and added per "Show more". A year of weekly
 *  classes runs to hundreds of notes; nobody reads them in one scroll. */
const PAGE_DAYS = 10

type When = 'taught' | 'upcoming'

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
 *
 * Split at today: notes on classes already taught read newest first (what
 * happened lately), notes on classes still to come read soonest first (what's
 * next). Mixed in one list, a booked term pushed today's notes weeks down.
 */
export const ClassNotesView = ({
    sessions,
    onBack,
}: ClassNotesViewProps) => {
    const [student, setStudent] = useState(ALL)
    const [month, setMonth] = useState(ALL)
    const [shownDays, setShownDays] = useState(PAGE_DAYS)
    const todayKey = toDateKey(new Date())

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

    const { taught, upcoming } = useMemo(() => {
        // Filtering by student keeps that student's own note from a group
        // class; the group's shared note still reads under everyone in it.
        const matching = sessions.filter(
            (session) =>
                (student === ALL || session.studentName === student) &&
                (month === ALL || session.date.startsWith(month))
        )
        const grouped = groupNotesByDate(matching) // newest first
        return {
            taught: grouped.filter((day) => day.date <= todayKey),
            upcoming: grouped
                .filter((day) => day.date > todayKey)
                .reverse(),
        }
    }, [sessions, student, month, todayKey])

    const countNotes = (list: typeof taught) =>
        list.reduce((count, day) => count + day.notes.length, 0)
    const taughtCount = countNotes(taught)
    const upcomingCount = countNotes(upcoming)

    // Taught by default; Coming up when nothing has been taught yet.
    const [chosenWhen, setChosenWhen] = useState<When | null>(null)
    const when: When =
        chosenWhen ?? (taught.length === 0 && upcoming.length > 0
            ? 'upcoming'
            : 'taught')
    const days = when === 'taught' ? taught : upcoming
    const visibleDays = days.slice(0, shownDays)

    // A new filter or side starts back at the first page.
    const resetPaging = () => setShownDays(PAGE_DAYS)

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
                            What you wrote on each class. Open a class to
                            change its note.
                        </p>
                    </div>
                    <Button variant="text" onClick={onBack}>
                        Back
                    </Button>
                </div>

                {noted.length > 0 && (
                    <div className="class-notes-filters">
                        <div
                            className={`calendar-view-toggle class-notes-when ${when === 'upcoming' ? 'is-second' : ''}`.trim()}
                            role="group"
                            aria-label="Which classes"
                        >
                            <button
                                type="button"
                                className={`calendar-view-segment ${when === 'taught' ? 'active' : ''}`.trim()}
                                aria-pressed={when === 'taught'}
                                onClick={() => {
                                    setChosenWhen('taught')
                                    resetPaging()
                                }}
                            >
                                Taught · {taughtCount}
                            </button>
                            <button
                                type="button"
                                className={`calendar-view-segment ${when === 'upcoming' ? 'active' : ''}`.trim()}
                                aria-pressed={when === 'upcoming'}
                                onClick={() => {
                                    setChosenWhen('upcoming')
                                    resetPaging()
                                }}
                            >
                                Coming up · {upcomingCount}
                            </button>
                        </div>
                        <TextField
                            select
                            size="small"
                            label="Student"
                            value={student}
                            onChange={(event) => {
                                setStudent(event.target.value)
                                resetPaging()
                            }}
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
                            onChange={(event) => {
                                setMonth(event.target.value)
                                resetPaging()
                            }}
                        >
                            <MenuItem value={ALL}>All months</MenuItem>
                            {months.map((monthKey) => (
                                <MenuItem key={monthKey} value={monthKey}>
                                    {monthLabel(monthKey)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </div>
                )}

                {days.length === 0 ? (
                    <p className="section-subtitle">
                        {noted.length === 0
                            ? 'No class notes yet. Anything you write on a class in the planner shows up here.'
                            : when === 'upcoming'
                              ? 'No notes on classes still to come.'
                              : 'No notes on classes taught yet.'}
                    </p>
                ) : (
                    <ol className="class-notes-log">
                        {visibleDays.map((day) => (
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
                {days.length > visibleDays.length && (
                    <Button
                        variant="text"
                        className="class-notes-more"
                        onClick={() =>
                            setShownDays((current) => current + PAGE_DAYS)
                        }
                    >
                        Show more ({days.length - visibleDays.length}{' '}
                        {days.length - visibleDays.length === 1
                            ? 'day'
                            : 'days'}{' '}
                        left)
                    </Button>
                )}
            </div>
        </section>
    )
}
