import { FormEvent, useMemo, useState } from 'react'
import { Autocomplete, Button, TextField } from '@mui/material'
import { activeSessions } from '../data/students'
import type { ScheduledSession, SessionStatus, Student } from '../data/students'

type ClassSchedulingViewProps = {
    students: Student[]
    sessions: ScheduledSession[]
    onOpenStudentPage: (studentId: number) => void
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

const formatDateInputValue = (date: Date) => date.toISOString().slice(0, 10)

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
    onOpenStudentPage,
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

    const [selectedStudent, setSelectedStudent] =
        useState<StudentOption | null>(studentOptions[0] ?? null)
    const [studentSearch, setStudentSearch] = useState(
        studentOptions[0]?.label ?? ''
    )
    const [subject, setSubject] = useState(studentOptions[0]?.subjects[0] ?? '')
    const [date, setDate] = useState(
        formatDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000))
    )
    const [time, setTime] = useState('16:00')
    const [notes, setNotes] = useState('')
    const [monthReference, setMonthReference] = useState(() => new Date())

    const sessionsByDate = useMemo(
        () =>
            sessions.reduce<Record<string, ScheduledSession[]>>(
                (acc, session) => {
                    acc[session.date] = [...(acc[session.date] || []), session]
                    return acc
                },
                {}
            ),
        [sessions]
    )

    const monthGrid = useMemo(
        () => getMonthGrid(monthReference),
        [monthReference]
    )
    const monthLabel = monthReference.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
    })
    const todayKey = formatDateInputValue(new Date())

    const handleStudentChange = (
        _event: unknown,
        value: StudentOption | null
    ) => {
        setSelectedStudent(value)
        setStudentSearch(value?.label ?? '')
        setSubject(value?.subjects[0] ?? '')
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        if (!selectedStudent || !subject || !date || !time) {
            return
        }

        onScheduleClass({
            studentId: selectedStudent.id,
            studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
            year: selectedStudent.year,
            subject,
            date,
            time,
            notes: notes.trim() || 'Scheduled from the class planner',
        })

        setDate(
            formatDateInputValue(new Date(Date.now() + 48 * 60 * 60 * 1000))
        )
        setTime('16:00')
        setNotes('')
    }

    const selectedStudentSessions = selectedStudent
        ? sessions.filter((session) => session.studentId === selectedStudent.id)
        : []
    const shouldOpenAutocomplete =
        studentSearch.length > 0 && studentSearch !== selectedStudent?.label

    return (
        <section className="content-stack">
            <div className="card scheduling-hero">
                <div>
                    <h3>Class scheduling</h3>
                    <p>
                        Choose a student, book the next lesson, and keep the
                        timetable visible in the dashboard.
                    </p>
                </div>
                <div className="scheduling-hero-stats">
                    <div>
                        <strong>{activeSessions(sessions).length}</strong>
                        <span>Booked classes</span>
                    </div>
                    <div>
                        <strong>{students.length}</strong>
                        <span>Students available</span>
                    </div>
                </div>
            </div>

            <div className="scheduling-layout">
                <div className="card scheduling-form-card">
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
                            label="Date"
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                        />
                        <TextField
                            label="Time"
                            type="time"
                            value={time}
                            onChange={(event) => setTime(event.target.value)}
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
                        <h4>Selected student</h4>
                        {selectedStudent ? (
                            <>
                                <p>
                                    {selectedStudent.firstName}{' '}
                                    {selectedStudent.lastName} • Year{' '}
                                    {selectedStudent.year}
                                </p>
                                <p className="session-summary-meta">
                                    {selectedStudent.subjects.join(', ')}
                                </p>
                                <ul className="session-status-list">
                                    {selectedStudentSessions
                                        .slice(0, 3)
                                        .map((session) => {
                                            const isCancelled =
                                                session.status === 'Cancelled'
                                            return (
                                                <li
                                                    key={session.id}
                                                    className={
                                                        isCancelled
                                                            ? 'cancelled'
                                                            : ''
                                                    }
                                                >
                                                    <span className="session-when">
                                                        {session.date} •{' '}
                                                        {session.time} •{' '}
                                                        {session.subject}
                                                    </span>
                                                    {isCancelled && (
                                                        <span className="session-cancelled-tag">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        className="session-status-button"
                                                        onClick={() =>
                                                            onSetSessionStatus(
                                                                session.id,
                                                                isCancelled
                                                                    ? 'Scheduled'
                                                                    : 'Cancelled'
                                                            )
                                                        }
                                                    >
                                                        {isCancelled
                                                            ? 'Restore'
                                                            : 'Cancel'}
                                                    </Button>
                                                </li>
                                            )
                                        })}
                                </ul>
                            </>
                        ) : (
                            <p>No student selected.</p>
                        )}
                    </div>
                </div>

                <div className="card scheduling-calendar-card">
                    <div className="calendar-header scheduling-calendar-header">
                        <div>
                            <h3>{monthLabel}</h3>
                            <p>
                                Booked dates are shown below. Hover a class chip
                                to see the student name.
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
                            const isCurrentMonth =
                                day.getMonth() === monthReference.getMonth()
                            const isToday = dayKey === todayKey

                            return (
                                <div
                                    key={`${dayKey}-${day.getMonth()}`}
                                    className={`calendar-day ${isCurrentMonth ? '' : 'muted'} ${isToday ? 'today' : ''}`}
                                    role="gridcell"
                                    aria-label={day.toDateString()}
                                >
                                    <div className="calendar-day-number">
                                        {day.getDate()}
                                    </div>
                                    <div className="calendar-session-list">
                                        {sessionsForDay
                                            .slice(0, 3)
                                            .map((session) => (
                                                <button
                                                    key={session.id}
                                                    type="button"
                                                    className={`calendar-session-chip ${
                                                        session.status ===
                                                        'Cancelled'
                                                            ? 'cancelled'
                                                            : ''
                                                    }`}
                                                    title={`${session.studentName} • ${session.subject}${
                                                        session.status ===
                                                        'Cancelled'
                                                            ? ' • Cancelled'
                                                            : ''
                                                    }`}
                                                    onClick={() =>
                                                        onOpenStudentPage(
                                                            session.studentId
                                                        )
                                                    }
                                                >
                                                    <span>{session.time}</span>
                                                    <small>
                                                        {session.studentName}
                                                    </small>
                                                </button>
                                            ))}
                                        {sessionsForDay.length > 3 && (
                                            <span className="calendar-session-more">
                                                +{sessionsForDay.length - 3}{' '}
                                                more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}
