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
import { requiredFieldProps } from '../utils/formValidation'
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
    /** Adds a student to an existing class (a solo class becomes a group). */
    onAddMember: (sessionId: number, studentId: number) => void
    /** Permanently deletes a class (the whole group) — distinct from cancel. */
    onDeleteClass: (id: number) => void
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

/**
 * Who the Students field shows for an entry: its active attendees — but when
 * the whole class is cancelled, its members, so a cancelled class still names
 * the students it was for rather than opening to an empty field.
 */
const displayMembers = (entry: DayEntry) => {
    const active = activeMembers(entry)
    return active.length ? active : entry.sessions
}

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
    onAddMember,
    onDeleteClass,
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
    // showing. Several students make the booking a group class.
    const [selectedStudents, setSelectedStudents] = useState<StudentOption[]>(
        []
    )
    const [subjects, setSubjects] = useState<string[]>([])
    const [time, setTime] = useState('')
    const [durationMinutes, setDurationMinutes] = useState(60)
    const [notes, setNotes] = useState('')

    // A class can only be one of the subjects its students are registered for
    // (set when the student was added), so the Subject dropdown offers just
    // those — the union across everyone picked for a group class. Current
    // picks are folded in so an edited class keeps its stored subject as a
    // valid option even if the student's registration has since changed.
    const subjectChoices = useMemo(
        () =>
            Array.from(
                new Set([
                    ...selectedStudents.flatMap((option) => option.subjects),
                    ...subjects,
                ])
            ).sort(),
        [selectedStudents, subjects]
    )
    // Required-field errors show only after an add/save is attempted (REQ-029);
    // reset whenever a day or entry is opened so a fresh form starts clean.
    const [submitted, setSubmitted] = useState(false)
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
    // The class the delete confirmation is about, if any (a whole entry).
    const [deleteTarget, setDeleteTarget] = useState<DayEntry | null>(null)

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
        // Active attendees seed the field (an excused member is not in the
        // class until re-added); a fully cancelled class still shows its names.
        const members = entry
            ? displayMembers(entry).map((session) => {
                  const option = studentOptions.find(
                      (candidate) => candidate.id === session.studentId
                  )
                  if (option) {
                      return option
                  }
                  // The student has left the active roster — archiving them
                  // auto-cancels their classes, and archived students are not
                  // in the picker. Name them from the row's denormalised copy
                  // so a cancelled class is never a nameless blank field.
                  const [firstName, ...rest] = session.studentName.split(' ')
                  return {
                      id: session.studentId,
                      label: `${session.studentName} • Year ${session.year}`,
                      firstName,
                      lastName: rest.join(' '),
                      year: session.year,
                      subjects: [],
                  }
              })
            : []
        setSelectedStudents(members)
        setSubjects(splitSubjects(entry?.lead.subject))
        setTime(entry?.lead.time ?? '')
        setDurationMinutes(entry?.lead.durationMinutes ?? 60)
        setNotes(entry?.lead.notes ?? '')
        setSubmitted(false)
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

    // The entry's values when the modal opened — the baseline the Save button
    // compares against. Students are the field's seeded attendees, in id order
    // so a reordering of the chips never reads as a change.
    const originalForm = editingEntry
        ? {
              studentIds: displayMembers(editingEntry)
                  .map((session) => session.studentId)
                  .sort((left, right) => left - right),
              subject: splitSubjects(editingEntry.lead.subject).join(', '),
              time: editingEntry.lead.time,
              durationMinutes: editingEntry.lead.durationMinutes ?? 60,
              notes: editingEntry.lead.notes ?? '',
          }
        : null

    const currentStudentIds = selectedStudents
        .map((option) => option.id)
        .sort((left, right) => left - right)

    // A class must keep at least one student and a subject and a time.
    const formValid =
        selectedStudents.length > 0 && subjects.length > 0 && time.length > 0

    // Only a real change to a field arms Save — reopening a class and closing
    // it unchanged must not fire a no-op edit.
    const isDirty =
        originalForm !== null &&
        (originalForm.subject !== subjects.join(', ') ||
            originalForm.time !== time ||
            originalForm.durationMinutes !== durationMinutes ||
            originalForm.notes !== notes ||
            originalForm.studentIds.join(',') !== currentStudentIds.join(','))

    // Save is always live when adding; when editing it waits for a valid change.
    const saveDisabled = Boolean(editingEntry) && (!formValid || !isDirty)

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        setSubmitted(true)
        if (!formValid || !openDate) {
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
            const originalIds = new Set(
                displayMembers(editingEntry).map((session) => session.studentId)
            )
            const currentIds = new Set(selectedStudents.map((o) => o.id))

            // Shared fields move the whole class — every linked row at once.
            // Only send the edit when one of them actually changed.
            const detailsChanged =
                originalForm!.subject !== subjects.join(', ') ||
                originalForm!.time !== time ||
                originalForm!.durationMinutes !== durationMinutes ||
                originalForm!.notes !== notes
            if (detailsChanged) {
                onEditClass(
                    editingEntry.lead.id,
                    shared,
                    currentIds.size > 1 || editingEntry.isGroup
                )
            }

            // Dropped attendees: cancel their row, kept for billing history.
            editingEntry.sessions
                .filter(
                    (session) =>
                        session.status !== 'Cancelled' &&
                        !currentIds.has(session.studentId)
                )
                .forEach((session) =>
                    onSetSessionStatus(session.id, 'Cancelled', false)
                )

            // New attendees join the class — a solo class becomes a group, and
            // a previously excused member is restored server-side.
            selectedStudents
                .filter((option) => !originalIds.has(option.id))
                .forEach((option) =>
                    onAddMember(editingEntry.lead.id, option.id)
                )
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
                            disabled={saveDisabled}
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
                        noValidate
                    >
                        <Autocomplete
                            multiple
                            options={studentOptions}
                            value={selectedStudents}
                            disablePortal
                            onChange={(_event, value) => {
                                setSelectedStudents(value)
                                // Keep only subjects the remaining students
                                // actually teach, so a picked subject can never
                                // be one they aren't registered for.
                                const allowed = new Set(
                                    value.flatMap((option) => option.subjects)
                                )
                                setSubjects((current) =>
                                    current.filter((subject) =>
                                        allowed.has(subject)
                                    )
                                )
                            }}
                            isOptionEqualToValue={(option, value) =>
                                option.id === value.id
                            }
                            getOptionLabel={(option) => option.label}
                            renderOption={(props, option) => {
                                const { key, ...optionProps } = props

                                return (
                                    <li key={key} {...optionProps}>
                                        <span className="scheduling-student-option">
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
                                    {...requiredFieldProps(
                                        submitted &&
                                            selectedStudents.length === 0,
                                        'Pick at least one student'
                                    )}
                                />
                            )}
                        />
                        <Autocomplete
                            multiple
                            options={subjectChoices}
                            value={subjects}
                            disablePortal
                            disabled={selectedStudents.length === 0}
                            onChange={(_event, value) => setSubjects(value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Subject"
                                    placeholder={
                                        selectedStudents.length === 0
                                            ? 'Pick a student first'
                                            : subjects.length === 0
                                              ? "Pick from the student's subjects"
                                              : ''
                                    }
                                    {...requiredFieldProps(
                                        submitted && subjects.length === 0,
                                        'Pick at least one subject'
                                    )}
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
                            {...requiredFieldProps(
                                submitted && !time,
                                'Time is required'
                            )}
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

                                {/* Delete removes the class outright — a booking
                                    made by mistake — as opposed to cancelling a
                                    class that was genuinely scheduled. */}
                                <Button
                                    color="error"
                                    variant="outlined"
                                    onClick={() =>
                                        setDeleteTarget(editingEntry)
                                    }
                                >
                                    Delete class
                                </Button>
                            </div>
                        )}
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                maxWidth="xs"
            >
                {deleteTarget && (
                    <>
                        <DialogTitle>
                            {deleteTarget.isGroup
                                ? 'Delete this class for everyone?'
                                : 'Delete this class?'}
                        </DialogTitle>
                        <DialogContent>
                            <p className="session-summary-meta">
                                {`${deleteTarget.lead.time} • ${entryTitle(deleteTarget)} • ${deleteTarget.lead.subject}`}
                            </p>
                            <p className="delete-warning">
                                This permanently removes the class. To keep a
                                record instead, cancel it.
                            </p>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleteTarget(null)}>
                                Keep
                            </Button>
                            <Button
                                color="error"
                                variant="contained"
                                onClick={() => {
                                    onDeleteClass(deleteTarget.lead.id)
                                    setDeleteTarget(null)
                                    setOpenDate(null)
                                }}
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </>
                )}
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
                                    (booked.length > 0
                                        ? `${day.toDateString()}: ${booked.length} ${booked.length === 1 ? 'class' : 'classes'}`
                                        : day.toDateString()) +
                                    (isToday ? ' (today)' : '')
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
                                                        <span className="tooltip-entry">
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
