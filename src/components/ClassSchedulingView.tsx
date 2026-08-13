import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import {
    DndContext,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
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
import { paths } from '../paths'
import type { ScheduledSession, SessionStatus, Student } from '../data/students'

type ClassSchedulingViewProps = {
    students: Student[]
    sessions: ScheduledSession[]
    /** Opens this day's modal on arrival (dashboard deep links, ?day=…). */
    initialOpenDate?: string
    /** Which entry on that day to open — a class-notes row names its own
        class rather than dropping the teacher on the day's first one. */
    initialOpenEntryKey?: string
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

/** '16:30' → minutes since midnight, for overlap checks. */
const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

/** A day cell (or week column) that accepts a dropped class. */
const DroppableDay = ({
    dayKey,
    children,
}: {
    dayKey: string
    children: ReactNode
}) => {
    const { setNodeRef, isOver } = useDroppable({ id: dayKey })
    return (
        <div ref={setNodeRef} className={isOver ? 'drop-target' : undefined}>
            {children}
        </div>
    )
}

/**
 * Makes a class chip/row draggable onto another day. Listeners ride a plain
 * wrapper (no ARIA attributes — the inner button stays the interactive
 * element) and the pointer sensor's distance threshold keeps clicks working.
 */
const DraggableEntry = ({
    id,
    fromDate,
    entry,
    children,
}: {
    id: string
    fromDate: string
    entry: DayEntry
    children: ReactNode
}) => {
    const { setNodeRef, listeners, transform, isDragging } = useDraggable({
        id,
        data: { fromDate, entry },
    })
    return (
        <div
            ref={setNodeRef}
            className={`draggable-entry ${isDragging ? 'dragging' : ''}`}
            style={
                transform
                    ? {
                          transform: `translate(${transform.x}px, ${transform.y}px)`,
                      }
                    : undefined
            }
            {...listeners}
        >
            {children}
        </div>
    )
}

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
    initialOpenEntryKey,
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
    // Month grid or a single week in detail; the reference date drives both.
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
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
    // The target date for "copy this class to another day", when picked.
    const [copyDate, setCopyDate] = useState('')
    // A drag has landed: the class and the day it was dropped on, awaiting
    // the move confirmation.
    const [moveTarget, setMoveTarget] = useState<{
        entry: DayEntry
        toDate: string
    } | null>(null)

    // Drags start after a little travel, so a plain click still opens a class.
    const dragSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const toDate = event.over ? String(event.over.id) : null
        const data = event.active.data.current as
            | { fromDate: string; entry: DayEntry }
            | undefined
        if (!toDate || !data || toDate === data.fromDate) {
            return
        }
        setMoveTarget({ entry: data.entry, toDate })
    }

    /**
     * Warns (never blocks) when the picked students already have a class
     * overlapping the chosen slot on `date` — the row being edited excluded.
     */
    const clashesOn = (date: string | null) => {
        if (!date || !time) {
            return []
        }
        const start = toMinutes(time)
        const end = start + durationMinutes
        const pickedIds = new Set(selectedStudents.map((option) => option.id))
        return sessions.filter((session) => {
            if (
                session.date !== date ||
                session.status === 'Cancelled' ||
                !pickedIds.has(session.studentId)
            ) {
                return false
            }
            if (
                editingEntry?.sessions.some((row) => row.id === session.id)
            ) {
                return false
            }
            const otherStart = toMinutes(session.time)
            const otherEnd = otherStart + (session.durationMinutes ?? 60)
            return start < otherEnd && otherStart < end
        })
    }
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

    // Which student's classes the calendar SHOWS — a view-only filter. Whole
    // group entries stay intact ("Group of 3" still reads as a group), and
    // opening a day always edits the real, unfiltered class — the filter
    // never feeds the save path, so a filtered edit can't drop attendees.
    const [filterStudent, setFilterStudent] = useState<StudentOption | null>(
        null
    )
    const displayEntriesByDate = useMemo(() => {
        if (!filterStudent) {
            return entriesByDate
        }
        const filtered: Record<string, DayEntry[]> = {}
        Object.entries(entriesByDate).forEach(([date, entries]) => {
            const kept = entries.filter((entry) =>
                entry.sessions.some(
                    (session) => session.studentId === filterStudent.id
                )
            )
            if (kept.length) {
                filtered[date] = kept
            }
        })
        return filtered
    }, [entriesByDate, filterStudent])

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
        setCopyDate('')
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
        openDay(initialOpenDate, initialOpenEntryKey)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run once;
        // openDay is stable in behaviour and recreating it must not re-open.
    }, [initialOpenDate, initialOpenEntryKey])

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

    // The reference date's week, Sunday first — same week shape as the grid.
    const weekDays = useMemo(() => {
        const start = new Date(monthReference)
        start.setDate(monthReference.getDate() - monthReference.getDay())
        return Array.from({ length: 7 }, (_, index) => {
            const day = new Date(start)
            day.setDate(start.getDate() + index)
            return day
        })
    }, [monthReference])
    const weekLabel = `${weekDays[0].toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
    })} – ${weekDays[6].toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })}`

    /** Switches to the week view. Month navigation parks the reference on
        the 1st, so landing in the current month means "this week", not the
        week of the 1st. */
    const showWeekView = () => {
        setViewMode('week')
        setMonthReference((current) => {
            const now = new Date()
            return current.getMonth() === now.getMonth() &&
                current.getFullYear() === now.getFullYear()
                ? now
                : current
        })
    }

    /** True while the visible period already contains today — Current then
        has nowhere to go and disables. */
    const atCurrentPeriod =
        viewMode === 'month'
            ? monthReference.getMonth() === new Date().getMonth() &&
              monthReference.getFullYear() === new Date().getFullYear()
            : weekDays.some((day) => toDateKey(day) === todayKey)

    /** Previous/Next: a month at a time on the grid, seven days in week view. */
    const stepReference = (direction: 1 | -1) =>
        setMonthReference((current) =>
            viewMode === 'month'
                ? new Date(
                      current.getFullYear(),
                      current.getMonth() + direction,
                      1
                  )
                : new Date(
                      current.getFullYear(),
                      current.getMonth(),
                      current.getDate() + direction * 7
                  )
        )

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

    /**
     * Books a duplicate of the open class on the picked date — same students,
     * subject, time, duration and notes, exactly as the form shows them (an
     * unsaved tweak copies too: the copy is what's on screen). The API books
     * it as a brand-new class, group or solo alike.
     */
    const handleCopy = () => {
        if (!copyDate || !formValid) {
            return
        }
        onScheduleClass({
            studentIds: selectedStudents.map((option) => option.id),
            subject: subjects.join(', '),
            date: copyDate,
            time,
            durationMinutes,
            notes: notes.trim() || 'Scheduled from the class planner',
        })
        setOpenDate(null)
    }

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
                {/* The way through to the notes (REQ-052) — they belong to
                    these classes, so the door is here rather than in the
                    main menu. */}
                <div className="scheduling-hero-actions">
                    <Link className="scheduling-notes-link" to={paths.classNotes}>
                        <EventNoteOutlinedIcon fontSize="small" />
                        Class notes
                    </Link>
                </div>
                {/* Label first, figure after — the tiles read as a
                    sentence on one line (owner call, 2026-08-13). */}
                <div className="scheduling-hero-stats">
                    <div>
                        <span>Classes to come</span>
                        <strong>{upcomingCount}</strong>
                    </div>
                    <div>
                        <span>Students available</span>
                        <strong>{students.length}</strong>
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
                        {/* A heads-up, not a blocker: double-booking may be
                            deliberate (back-to-back siblings, a makeup). */}
                        {clashesOn(openDate).length > 0 && (
                            <p className="clash-warning" role="alert">
                                Overlaps{' '}
                                {clashesOn(openDate)
                                    .map(
                                        (session) =>
                                            `${session.studentName}’s ${session.time} class`
                                    )
                                    .join(' and ')}{' '}
                                on this day — double-check before booking.
                            </p>
                        )}
                        <TextField
                            label="Notes"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            multiline
                            minRows={3}
                            placeholder="Homework focus, topics, or parent notes"
                        />

                        {/* Copy the open class to another day: pick a date,
                            one click, booked as a new class. */}
                        {editingEntry && (
                            <div className="day-modal-copy">
                                <TextField
                                    label="Copy to date"
                                    type="date"
                                    size="small"
                                    value={copyDate}
                                    onChange={(event) =>
                                        setCopyDate(event.target.value)
                                    }
                                    slotProps={{
                                        inputLabel: { shrink: true },
                                    }}
                                />
                                <Button
                                    variant="outlined"
                                    disabled={
                                        !copyDate ||
                                        copyDate === openDate ||
                                        !formValid
                                    }
                                    onClick={handleCopy}
                                >
                                    Copy class
                                </Button>
                                {copyDate !== openDate &&
                                    clashesOn(copyDate).length > 0 && (
                                        <p
                                            className="clash-warning"
                                            role="alert"
                                        >
                                            Overlaps{' '}
                                            {clashesOn(copyDate)
                                                .map(
                                                    (session) =>
                                                        `${session.studentName}’s ${session.time} class`
                                                )
                                                .join(' and ')}{' '}
                                            on that day.
                                        </p>
                                    )}
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
              <DndContext sensors={dragSensors} onDragEnd={handleDragEnd}>
                <div className="calendar-header scheduling-calendar-header">
                    <div>
                        <h3>
                            {viewMode === 'month' ? monthLabel : weekLabel}
                        </h3>
                        {/* One description for both views — swapping copy on
                            toggle re-wrapped the header and made the whole
                            card jitter. */}
                        <p>
                            Pick a day to add a class, or one already booked
                            to change it — and drag a class onto another day
                            to move it.
                        </p>
                    </div>
                    <div className="calendar-actions">
                        {/* Two distinct clusters: what you're LOOKING AT (a
                            joined segmented toggle) and where you're GOING
                            (pill nav buttons), spaced apart so they never
                            read as five siblings. */}
                        <div
                            className={`calendar-view-toggle ${viewMode}`}
                            role="group"
                            aria-label="Calendar view"
                        >
                            <button
                                type="button"
                                className={`calendar-view-segment ${viewMode === 'month' ? 'active' : ''}`}
                                aria-pressed={viewMode === 'month'}
                                onClick={() => setViewMode('month')}
                            >
                                Month
                            </button>
                            <button
                                type="button"
                                className={`calendar-view-segment ${viewMode === 'week' ? 'active' : ''}`}
                                aria-pressed={viewMode === 'week'}
                                onClick={showWeekView}
                            >
                                Week
                            </button>
                        </div>
                        <div className="calendar-nav-group">
                            <button
                                type="button"
                                className="calendar-nav-button"
                                onClick={() => stepReference(-1)}
                                aria-label="Previous"
                            >
                                « Prev
                            </button>
                            <button
                                type="button"
                                className="calendar-nav-button"
                                onClick={() => setMonthReference(new Date())}
                                disabled={atCurrentPeriod}
                            >
                                Current
                            </button>
                            <button
                                type="button"
                                className="calendar-nav-button"
                                onClick={() => stepReference(1)}
                                aria-label="Next"
                            >
                                Next »
                            </button>
                        </div>
                    </div>
                </div>

                {/* View-only student filter: the calendar shows one
                    student's classes; booking and editing still see every
                    class, so a filtered edit can never drop attendees. */}
                <div className="calendar-filter-row">
                    <Autocomplete
                        options={studentOptions}
                        value={filterStudent}
                        onChange={(_event, value) => setFilterStudent(value)}
                        isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                        }
                        getOptionLabel={(option) => option.label}
                        size="small"
                        className="calendar-student-filter"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Show one student's classes"
                                placeholder="All students"
                            />
                        )}
                    />
                    {filterStudent && (
                        <span className="calendar-filter-hint">
                            Showing {filterStudent.firstName}&apos;s classes —
                            group classes stay whole, and opening a day still
                            shows everything booked.
                        </span>
                    )}
                </div>

                {viewMode === 'week' && (
                    <div
                        className="week-grid"
                        role="grid"
                        aria-label="Class schedule week"
                    >
                        {weekDays.map((day) => {
                            const dayKey = toDateKey(day)
                            const dayEntries = displayEntriesByDate[dayKey] || []
                            const isToday = dayKey === todayKey
                            const isWeekend =
                                day.getDay() === 0 || day.getDay() === 6
                            return (
                              <DroppableDay key={dayKey} dayKey={dayKey}>
                                <div
                                    className={`week-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                                    role="gridcell"
                                    aria-label={
                                        day.toDateString() +
                                        (isToday ? ' (today)' : '')
                                    }
                                >
                                    <button
                                        type="button"
                                        className="week-day-head"
                                        onClick={() => openDay(dayKey)}
                                        aria-label={`Open ${day.toDateString()}`}
                                    >
                                        <span className="week-day-name">
                                            {day.toLocaleDateString('en-GB', {
                                                weekday: 'short',
                                            })}
                                        </span>
                                        <span className="calendar-day-number">
                                            {day.getDate()}
                                        </span>
                                    </button>
                                    <div className="week-day-entries">
                                        {dayEntries.map((entry) => {
                                            const cancelled =
                                                activeMembers(entry).length ===
                                                0
                                            return (
                                                <DraggableEntry
                                                    key={entry.key}
                                                    id={`week-${dayKey}-${entry.key}`}
                                                    fromDate={dayKey}
                                                    entry={entry}
                                                >
                                                    <button
                                                        type="button"
                                                        className={`week-entry ${cancelled ? 'cancelled' : ''}`}
                                                        onClick={() =>
                                                            openDay(
                                                                dayKey,
                                                                entry.key
                                                            )
                                                        }
                                                        aria-label={`${entry.lead.time} ${entryTitle(entry)}, ${entry.lead.subject} on ${day.toDateString()}${cancelled ? ' (cancelled)' : ''}`}
                                                    >
                                                        <strong>
                                                            {entry.lead.time}
                                                        </strong>
                                                        <span className="week-entry-title">
                                                            {entryTitle(entry)}
                                                        </span>
                                                        <span className="week-entry-subject">
                                                            {entry.lead.subject}
                                                        </span>
                                                    </button>
                                                </DraggableEntry>
                                            )
                                        })}
                                        {dayEntries.length === 0 && (
                                            <span
                                                className="week-day-empty"
                                                aria-hidden="true"
                                            >
                                                No classes
                                            </span>
                                        )}
                                    </div>
                                </div>
                              </DroppableDay>
                            )
                        })}
                    </div>
                )}

                {viewMode === 'month' && (
                    <div className="calendar-weekdays" aria-hidden="true">
                        {weekdayLabels.map((weekday) => (
                            <span key={weekday}>{weekday}</span>
                        ))}
                    </div>
                )}

                {viewMode === 'month' && (
                <div
                    className="calendar-grid"
                    role="grid"
                    aria-label="Class schedule calendar"
                >
                    {monthGrid.map((day) => {
                        const dayKey = toDateKey(day)
                        const dayEntries = displayEntriesByDate[dayKey] || []
                        const booked = dayEntries.filter(
                            (entry) => activeMembers(entry).length > 0
                        )
                        const isCurrentMonth =
                            day.getMonth() === monthReference.getMonth()
                        const isToday = dayKey === todayKey
                        const isWeekend =
                            day.getDay() === 0 || day.getDay() === 6

                        // The cell is a plain gridcell, not a button: the
                        // numbered chips inside are buttons, and buttons
                        // cannot nest. The day-opening button fills the
                        // space above them instead.
                        const cell = (
                            <div
                                className={`calendar-day ${isCurrentMonth ? '' : 'muted'} ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''} ${bookedLevelClass(booked.length)}`}
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
                                            <DraggableEntry
                                                key={entry.key}
                                                id={`month-${dayKey}-${entry.key}`}
                                                fromDate={dayKey}
                                                entry={entry}
                                            >
                                                <button
                                                    type="button"
                                                    className={`calendar-day-chip ${activeMembers(entry).length === 0 ? 'cancelled' : ''}`}
                                                    onClick={() =>
                                                        openDay(
                                                            dayKey,
                                                            entry.key
                                                        )
                                                    }
                                                    aria-label={`Class ${index + 1} on ${day.toDateString()}: ${entry.lead.time} ${entryTitle(entry)}, ${entry.lead.subject}${activeMembers(entry).length === 0 ? ' (cancelled)' : ''}`}
                                                >
                                                    {index + 1}
                                                    {entry.isGroup && (
                                                        <span className="chip-group-size">
                                                            ×
                                                            {
                                                                entry.sessions
                                                                    .length
                                                            }
                                                        </span>
                                                    )}
                                                </button>
                                            </DraggableEntry>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )

                        // Nothing on: no tooltip to open.
                        if (dayEntries.length === 0) {
                            return (
                                <DroppableDay
                                    key={`${dayKey}-${day.getMonth()}`}
                                    dayKey={dayKey}
                                >
                                    {cell}
                                </DroppableDay>
                            )
                        }

                        return (
                          <DroppableDay
                              key={`${dayKey}-${day.getMonth()}`}
                              dayKey={dayKey}
                          >
                            <Tooltip
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
                          </DroppableDay>
                        )
                    })}
                </div>
                )}
              </DndContext>
            </div>

            <Dialog
                open={moveTarget !== null}
                onClose={() => setMoveTarget(null)}
                maxWidth="xs"
            >
                {moveTarget && (
                    <>
                        <DialogTitle>
                            {moveTarget.entry.isGroup
                                ? 'Move this class for everyone?'
                                : 'Move this class?'}
                        </DialogTitle>
                        <DialogContent>
                            <p className="session-summary-meta">
                                {`${moveTarget.entry.lead.time} • ${entryTitle(moveTarget.entry)} • ${moveTarget.entry.lead.subject}`}
                            </p>
                            <p>
                                {`Moves to ${formatDayLabel(moveTarget.toDate)} — same time, same details.`}
                            </p>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setMoveTarget(null)}>
                                Keep
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    onEditClass(
                                        moveTarget.entry.lead.id,
                                        { date: moveTarget.toDate },
                                        moveTarget.entry.isGroup
                                    )
                                    setMoveTarget(null)
                                }}
                            >
                                Move
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </section>
    )
}
