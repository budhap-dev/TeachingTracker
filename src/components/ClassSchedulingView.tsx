import { FormEvent, useMemo, useState } from 'react'
import {
    Autocomplete,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Tooltip,
} from '@mui/material'
import { activeSessions } from '../data/students'
import { bookedLevelClass, formatDayLabel } from '../utils/calendar'
import type { ScheduledSession, SessionStatus, Student } from '../data/students'

type ClassSchedulingViewProps = {
    students: Student[]
    sessions: ScheduledSession[]
    onScheduleClass: (session: Omit<ScheduledSession, 'id' | 'status'>) => void
    onSetSessionStatus: (id: number, status: SessionStatus) => void
}

type StudentOption = {
    id: number
    label: string
    firstName: string
    lastName: string
    year: string
    subjects: string[]
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** A student's first subject — the form's default, blank if they have none. */
const defaultSubject = (option?: StudentOption) => option?.subjects[0] ?? ''


/**
 * Formats a Date as YYYY-MM-DD in the *local* calendar.
 *
 * Deliberately not `toISOString()`: the grid builds each day at local midnight,
 * which in any timezone ahead of UTC (e.g. BST) converts back to the previous
 * day — putting every class on the wrong date, and the "today" ring one day out.
 */
const formatDateInputValue = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
    ).padStart(2, '0')}`

const getMonthGrid = (referenceDate: Date) => {
    const monthStart = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        1
    )
    const gridStart = new Date(monthStart)
    gridStart.setDate(monthStart.getDate() - monthStart.getDay())

    return Array.from({ length: 42 }, (_, index) => {
        const day = new Date(gridStart)
        day.setDate(gridStart.getDate() + index)
        return day
    })
}

export const ClassSchedulingView = ({
    students,
    sessions,
    onScheduleClass,
    onSetSessionStatus,
}: ClassSchedulingViewProps) => {
    const studentOptions = useMemo<StudentOption[]>(
        () =>
            students.map((student) => ({
                id: student.id,
                label: `${student.firstName} ${student.lastName} • Year ${student.year}`,
                firstName: student.firstName,
                lastName: student.lastName,
                year: student.year,
                subjects: student.subjects,
            })),
        [students]
    )

    // The form starts empty and is filled from whichever class the modal is
    // showing. A day with nothing on it presets nothing.
    const [selectedStudent, setSelectedStudent] =
        useState<StudentOption | null>(null)
    const [studentSearch, setStudentSearch] = useState('')
    const [subject, setSubject] = useState('')
    const [time, setTime] = useState('')
    const [notes, setNotes] = useState('')
    const [monthReference, setMonthReference] = useState(() => new Date())
    // The day whose modal is open. The calendar owns the date now, so there is
    // no date field to keep in sync — null means no modal.
    const [openDate, setOpenDate] = useState<string | null>(null)
    // Which of that day's classes the modal is showing. Held as an id, not an
    // index, so it survives the list re-sorting when a class is added.
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
        null
    )

    // Sorted once, here, so a day's classes are numbered identically wherever
    // they appear: the chips on the grid, the tooltip, and the day modal.
    const sessionsByDate = useMemo(() => {
        const byDate = sessions.reduce<Record<string, ScheduledSession[]>>(
            (acc, session) => {
                acc[session.date] = [...(acc[session.date] || []), session]
                return acc
            },
            {}
        )
        Object.values(byDate).forEach((day) =>
            day.sort((left, right) => left.time.localeCompare(right.time))
        )
        return byDate
    }, [sessions])

    /**
     * Mirrors a class into the form. Passing nothing clears it, which is what
     * an empty day gets — no student, subject or time preset.
     */
    const applySessionToForm = (session?: ScheduledSession) => {
        const option =
            studentOptions.find(
                (candidate) => candidate.id === session?.studentId
            ) ?? null
        setSelectedStudent(option)
        setStudentSearch(option?.label ?? '')
        setSubject(session?.subject ?? '')
        setTime(session?.time ?? '')
    }

    /** Opens a day, showing `sessionId` — or its earliest class by default. */
    const openDay = (dateKey: string, sessionId?: number) => {
        const daySessions = sessionsByDate[dateKey] ?? []
        const session =
            daySessions.find((candidate) => candidate.id === sessionId) ??
            daySessions[0]
        setOpenDate(dateKey)
        setSelectedSessionId(session?.id ?? null)
        applySessionToForm(session)
        setNotes('')
    }

    /** Switches the modal to another of the day's classes. */
    const selectSession = (session: ScheduledSession) => {
        setSelectedSessionId(session.id)
        applySessionToForm(session)
    }

    const monthGrid = useMemo(
        () => getMonthGrid(monthReference),
        [monthReference]
    )
    const monthLabel = monthReference.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
    })
    const todayKey = formatDateInputValue(new Date())

    // What is still to come — a count of the whole year's history would say 236
    // and mean nothing.
    const upcomingCount = useMemo(
        () =>
            activeSessions(sessions).filter(
                (session) => session.date >= todayKey
            ).length,
        [sessions, todayKey]
    )

    const handleStudentChange = (
        _event: unknown,
        value: StudentOption | null
    ) => {
        setSelectedStudent(value)
        setStudentSearch(value?.label ?? '')
        setSubject(defaultSubject(value ?? undefined))
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        if (!selectedStudent || !subject || !openDate || !time) {
            return
        }

        onScheduleClass({
            studentId: selectedStudent.id,
            studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
            year: selectedStudent.year,
            subject,
            date: openDate,
            time,
            notes: notes.trim() || 'Scheduled from the class planner',
        })

        setNotes('')
        setOpenDate(null)
    }

    // Everything booked on the open day, earliest first — including cancelled
    // ones, which stay visible so they can be restored.
    const openDateSessions = openDate ? (sessionsByDate[openDate] ?? []) : []
    // Clicking the day itself lands on its first class; clicking a numbered
    // chip lands on that one. Falls back if the shown class has just been added
    // elsewhere or the day is empty.
    const shownSession =
        openDateSessions.find(
            (session) => session.id === selectedSessionId
        ) ?? openDateSessions[0]
    const shouldOpenAutocomplete =
        studentSearch.length > 0 && studentSearch !== selectedStudent?.label

    return (
        <section className="content-stack">
            <div className="card scheduling-hero">
                <div>
                    <h3>Class scheduling</h3>
                    <p>
                        Pick a day to book a lesson or change what is already
                        on, and keep the timetable visible in the dashboard.
                    </p>
                </div>
                <div className="scheduling-hero-stats">
                    <div>
                        <strong>{upcomingCount}</strong>
                        <span>Classes to come</span>
                    </div>
                    <div>
                        <strong>{students.length}</strong>
                        <span>Students available</span>
                    </div>
                </div>
            </div>

            <Dialog
                open={openDate !== null}
                onClose={() => setOpenDate(null)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {openDate ? formatDayLabel(openDate) : ''}
                </DialogTitle>
                <DialogContent className="day-modal-content">
                    <div className="day-modal-sessions">
                        <h4>Classes on this day</h4>
                        {!shownSession ? (
                            <p className="session-summary-meta">
                                Nothing booked yet.
                            </p>
                        ) : (
                            <>
                                {/* One numbered chip per class, in time order,
                                    matching the numbers on the calendar. */}
                                <div
                                    className="day-modal-picker"
                                    role="tablist"
                                    aria-label="Classes on this day"
                                >
                                    {openDateSessions.map((session, index) => (
                                        <button
                                            key={session.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={
                                                session.id === shownSession.id
                                            }
                                            className={`day-modal-picker-chip ${session.id === shownSession.id ? 'selected' : ''} ${session.status === 'Cancelled' ? 'cancelled' : ''}`}
                                            onClick={() =>
                                                selectSession(session)
                                            }
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>

                                <dl className="day-modal-detail">
                                    <dt>Time</dt>
                                    <dd>{shownSession.time}</dd>
                                    <dt>Student</dt>
                                    <dd>
                                        {shownSession.studentName} • Year{' '}
                                        {shownSession.year}
                                    </dd>
                                    <dt>Subject</dt>
                                    <dd>{shownSession.subject}</dd>
                                    <dt>Notes</dt>
                                    <dd>{shownSession.notes || '—'}</dd>
                                    <dt>Status</dt>
                                    <dd>
                                        {shownSession.status === 'Cancelled' ? (
                                            <span className="session-cancelled-tag">
                                                Cancelled
                                            </span>
                                        ) : (
                                            'Scheduled'
                                        )}
                                    </dd>
                                </dl>

                                <Button
                                    size="small"
                                    variant="text"
                                    className="session-status-button"
                                    onClick={() =>
                                        onSetSessionStatus(
                                            shownSession.id,
                                            shownSession.status === 'Cancelled'
                                                ? 'Scheduled'
                                                : 'Cancelled'
                                        )
                                    }
                                >
                                    {shownSession.status === 'Cancelled'
                                        ? 'Restore'
                                        : 'Cancel'}
                                </Button>
                            </>
                        )}
                    </div>

                    <h4>Add a class</h4>
                    <form className="scheduling-form" onSubmit={handleSubmit}>
                        <Autocomplete
                            options={studentOptions}
                            value={selectedStudent}
                            disablePortal
                            open={shouldOpenAutocomplete}
                            inputValue={studentSearch}
                            onInputChange={(_event, value) =>
                                setStudentSearch(value)
                            }
                            onChange={handleStudentChange}
                            isOptionEqualToValue={(option, value) =>
                                option.id === value.id
                            }
                            getOptionLabel={(option) => option.label}
                            renderOption={(props, option) => {
                                const { key, ...optionProps } = props

                                return (
                                    <li key={key} {...optionProps}>
                                        <span>
                                            <strong>
                                                {option.firstName}{' '}
                                                {option.lastName}
                                            </strong>
                                            <small>
                                                Year {option.year} •{' '}
                                                {option.subjects.join(', ')}
                                            </small>
                                        </span>
                                    </li>
                                )
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Student name and year"
                                />
                            )}
                        />
                        <TextField
                            label="Subject"
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            placeholder="Select or type a subject"
                        />
                        <TextField
                            label="Time"
                            type="time"
                            value={time}
                            onChange={(event) => setTime(event.target.value)}
                            // A time input always draws its own control, so an
                            // unshrunk label sits on top of it when empty.
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                            label="Notes"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            multiline
                            minRows={3}
                            placeholder="Homework focus, topics, or parent notes"
                        />
                        <Button type="submit" variant="contained">
                            Save class
                        </Button>
                    </form>

                    <div className="student-session-summary compact">
                        {selectedStudent ? (
                            <p className="session-summary-meta">
                                {selectedStudent.firstName}{' '}
                                {selectedStudent.lastName} • Year{' '}
                                {selectedStudent.year} •{' '}
                                {selectedStudent.subjects.join(', ')}
                            </p>
                        ) : (
                            <p>No student selected.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="card scheduling-calendar-card">
                    <div className="calendar-header scheduling-calendar-header">
                        <div>
                            <h3>{monthLabel}</h3>
                            <p>
                                Booked days are shaded by how many classes they
                                hold. Pick a day to add a class, or cancel and
                                restore the ones already on it.
                            </p>
                        </div>
                        <div className="calendar-actions">
                            <button
                                type="button"
                                className="calendar-nav-button"
                                onClick={() =>
                                    setMonthReference(
                                        (current) =>
                                            new Date(
                                                current.getFullYear(),
                                                current.getMonth() - 1,
                                                1
                                            )
                                    )
                                }
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className="calendar-nav-button"
                                onClick={() =>
                                    setMonthReference(
                                        (current) =>
                                            new Date(
                                                current.getFullYear(),
                                                current.getMonth() + 1,
                                                1
                                            )
                                    )
                                }
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    <div className="calendar-weekdays" aria-hidden="true">
                        {weekdayLabels.map((weekday) => (
                            <span key={weekday}>{weekday}</span>
                        ))}
                    </div>

                    <div
                        className="calendar-grid"
                        role="grid"
                        aria-label="Class schedule calendar"
                    >
                        {monthGrid.map((day) => {
                            const dayKey = formatDateInputValue(day)
                            const sessionsForDay = sessionsByDate[dayKey] || []
                            const booked = activeSessions(sessionsForDay)
                            const isCurrentMonth =
                                day.getMonth() === monthReference.getMonth()
                            const isToday = dayKey === todayKey

                            // The cell is a plain gridcell, not a button: the
                            // numbered chips inside are buttons, and buttons
                            // cannot nest. The day-opening button fills the
                            // space above them instead.
                            const cell = (
                                <div
                                    className={`calendar-day ${isCurrentMonth ? '' : 'muted'} ${isToday ? 'today' : ''} ${bookedLevelClass(booked.length)}`}
                                    role="gridcell"
                                    aria-label={
                                        booked.length > 0
                                            ? `${day.toDateString()}: ${booked.length} ${booked.length === 1 ? 'class' : 'classes'}`
                                            : day.toDateString()
                                    }
                                >
                                    <button
                                        type="button"
                                        className="calendar-day-open"
                                        onClick={() => openDay(dayKey)}
                                        aria-label={`Open ${day.toDateString()}`}
                                    >
                                        <span className="calendar-day-number">
                                            {day.getDate()}
                                        </span>
                                    </button>
                                    {sessionsForDay.length > 0 && (
                                        <div className="calendar-day-chips">
                                            {sessionsForDay.map(
                                                (session, index) => (
                                                    <button
                                                        key={session.id}
                                                        type="button"
                                                        className={`calendar-day-chip ${session.status === 'Cancelled' ? 'cancelled' : ''}`}
                                                        onClick={() =>
                                                            openDay(
                                                                dayKey,
                                                                session.id
                                                            )
                                                        }
                                                        aria-label={`Class ${index + 1} on ${day.toDateString()}: ${session.time} ${session.studentName}, ${session.subject}${session.status === 'Cancelled' ? ' (cancelled)' : ''}`}
                                                    >
                                                        {index + 1}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )

                            // Nothing on: no tooltip to open.
                            if (sessionsForDay.length === 0) {
                                return (
                                    <div key={`${dayKey}-${day.getMonth()}`}>
                                        {cell}
                                    </div>
                                )
                            }

                            return (
                                <Tooltip
                                    key={`${dayKey}-${day.getMonth()}`}
                                    arrow
                                    placement="top"
                                    title={
                                        <div className="calendar-tooltip">
                                            <strong>
                                                {day.toLocaleDateString(
                                                    'en-GB',
                                                    {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short',
                                                    }
                                                )}
                                            </strong>
                                            {/* Numbered to match the chips: the
                                                hover and the click have to
                                                agree on which class is which. */}
                                            <ul>
                                                {sessionsForDay.map(
                                                    (session, index) => (
                                                        <li key={session.id}>
                                                            <span className="tooltip-number">
                                                                {index + 1}
                                                            </span>
                                                            <span className="tooltip-time">
                                                                {session.time}
                                                            </span>
                                                            <span>
                                                                {
                                                                    session.studentName
                                                                }{' '}
                                                                · {session.subject}
                                                            </span>
                                                            {session.status ===
                                                                'Cancelled' && (
                                                                <span className="tooltip-cancelled">
                                                                    Cancelled
                                                                </span>
                                                            )}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    }
                                >
                                    {cell}
                                </Tooltip>
                            )
                        })}
                    </div>
            </div>
        </section>
    )
}
