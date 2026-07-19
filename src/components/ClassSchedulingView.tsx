import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import {
    Autocomplete,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    TextField,
    Tooltip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { EditClassChanges, ScheduleClassInput } from '../store/store'
import {
    bookedLevelClass,
    durationOptions,
    formatDayLabel,
    formatDuration,
    toDateKey,
} from '../utils/calendar'
import {
    activeMembers,
    entryTitle,
    groupDaySessions,
    type DayEntry,
} from '../utils/sessionGroups'
import type { ScheduledSession, SessionStatus, Student } from '../data/students'

type ClassSchedulingViewProps = {
    students: Student[]
    sessions: ScheduledSession[]
    /** Opens this day's modal on arrival (dashboard deep links, ?day=…). */
    initialOpenDate?: string
    onScheduleClass: (input: ScheduleClassInput) => void
    onEditClass: (
        id: number,
        changes: EditClassChanges,
        applyToGroup: boolean
    ) => void
    onSetSessionStatus: (
        id: number,
        status: SessionStatus,
        applyToGroup?: boolean
    ) => void
}

type StudentOption = {
    id: number
    label: string
    firstName: string
    lastName: string
    year: string
    subjects: string[]
}

/** What the are-you-sure dialog is about to cancel. */
type CancelTarget =
    | { kind: 'row'; session: ScheduledSession }
    | { kind: 'group'; entry: DayEntry }

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** A student's first subject seeds the form — nothing if they have none. */
const defaultSubjects = (option?: StudentOption) =>
    option?.subjects.slice(0, 1) ?? []

/** The API keeps one subject string; the form edits it as chips. */
const splitSubjects = (subject?: string) => (subject ? subject.split(', ') : [])

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
    initialOpenDate,
    onScheduleClass,
    onEditClass,
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

    // Every subject taught across the roster, once each — the dropdown's
    // options. freeSolo on the field still lets a new one be typed in.
    const subjectOptions = useMemo(
        () =>
            [...new Set(students.flatMap((student) => student.subjects))].sort(
                (a, b) => a.localeCompare(b)
            ),
        [students]
    )

    // The form starts empty and is filled from whichever class the modal is
    // showing. Several students make the booking a group class.
    const [selectedStudents, setSelectedStudents] = useState<StudentOption[]>(
        []
    )
    const [subjects, setSubjects] = useState<string[]>([])
    const [time, setTime] = useState('')
    const [durationMinutes, setDurationMinutes] = useState(60)
    const [notes, setNotes] = useState('')
    const [monthReference, setMonthReference] = useState(() => new Date())
    // The day whose modal is open. The calendar owns the date now, so there is
    // no date field to keep in sync — null means no modal.
    const [openDate, setOpenDate] = useState<string | null>(null)
    // Which of that day's entries the form is editing. null means the form is
    // in "add" mode. Held as the entry key (groupId / solo id), so it survives
    // the list re-sorting when a class is added.
    const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(
        null
    )
    // What the "are you sure?" dialog is about to cancel, if anything.
    const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null)

    // A day's rows folded into entries — a group class is ONE entry — sorted
    // once, here, so chips, tooltips and the day modal number identically.
    const entriesByDate = useMemo(() => {
        const byDate = sessions.reduce<Record<string, ScheduledSession[]>>(
            (acc, session) => {
                acc[session.date] = [...(acc[session.date] || []), session]
                return acc
            },
            {}
        )
        const entries: Record<string, DayEntry[]> = {}
        Object.entries(byDate).forEach(([date, list]) => {
            entries[date] = groupDaySessions(list)
        })
        return entries
    }, [sessions])

    /**
     * Mirrors an entry into the form. Passing nothing clears it — the blank
     * "add a new class" state.
     */
    const applyEntryToForm = (entry?: DayEntry) => {
        const members = entry
            ? entry.sessions
                  .map((session) =>
                      studentOptions.find(
                          (candidate) => candidate.id === session.studentId
                      )
                  )
                  .filter((option): option is StudentOption => Boolean(option))
            : []
        setSelectedStudents(members)
        setSubjects(splitSubjects(entry?.lead.subject))
        setTime(entry?.lead.time ?? '')
        setDurationMinutes(entry?.lead.durationMinutes ?? 60)
        setNotes(entry?.lead.notes ?? '')
    }

    /** Opens a day to edit `entryKey`, or its earliest entry, or to add one. */
    const openDay = (dateKey: string, entryKey?: string) => {
        const dayEntries = entriesByDate[dateKey] ?? []
        const entry =
            dayEntries.find((candidate) => candidate.key === entryKey) ??
            dayEntries[0]
        setOpenDate(dateKey)
        setSelectedEntryKey(entry?.key ?? null)
        applyEntryToForm(entry)
    }

    // A deep-linked day (dashboard week bar) opens once on arrival — and the
    // calendar behind the modal turns to that day's month.
    const openedInitialDate = useRef(false)
    useEffect(() => {
        if (!initialOpenDate || openedInitialDate.current) {
            return
        }
        openedInitialDate.current = true
        const [year, month] = initialOpenDate.split('-').map(Number)
        setMonthReference(new Date(year, month - 1, 1))
        openDay(initialOpenDate)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run once;
        // openDay is stable in behaviour and recreating it must not re-open.
    }, [initialOpenDate])

    /** Switches the form to edit another of the day's entries. */
    const selectEntry = (entry: DayEntry) => {
        setSelectedEntryKey(entry.key)
        applyEntryToForm(entry)
    }

    /** Switches the form to "add a new class": clears it, edits nothing. */
    const startAdd = () => {
        setSelectedEntryKey(null)
        applyEntryToForm(undefined)
    }

    const monthGrid = useMemo(
        () => getMonthGrid(monthReference),
        [monthReference]
    )
    const monthLabel = monthReference.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
    })
    const todayKey = toDateKey(new Date())

    // What is still to come — classes, not rows: a group hour counts once.
    const upcomingCount = useMemo(
        () =>
            Object.entries(entriesByDate)
                .filter(([date]) => date >= todayKey)
                .reduce(
                    (sum, [, entries]) =>
                        sum +
                        entries.filter(
                            (entry) => activeMembers(entry).length > 0
                        ).length,
                    0
                ),
        [entriesByDate, todayKey]
    )

    // Everything booked on the open day, earliest first — including cancelled
    // ones, which stay visible so they can be edited or restored.
    const openDateEntries = openDate ? (entriesByDate[openDate] ?? []) : []
    // The entry the form is editing, or undefined in "add" mode. A selected
    // key that no longer resolves falls back to add, so the form never edits
    // a class that is not on screen.
    const editingEntry = openDateEntries.find(
        (entry) => entry.key === selectedEntryKey
    )

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        if (
            !selectedStudents.length ||
            !subjects.length ||
            !openDate ||
            !time
        ) {
            return
        }

        const shared = {
            subject: subjects.join(', '),
            date: openDate,
            time,
            durationMinutes,
            notes: notes.trim() || 'Scheduled from the class planner',
        }

        if (editingEntry) {
            // Shared fields move the whole class — every linked row at once.
            // Membership changes are cancel-a-row / book-again, not an edit.
            onEditClass(editingEntry.lead.id, shared, editingEntry.isGroup)
        } else {
            onScheduleClass({
                studentIds: selectedStudents.map((option) => option.id),
                ...shared,
            })
        }

        setOpenDate(null)
    }

    return (
        <section className="content-stack">
            <div className="card scheduling-hero">
                <div>
                    <h3 className="page-heading">
                        <CalendarMonthOutlinedIcon fontSize="small" />
                        Class scheduling
                    </h3>
                    <p>
                        Pick a day to book a lesson — for one student or a group
                        — or change what is already on.
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
                {/* Same header shape as the student modal: title left,
                    primary action + ✕ right. */}
                <DialogTitle className="modal-header">
                    {openDate ? formatDayLabel(openDate) : ''}
                    <span className="modal-header-actions">
                        <Button
                            type="submit"
                            form="scheduling-form"
                            variant="contained"
                            size="small"
                        >
                            {editingEntry ? 'Save changes' : 'Add class'}
                        </Button>
                        <IconButton
                            aria-label="Close"
                            size="small"
                            onClick={() => setOpenDate(null)}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </span>
                </DialogTitle>
                <DialogContent className="day-modal-content">
                    {openDateEntries.length > 0 && (
                        <div className="day-modal-sessions">
                            <h4>Classes on this day</h4>
                            {/* One numbered chip per class — a group is one
                                chip — matching the numbers on the calendar. */}
                            <div
                                className="day-modal-picker"
                                role="tablist"
                                aria-label="Classes on this day"
                            >
                                {openDateEntries.map((entry, index) => (
                                    <button
                                        key={entry.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={
                                            entry.key === editingEntry?.key
                                        }
                                        className={`day-modal-picker-chip ${entry.key === editingEntry?.key ? 'selected' : ''} ${activeMembers(entry).length === 0 ? 'cancelled' : ''}`}
                                        onClick={() => selectEntry(entry)}
                                    >
                                        {index + 1}
                                        {entry.isGroup && (
                                            <span className="chip-group-size">
                                                ×{entry.sessions.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={!editingEntry}
                                    aria-label="Add a class"
                                    className={`day-modal-picker-chip add ${!editingEntry ? 'selected' : ''}`}
                                    onClick={startAdd}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}

                    <h4>
                        {editingEntry
                            ? editingEntry.isGroup
                                ? `Edit group class (${editingEntry.sessions.length} students)`
                                : 'Edit class'
                            : 'Add a class'}
                    </h4>
                    <form
                        id="scheduling-form"
                        className="scheduling-form"
                        onSubmit={handleSubmit}
                    >
                        <Autocomplete
                            multiple
                            options={studentOptions}
                            value={selectedStudents}
                            disablePortal
                            // Membership is fixed while editing: excuse a
                            // student below, or book a new class — an edit
                            // must not silently rewrite who attends.
                            disabled={Boolean(editingEntry)}
                            onChange={(_event, value) => {
                                setSelectedStudents(value)
                                if (!subjects.length) {
                                    setSubjects(defaultSubjects(value[0]))
                                }
                            }}
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
                                    label="Students"
                                    placeholder={
                                        selectedStudents.length === 0
                                            ? 'Pick one student — or several for a group class'
                                            : ''
                                    }
                                />
                            )}
                        />
                        <Autocomplete
                            multiple
                            freeSolo
                            options={subjectOptions}
                            value={subjects}
                            disablePortal
                            onChange={(_event, value) => setSubjects(value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Subject"
                                    placeholder={
                                        subjects.length === 0
                                            ? 'Pick subjects — or type your own'
                                            : ''
                                    }
                                />
                            )}
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
                            select
                            label="Duration"
                            value={durationMinutes}
                            onChange={(event) =>
                                setDurationMinutes(Number(event.target.value))
                            }
                        >
                            {durationOptions.map((minutes) => (
                                <MenuItem key={minutes} value={minutes}>
                                    {formatDuration(minutes)}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Notes"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            multiline
                            minRows={3}
                            placeholder="Homework focus, topics, or parent notes"
                        />

                        {/* Group membership: each attendee can be excused (and
                            not billed) without touching the others. */}
                        {editingEntry?.isGroup && (
                            <div className="group-members">
                                <h5>Attending</h5>
                                <ul>
                                    {editingEntry.sessions.map((member) => (
                                        <li key={member.id}>
                                            <span
                                                className={
                                                    member.status ===
                                                    'Cancelled'
                                                        ? 'member-cancelled'
                                                        : ''
                                                }
                                            >
                                                {member.studentName}
                                            </span>
                                            {member.status === 'Cancelled' ? (
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    onClick={() =>
                                                        onSetSessionStatus(
                                                            member.id,
                                                            'Scheduled'
                                                        )
                                                    }
                                                >
                                                    Restore
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    color="error"
                                                    onClick={() =>
                                                        setCancelTarget({
                                                            kind: 'row',
                                                            session: member,
                                                        })
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* The primary action lives in the modal header; only
                            the destructive/status actions stay by the form. */}
                        {editingEntry && (
                            <div className="day-modal-actions">
                                {editingEntry.isGroup ? (
                                    activeMembers(editingEntry).length > 0 ? (
                                        <Button
                                            color="error"
                                            variant="contained"
                                            onClick={() =>
                                                setCancelTarget({
                                                    kind: 'group',
                                                    entry: editingEntry,
                                                })
                                            }
                                        >
                                            Cancel for everyone
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="text"
                                            onClick={() =>
                                                onSetSessionStatus(
                                                    editingEntry.lead.id,
                                                    'Scheduled',
                                                    true
                                                )
                                            }
                                        >
                                            Restore for everyone
                                        </Button>
                                    )
                                ) : editingEntry.lead.status === 'Cancelled' ? (
                                    <Button
                                        variant="text"
                                        onClick={() =>
                                            onSetSessionStatus(
                                                editingEntry.lead.id,
                                                'Scheduled'
                                            )
                                        }
                                    >
                                        Restore
                                    </Button>
                                ) : (
                                    <Button
                                        color="error"
                                        variant="contained"
                                        onClick={() =>
                                            setCancelTarget({
                                                kind: 'row',
                                                session: editingEntry.lead,
                                            })
                                        }
                                    >
                                        Cancel class
                                    </Button>
                                )}
                            </div>
                        )}
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={cancelTarget !== null}
                onClose={() => setCancelTarget(null)}
                maxWidth="xs"
            >
                {/* Narrowed once here: the dialog only has content while a
                    target exists, so no handler needs a null guard. */}
                {cancelTarget && (
                    <>
                        <DialogTitle>
                            {cancelTarget.kind === 'group'
                                ? 'Cancel this class for everyone?'
                                : 'Cancel this class?'}
                        </DialogTitle>
                        <DialogContent>
                            <p className="session-summary-meta">
                                {cancelTarget.kind === 'row'
                                    ? `${cancelTarget.session.time} • ${cancelTarget.session.studentName} • ${cancelTarget.session.subject}`
                                    : `${cancelTarget.entry.lead.time} • ${entryTitle(cancelTarget.entry)} • ${cancelTarget.entry.lead.subject}`}
                            </p>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setCancelTarget(null)}>
                                No
                            </Button>
                            <Button
                                color="error"
                                variant="contained"
                                onClick={() => {
                                    if (cancelTarget.kind === 'row') {
                                        onSetSessionStatus(
                                            cancelTarget.session.id,
                                            'Cancelled'
                                        )
                                    } else {
                                        onSetSessionStatus(
                                            cancelTarget.entry.lead.id,
                                            'Cancelled',
                                            true
                                        )
                                    }
                                    setCancelTarget(null)
                                }}
                            >
                                Yes
                            </Button>
                        </DialogActions>
                    </>
                )}
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
                        const dayKey = toDateKey(day)
                        const dayEntries = entriesByDate[dayKey] || []
                        const booked = dayEntries.filter(
                            (entry) => activeMembers(entry).length > 0
                        )
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
                                {dayEntries.length > 0 && (
                                    <div className="calendar-day-chips">
                                        {dayEntries.map((entry, index) => (
                                            <button
                                                key={entry.key}
                                                type="button"
                                                className={`calendar-day-chip ${activeMembers(entry).length === 0 ? 'cancelled' : ''}`}
                                                onClick={() =>
                                                    openDay(dayKey, entry.key)
                                                }
                                                aria-label={`Class ${index + 1} on ${day.toDateString()}: ${entry.lead.time} ${entryTitle(entry)}, ${entry.lead.subject}${activeMembers(entry).length === 0 ? ' (cancelled)' : ''}`}
                                            >
                                                {index + 1}
                                                {entry.isGroup && (
                                                    <span className="chip-group-size">
                                                        ×{entry.sessions.length}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )

                        // Nothing on: no tooltip to open.
                        if (dayEntries.length === 0) {
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
                                            {day.toLocaleDateString('en-GB', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </strong>
                                        {/* Numbered to match the chips: the
                                                hover and the click have to
                                                agree on which class is which. */}
                                        <ul>
                                            {dayEntries.map((entry, index) => {
                                                const active =
                                                    activeMembers(entry).length
                                                return (
                                                    <li key={entry.key}>
                                                        <span className="tooltip-number">
                                                            {index + 1}
                                                        </span>
                                                        <span className="tooltip-time">
                                                            {entry.lead.time}
                                                        </span>
                                                        <span>
                                                            {entryTitle(entry)}{' '}
                                                            ·{' '}
                                                            {entry.lead.subject}
                                                        </span>
                                                        {active === 0 && (
                                                            <span className="tooltip-cancelled">
                                                                Cancelled
                                                            </span>
                                                        )}
                                                        {entry.isGroup &&
                                                            active > 0 &&
                                                            active <
                                                                entry.sessions
                                                                    .length && (
                                                                <span className="tooltip-cancelled">
                                                                    {`${entry.sessions.length - active} of ${entry.sessions.length} cancelled`}
                                                                </span>
                                                            )}
                                                    </li>
                                                )
                                            })}
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
