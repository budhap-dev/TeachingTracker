import { useState } from 'react'
import {
    Button,
    Chip,
    MenuItem,
    Slider,
    TextField,
    Typography,
} from '@mui/material'
import type {
    EditableStudentField,
    ScheduledSession,
    Student,
} from '../data/students'
import {
    studyModeLabel,
    subjectOptions,
    yearOptions,
} from '../utils/constants'
import {
    formatDuration,
    formatShortDayLabel,
    toDateKey,
} from '../utils/calendar'
import { parseSubjects } from '../utils/forms'

type StudentDetailsViewProps = {
    student: Student
    scheduledSessions: ScheduledSession[]
    editingStudentId: number | null
    draftStudent: Student | null
    hasUnsavedChanges: boolean
    saving: boolean
    onBack: () => void
    onBeginEdit: (student: Student) => void
    onDraftChange: (
        field: EditableStudentField,
        value: string | number | string[] | Record<string, number>
    ) => void
    onSaveDetails: () => void
    onCancelEdit: () => void
}

const modeOptions: Student['mode'][] = ['Face to Face', 'Online', 'Both']


export const StudentDetailsView = ({
    student,
    scheduledSessions,
    editingStudentId,
    draftStudent,
    hasUnsavedChanges,
    saving,
    onBack,
    onBeginEdit,
    onDraftChange,
    onSaveDetails,
    onCancelEdit,
}: StudentDetailsViewProps) => {
    const isEditing = editingStudentId === student.id
    // While editing, every control reads from the draft; otherwise from the
    // stored student. One source at a time, so the two can't disagree.
    const shown = isEditing && draftStudent ? draftStudent : student

    // Per-subject progress (REQ-014). The blended figure shown up top is
    // derived from the map when one exists; the API maintains the stored
    // value on save, so older map-less records keep their single number.
    const progressMap = shown.progressBySubject
    const mapValues = progressMap ? Object.values(progressMap) : []
    const overallProgress = mapValues.length
        ? Math.round(
              mapValues.reduce((sum, value) => sum + value, 0) /
                  mapValues.length
          )
        : shown.progress

    /** Subjects edits keep the map in step: keep known values, seed a new
        subject at the current overall, drop entries for removed subjects. */
    const applySubjects = (nextSubjects: string[]) => {
        onDraftChange('subjects', nextSubjects)
        if (progressMap) {
            onDraftChange(
                'progressBySubject',
                Object.fromEntries(
                    nextSubjects.map((subject) => [
                        subject,
                        progressMap[subject] ?? overallProgress,
                    ])
                )
            )
        }
    }

    // Upcoming only, soonest first — with a weekly timetable the full history
    // runs to dozens of rows and says nothing about what is next.
    const [showAllSessions, setShowAllSessions] = useState(false)
    const todayKey = toDateKey(new Date())
    const upcomingSessions = scheduledSessions
        .filter(
            (session) =>
                session.studentId === student.id &&
                session.date >= todayKey &&
                session.status !== 'Cancelled'
        )
        .sort((left, right) =>
            `${left.date} ${left.time}`.localeCompare(
                `${right.date} ${right.time}`
            )
        )
    const visibleSessions = showAllSessions
        ? upcomingSessions
        : upcomingSessions.slice(0, 3)

    return (
        <section className="content-stack student-page">
            <div className="card">
                <div className="section-header">
                    <div>
                        <h3>
                            {student.firstName} {student.lastName}
                        </h3>
                        <p>
                            {student.studentId} • Year{' '}
                            {student.year || 'Unassigned'}
                        </p>
                    </div>
                    <Button variant="text" onClick={onBack}>
                        Back to students
                    </Button>
                </div>

                <div className="student-details student-page-details">
                    <div className="student-side">
                        <div className="student-meta">
                        <div className="meta-top">
                            <Typography variant="body2">Progress</Typography>
                            <strong className="progress-value">
                                {overallProgress}%
                            </strong>
                        </div>
                        {progressMap ? (
                            <div className="subject-progress-list">
                                {shown.subjects.map((subject) => {
                                    const value =
                                        progressMap[subject] ?? overallProgress
                                    return (
                                        <div
                                            key={subject}
                                            className="subject-progress-row"
                                        >
                                            <span className="subject-progress-label">
                                                {subject}
                                            </span>
                                            {isEditing ? (
                                                <Slider
                                                    size="small"
                                                    value={value}
                                                    onChange={(_, next) =>
                                                        onDraftChange(
                                                            'progressBySubject',
                                                            {
                                                                ...progressMap,
                                                                [subject]:
                                                                    Number(
                                                                        next
                                                                    ),
                                                            }
                                                        )
                                                    }
                                                    aria-label={`${subject} progress`}
                                                    valueLabelDisplay="auto"
                                                />
                                            ) : (
                                                <div
                                                    className="subject-progress-track"
                                                    role="progressbar"
                                                    aria-label={`${subject} progress`}
                                                    aria-valuenow={value}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                >
                                                    <span
                                                        className="subject-progress-fill"
                                                        style={{
                                                            width: `${value}%`,
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <span className="subject-progress-value">
                                                {value}%
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <>
                                <Slider
                                    value={shown.progress}
                                    onChange={(_, value) =>
                                        onDraftChange(
                                            'progress',
                                            Number(value)
                                        )
                                    }
                                    aria-label="Progress"
                                    valueLabelDisplay="auto"
                                    disabled={!isEditing}
                                />
                                {isEditing && shown.subjects.length > 0 && (
                                    <Button
                                        size="small"
                                        variant="text"
                                        onClick={() =>
                                            onDraftChange(
                                                'progressBySubject',
                                                Object.fromEntries(
                                                    shown.subjects.map(
                                                        (subject) => [
                                                            subject,
                                                            shown.progress,
                                                        ]
                                                    )
                                                )
                                            )
                                        }
                                    >
                                        Track per subject
                                    </Button>
                                )}
                            </>
                        )}
                        <div className="meta-pills">
                            <span className="mode-pill">
                                Study mode:{' '}
                                {studyModeLabel(shown.mode)}
                            </span>
                            <span className="subject-count-pill">
                                Subjects: {shown.subjects.length}
                            </span>
                            <span className="fees-pill">
                                Fees: £{shown.fees}/session
                            </span>
                        </div>
                        <p className="subjects-line">
                            <strong>Subjects:</strong>{' '}
                            {shown.subjects.join(', ') || 'None selected'}
                        </p>
                        <p className="school-line">
                            <strong>School:</strong>{' '}
                            {shown.school || 'Not provided'}
                        </p>
                        </div>

                        <div className="student-session-summary">
                            <h4>Upcoming sessions</h4>
                            {upcomingSessions.length === 0 ? (
                                <p>No classes scheduled yet.</p>
                            ) : (
                                <>
                                    <table className="session-mini-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Time</th>
                                                <th>Subject</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visibleSessions.map((session) => {
                                                const duration =
                                                    formatDuration(
                                                        session.durationMinutes
                                                    )
                                                return (
                                                    <tr key={session.id}>
                                                        <td>
                                                            {formatShortDayLabel(
                                                                session.date
                                                            )}
                                                        </td>
                                                        <td>
                                                            {session.time}
                                                            {duration && (
                                                                <small>
                                                                    {duration}
                                                                </small>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {session.subject}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                    {upcomingSessions.length > 3 && (
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() =>
                                                setShowAllSessions(
                                                    (current) => !current
                                                )
                                            }
                                        >
                                            {showAllSessions
                                                ? 'Show fewer'
                                                : `Show all ${upcomingSessions.length}`}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="student-detail-text">
                        <div className="detail-grid">
                            <p>
                                <strong>Date of birth:</strong>{' '}
                                {shown.dob || 'Not provided'}
                            </p>
                            <p>
                                <strong>Parent:</strong>{' '}
                                {shown.parentName || 'Not provided'}
                            </p>
                            <p>
                                <strong>Contact:</strong>{' '}
                                {shown.contactNumber || 'Not provided'}
                            </p>
                            <p className="detail-grid-full">
                                <strong>Address:</strong>{' '}
                                {shown.address || 'Not provided'}
                            </p>
                            <p className="detail-grid-full">
                                <strong>Notes:</strong>{' '}
                                {shown.notes || 'No notes added yet.'}
                            </p>
                        </div>

                        {!isEditing ? (
                            <Button
                                size="small"
                                variant="outlined"
                                className="edit-button"
                                onClick={() => onBeginEdit(student)}
                            >
                                Edit
                            </Button>
                        ) : (
                            <div className="edit-actions">
                                <Button
                                    size="small"
                                    variant="contained"
                                    disabled={!hasUnsavedChanges || saving}
                                    onClick={onSaveDetails}
                                >
                                    {saving ? 'Saving…' : 'Save'}
                                </Button>
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={onCancelEdit}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}

                        <div className="edit-fields">
                            <TextField
                                label="First Name"
                                size="small"
                                value={shown.firstName}
                                onChange={(event) =>
                                    onDraftChange('firstName', event.target.value)
                                }
                                fullWidth
                                disabled={!isEditing}
                            />
                            <TextField
                                label="Last Name"
                                size="small"
                                value={shown.lastName}
                                onChange={(event) =>
                                    onDraftChange('lastName', event.target.value)
                                }
                                fullWidth
                                disabled={!isEditing}
                            />
                            <TextField
                                label="Date of Birth"
                                size="small"
                                type="date"
                                value={shown.dob}
                                onChange={(event) =>
                                    onDraftChange('dob', event.target.value)
                                }
                                fullWidth
                                disabled={!isEditing}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            {/* Same TextField idiom as every neighbour, so
                                the pair-grid rows line up — the old bare
                                caption+Select sat lower than its partner. */}
                            <TextField
                                label="Subjects"
                                size="small"
                                select
                                value={shown.subjects}
                                onChange={(event) =>
                                    applySubjects(
                                        parseSubjects(event.target.value)
                                    )
                                }
                                fullWidth
                                disabled={!isEditing}
                                slotProps={{
                                    select: {
                                        multiple: true,
                                        renderValue: (selected) => (
                                            <div className="subject-chips">
                                                {(selected as string[]).map(
                                                    (subject) => (
                                                        <Chip
                                                            key={subject}
                                                            label={subject}
                                                            size="small"
                                                            // ✕ removes just
                                                            // this subject —
                                                            // without opening
                                                            // the menu.
                                                            onDelete={
                                                                isEditing
                                                                    ? () =>
                                                                          applySubjects(
                                                                              shown.subjects.filter(
                                                                                  (
                                                                                      kept
                                                                                  ) =>
                                                                                      kept !==
                                                                                      subject
                                                                              )
                                                                          )
                                                                    : undefined
                                                            }
                                                            onMouseDown={(
                                                                event
                                                            ) =>
                                                                event.stopPropagation()
                                                            }
                                                        />
                                                    )
                                                )}
                                            </div>
                                        ),
                                    },
                                }}
                            >
                                {subjectOptions.map((subject) => (
                                    <MenuItem key={subject} value={subject}>
                                        {subject}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="School"
                                size="small"
                                value={shown.school}
                                onChange={(event) =>
                                    onDraftChange('school', event.target.value)
                                }
                                fullWidth
                                disabled={!isEditing}
                            />
                            <TextField
                                label="Year"
                                size="small"
                                select
                                value={shown.year}
                                onChange={(event) =>
                                    onDraftChange('year', event.target.value)
                                }
                                fullWidth
                                disabled={!isEditing}
                            >
                                {yearOptions.map((year) => (
                                    <MenuItem key={year} value={year}>
                                        {year}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Study mode"
                                size="small"
                                select
                                value={shown.mode}
                                onChange={(event) =>
                                    onDraftChange('mode', event.target.value)
                                }
                                fullWidth
                                disabled={!isEditing}
                            >
                                {modeOptions.map((mode) => (
                                    <MenuItem key={mode} value={mode}>
                                        {studyModeLabel(mode)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Fee per session (£)"
                                size="small"
                                type="number"
                                value={shown.fees}
                                onChange={(event) =>
                                    onDraftChange(
                                        'fees',
                                        Number(event.target.value)
                                    )
                                }
                                fullWidth
                                disabled={!isEditing}
                            />
                            <TextField
                                label="Parent Name"
                                size="small"
                                value={shown.parentName}
                                onChange={(event) =>
                                    onDraftChange(
                                        'parentName',
                                        event.target.value
                                    )
                                }
                                fullWidth
                                disabled={!isEditing}
                            />
                            <TextField
                                label="Contact Number"
                                size="small"
                                value={shown.contactNumber}
                                onChange={(event) =>
                                    onDraftChange(
                                        'contactNumber',
                                        event.target.value
                                    )
                                }
                                fullWidth
                                disabled={!isEditing}
                            />
                            <TextField
                                label="Address"
                                size="small"
                                className="edit-span-2"
                                multiline
                                minRows={2}
                                value={shown.address}
                                onChange={(event) =>
                                    onDraftChange('address', event.target.value)
                                }
                                fullWidth
                                disabled={!isEditing}
                            />
                            <TextField
                                label="Notes"
                                size="small"
                                className="edit-span-2"
                                multiline
                                minRows={2}
                                value={shown.notes}
                                onChange={(event) =>
                                    onDraftChange('notes', event.target.value)
                                }
                                fullWidth
                                disabled={!isEditing}
                            />
                        </div>

                    </div>
                </div>
            </div>
        </section>
    )
}
