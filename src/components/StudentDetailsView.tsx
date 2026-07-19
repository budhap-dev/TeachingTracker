import { Fragment, useState } from 'react'
import {
    Autocomplete,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Slider,
    TextField,
    Typography,
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import CloseIcon from '@mui/icons-material/Close'
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
    durationOptions,
    formatDuration,
    formatShortDayLabel,
    toDateKey,
} from '../utils/calendar'
import { parseSubjects } from '../utils/forms'
import type { EditClassChanges } from '../store/store'

type StudentDetailsViewProps = {
    student: Student
    /** The whole roster — used to name a group class's other members. */
    students: Student[]
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
    /** Opens another student's page — the classmate links in a group class. */
    onOpenStudentPage: (studentId: number) => void
    /** Archives the student to Alumni with a closing note (REQ-013). */
    onArchive: (id: number, notes: string) => void
    /** Returns an alumnus to the active roster. */
    onRestore: (id: number) => void
    /** Saves edits to a single upcoming class, in place on the student page. */
    onEditSession: (
        id: number,
        changes: EditClassChanges,
        applyToGroup: boolean
    ) => void
    /** Cancels (removes) a single upcoming class. */
    onCancelSession: (session: ScheduledSession) => void
    /** Adds a student to a class (solo → group). */
    onAddMember: (sessionId: number, studentId: number) => void
    /** Removes a member — cancels that member's row in the group. */
    onRemoveMember: (memberSessionId: number) => void
}

const modeOptions: Student['mode'][] = ['Face to Face', 'Online', 'Both']


export const StudentDetailsView = ({
    student,
    students,
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
    onOpenStudentPage,
    onArchive,
    onRestore,
    onEditSession,
    onCancelSession,
    onAddMember,
    onRemoveMember,
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

    // Archiving (REQ-013): allowed any time. Any class still to come is
    // cancelled as part of archiving (the API does it) — the dialog warns
    // how many, so it's never a surprise.
    const [archiveOpen, setArchiveOpen] = useState(false)
    const [archiveNote, setArchiveNote] = useState('')
    // The upcoming class the "remove this class?" dialog is about to cancel.
    const [cancelTarget, setCancelTarget] = useState<ScheduledSession | null>(
        null
    )
    // The class being edited in place, and the form behind its dialog.
    const [editTarget, setEditTarget] = useState<ScheduledSession | null>(null)
    const [editForm, setEditForm] = useState({
        subject: '',
        time: '',
        durationMinutes: 60,
        notes: '',
    })
    const openEditSession = (session: ScheduledSession) => {
        setEditForm({
            subject: session.subject,
            time: session.time,
            durationMinutes: session.durationMinutes ?? 60,
            notes: session.notes,
        })
        setEditTarget(session)
    }

    // The class being edited, read live from state so add/remove reflect at
    // once. A solo class is a group of one until someone joins.
    const editingSession = editTarget
        ? scheduledSessions.find((s) => s.id === editTarget.id)
        : undefined
    const editGroupMembers = editingSession
        ? (editingSession.groupId
              ? scheduledSessions.filter(
                    (s) => s.groupId === editingSession.groupId
                )
              : [editingSession]
          ).filter((s) => s.status !== 'Cancelled')
        : []
    const memberIds = new Set(editGroupMembers.map((s) => s.studentId))
    const addableStudents = students.filter((s) => !memberIds.has(s.id))
    const futureClassCount = scheduledSessions.filter(
        (session) =>
            session.studentId === student.id &&
            session.status !== 'Cancelled' &&
            session.date > todayKey
    ).length
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

    /**
     * The other active members of a class — named from the live roster (the
     * session copy can be stale), so the teacher sees who this student studies
     * alongside. Empty for a solo class, or a group whose others all cancelled
     * (which is then effectively 1:1). `onRoster` gates the link: an off-roster
     * name has no page to open.
     */
    const studentsById = new Map(students.map((s) => [s.id, s]))
    const classmatesOf = (
        session: ScheduledSession
    ): { id: number; name: string; onRoster: boolean }[] => {
        if (!session.groupId) {
            return []
        }
        return scheduledSessions
            .filter(
                (row) =>
                    row.groupId === session.groupId &&
                    row.studentId !== student.id &&
                    row.status !== 'Cancelled'
            )
            .map((row) => {
                const mate = studentsById.get(row.studentId)
                return {
                    id: row.studentId,
                    name: mate
                        ? `${mate.firstName} ${mate.lastName}`
                        : row.studentName,
                    onRoster: Boolean(mate),
                }
            })
            .sort((a, b) => a.name.localeCompare(b.name))
    }

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
                    <div className="student-page-actions">
                        {!isEditing ? (
                            <Button
                                variant="outlined"
                                onClick={() => onBeginEdit(student)}
                            >
                                Edit
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="contained"
                                    disabled={!hasUnsavedChanges || saving}
                                    onClick={onSaveDetails}
                                >
                                    {saving ? 'Saving…' : 'Save'}
                                </Button>
                                <Button
                                    variant="text"
                                    onClick={onCancelEdit}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                            </>
                        )}
                        {!student.isArchived && (
                            <Button
                                variant="outlined"
                                color="error"
                                disabled={!isEditing || saving}
                                title={
                                    isEditing
                                        ? undefined
                                        : 'Edit the student to archive them.'
                                }
                                onClick={() => {
                                    setArchiveNote('')
                                    setArchiveOpen(true)
                                }}
                            >
                                Archive
                            </Button>
                        )}
                        <Button variant="text" onClick={onBack}>
                            Back
                        </Button>
                    </div>
                </div>

                {student.isArchived && (
                    <div className="archived-banner">
                        <div>
                            <strong>Archived</strong>
                            {student.archivedOn &&
                                ` on ${student.archivedOn}`}
                            {student.archiveNotes && (
                                <p>{student.archiveNotes}</p>
                            )}
                        </div>
                        <Button
                            variant="contained"
                            disabled={saving}
                            onClick={() => onRestore(student.id)}
                        >
                            Restore to active
                        </Button>
                    </div>
                )}

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
                                                <th>With</th>
                                                <th aria-label="Actions" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visibleSessions.map((session) => {
                                                const duration =
                                                    formatDuration(
                                                        session.durationMinutes
                                                    )
                                                const mates =
                                                    classmatesOf(session)
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
                                                        <td
                                                            className={
                                                                mates.length
                                                                    ? 'session-with-group'
                                                                    : undefined
                                                            }
                                                            title={
                                                                mates.length
                                                                    ? `Group class with ${mates.map((m) => m.name).join(', ')}`
                                                                    : 'One to one'
                                                            }
                                                        >
                                                            {mates.length === 0
                                                                ? '1:1'
                                                                : mates.map(
                                                                      (
                                                                          mate,
                                                                          index
                                                                      ) => (
                                                                          <Fragment
                                                                              key={
                                                                                  mate.id
                                                                              }
                                                                          >
                                                                              {index >
                                                                                  0 &&
                                                                                  ', '}
                                                                              {mate.onRoster ? (
                                                                                  <a
                                                                                      href={`#student-${mate.id}`}
                                                                                      className="student-link"
                                                                                      onClick={(
                                                                                          event
                                                                                      ) => {
                                                                                          event.preventDefault()
                                                                                          onOpenStudentPage(
                                                                                              mate.id
                                                                                          )
                                                                                      }}
                                                                                  >
                                                                                      {
                                                                                          mate.name
                                                                                      }
                                                                                  </a>
                                                                              ) : (
                                                                                  mate.name
                                                                              )}
                                                                          </Fragment>
                                                                      )
                                                                  )}
                                                        </td>
                                                        <td className="session-actions">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                aria-label={`Edit ${session.subject} on ${formatShortDayLabel(session.date)}`}
                                                                onClick={() =>
                                                                    openEditSession(
                                                                        session
                                                                    )
                                                                }
                                                            >
                                                                <EditOutlinedIcon fontSize="inherit" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                aria-label={`Remove ${session.subject} on ${formatShortDayLabel(session.date)}`}
                                                                onClick={() =>
                                                                    setCancelTarget(
                                                                        session
                                                                    )
                                                                }
                                                            >
                                                                <CloseIcon fontSize="inherit" />
                                                            </IconButton>
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

            <Dialog
                open={Boolean(editTarget)}
                onClose={() => setEditTarget(null)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>
                    Edit class
                    {editTarget && ` — ${formatShortDayLabel(editTarget.date)}`}
                </DialogTitle>
                <DialogContent>
                    <div className="session-edit-form">
                        <TextField
                            label="Subject"
                            size="small"
                            value={editForm.subject}
                            onChange={(event) =>
                                setEditForm((form) => ({
                                    ...form,
                                    subject: event.target.value,
                                }))
                            }
                            fullWidth
                        />
                        <TextField
                            label="Time"
                            size="small"
                            type="time"
                            value={editForm.time}
                            onChange={(event) =>
                                setEditForm((form) => ({
                                    ...form,
                                    time: event.target.value,
                                }))
                            }
                            slotProps={{ inputLabel: { shrink: true } }}
                            fullWidth
                        />
                        <TextField
                            label="Duration"
                            size="small"
                            select
                            value={editForm.durationMinutes}
                            onChange={(event) =>
                                setEditForm((form) => ({
                                    ...form,
                                    durationMinutes: Number(event.target.value),
                                }))
                            }
                            fullWidth
                        >
                            {durationOptions.map((minutes) => (
                                <MenuItem key={minutes} value={minutes}>
                                    {formatDuration(minutes)}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Notes"
                            size="small"
                            multiline
                            minRows={2}
                            value={editForm.notes}
                            onChange={(event) =>
                                setEditForm((form) => ({
                                    ...form,
                                    notes: event.target.value,
                                }))
                            }
                            fullWidth
                        />
                        {editingSession?.groupId && (
                            <p className="archive-dialog-copy">
                                Group class — this edit (subject, time and
                                duration) applies to everyone in it.
                            </p>
                        )}

                        <div className="session-members">
                            <Typography variant="caption">
                                Students in this class
                            </Typography>
                            <div className="session-member-chips">
                                {editGroupMembers.map((member) => (
                                    <Chip
                                        key={member.id}
                                        size="small"
                                        label={member.studentName}
                                        // A class needs at least one student —
                                        // the last one can't be removed here.
                                        onDelete={
                                            editGroupMembers.length > 1
                                                ? () =>
                                                      onRemoveMember(member.id)
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                            <Autocomplete
                                options={addableStudents}
                                value={null}
                                blurOnSelect
                                clearOnBlur
                                disablePortal
                                getOptionLabel={(option) =>
                                    `${option.firstName} ${option.lastName}`
                                }
                                // The dialog only renders with a target set, and
                                // a null-controlled picker fires onChange solely
                                // on selection — so both are always present.
                                onChange={(_event, picked) =>
                                    onAddMember(editTarget!.id, picked!.id)
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        label="Add a student"
                                    />
                                )}
                            />
                        </div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditTarget(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={
                            !editForm.subject.trim() ||
                            !editForm.time ||
                            saving
                        }
                        onClick={() => {
                            // Only reachable while the dialog is open (target set).
                            onEditSession(
                                editTarget!.id,
                                {
                                    subject: editForm.subject.trim(),
                                    time: editForm.time,
                                    durationMinutes: editForm.durationMinutes,
                                    notes: editForm.notes,
                                },
                                Boolean(editTarget!.groupId)
                            )
                            setEditTarget(null)
                        }}
                    >
                        Save changes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={Boolean(cancelTarget)}
                onClose={() => setCancelTarget(null)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Remove this class?</DialogTitle>
                <DialogContent>
                    <p className="archive-dialog-copy">
                        {cancelTarget &&
                            `${formatShortDayLabel(cancelTarget.date)} · ${cancelTarget.time} · ${cancelTarget.subject}`}{' '}
                        will be cancelled. You can rebook it from the planner.
                    </p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelTarget(null)}>Keep</Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={saving}
                        onClick={() => {
                            // Only reachable while the dialog is open (target set).
                            onCancelSession(cancelTarget!)
                            setCancelTarget(null)
                        }}
                    >
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={archiveOpen}
                onClose={() => setArchiveOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>
                    Archive {student.firstName} {student.lastName}?
                </DialogTitle>
                <DialogContent>
                    <p className="archive-dialog-copy">
                        They&apos;ll move to Alumni and leave the active
                        roster — their history stays.
                        {futureClassCount > 0 && (
                            <>
                                {' '}
                                Their{' '}
                                <strong>
                                    {futureClassCount} upcoming{' '}
                                    {futureClassCount === 1
                                        ? 'class'
                                        : 'classes'}
                                </strong>{' '}
                                will be cancelled.
                            </>
                        )}{' '}
                        Add a closing note.
                    </p>
                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        minRows={2}
                        label="Closing note"
                        value={archiveNote}
                        onChange={(event) =>
                            setArchiveNote(event.target.value)
                        }
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setArchiveOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={!archiveNote.trim() || saving}
                        onClick={() => {
                            onArchive(student.id, archiveNote.trim())
                            setArchiveOpen(false)
                        }}
                    >
                        Archive
                    </Button>
                </DialogActions>
            </Dialog>
        </section>
    )
}
