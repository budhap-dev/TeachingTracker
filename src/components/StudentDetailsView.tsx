import {
    Button,
    Chip,
    MenuItem,
    Select,
    Slider,
    TextField,
    Typography,
} from '@mui/material'
import type {
    EditableStudentField,
    ScheduledSession,
    Student,
} from '../data/students'
import { subjectOptions, yearOptions } from '../utils/constants'
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
        value: string | number | string[]
    ) => void
    onSaveDetails: () => void
    onCancelEdit: () => void
}

const modeOptions: Student['mode'][] = ['Face to Face', 'Online']


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
    const studentSessions = scheduledSessions.filter(
        (session) => session.studentId === student.id
    )

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
                    <div className="student-meta">
                        <div className="meta-top">
                            <Typography variant="body2">Progress</Typography>
                            <strong className="progress-value">
                                {shown.progress}%
                            </strong>
                        </div>
                        <Slider
                            value={shown.progress}
                            onChange={(_, value) =>
                                onDraftChange('progress', Number(value))
                            }
                            aria-label="Progress"
                            valueLabelDisplay="auto"
                            disabled={!isEditing}
                        />
                        <div className="meta-pills">
                            <span className="mode-pill">
                                Mode: {shown.mode}
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
                            <div className="subjects-control">
                                <Typography variant="caption">
                                    Subjects
                                </Typography>
                                <Select
                                    multiple
                                    size="small"
                                    value={shown.subjects}
                                    onChange={(event) =>
                                        onDraftChange(
                                            'subjects',
                                            parseSubjects(event.target.value)
                                        )
                                    }
                                    disabled={!isEditing}
                                    fullWidth
                                    inputProps={{ 'aria-label': 'Subjects' }}
                                    renderValue={(selected) => (
                                        <div className="subject-chips">
                                            {(selected as string[]).map(
                                                (subject) => (
                                                    <Chip
                                                        key={subject}
                                                        label={subject}
                                                        size="small"
                                                    />
                                                )
                                            )}
                                        </div>
                                    )}
                                >
                                    {subjectOptions.map((subject) => (
                                        <MenuItem key={subject} value={subject}>
                                            {subject}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </div>
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
                                label="Mode"
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
                                        {mode}
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

                        <div className="student-session-summary">
                            <h4>Upcoming sessions</h4>
                            {studentSessions.length === 0 ? (
                                <p>No classes scheduled yet.</p>
                            ) : (
                                <ul>
                                    {studentSessions.map((session) => (
                                        <li key={session.id}>
                                            {new Date(
                                                session.date
                                            ).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}{' '}
                                            • {session.time} • {session.subject}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
