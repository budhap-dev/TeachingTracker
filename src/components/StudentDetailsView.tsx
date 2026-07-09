import { Button, Slider, TextField, Typography } from '@mui/material';
import type { Student } from '../data/students';

type StudentDetailsViewProps = {
  student: Student;
  editingStudentId: number | null;
  draftStudent: Partial<Student> | null;
  hasUnsavedChanges: boolean;
  onBack: () => void;
  onBeginEdit: (student: Student) => void;
  onDraftChange: (field: keyof Pick<Student, 'parentName' | 'contactNumber' | 'address' | 'notes'>, value: string) => void;
  onSaveDetails: (studentId: number) => void;
  onCancelEdit: () => void;
  onProgressChange: (studentId: number, value: number) => void;
};

export const StudentDetailsView = ({
  student,
  editingStudentId,
  draftStudent,
  hasUnsavedChanges,
  onBack,
  onBeginEdit,
  onDraftChange,
  onSaveDetails,
  onCancelEdit,
  onProgressChange,
}: StudentDetailsViewProps) => {
  const isEditing = editingStudentId === student.id;

  return (
    <section className="content-stack student-page">
      <div className="card">
        <div className="section-header">
          <div>
            <h3>{student.firstName} {student.lastName}</h3>
            <p>{student.studentId} • Year {student.year || 'Unassigned'}</p>
          </div>
          <Button variant="text" onClick={onBack}>Back to students</Button>
        </div>

        <div className="student-details student-page-details">
          <div className="student-meta">
            <div className="meta-top">
              <Typography variant="body2">Progress</Typography>
              <strong className="progress-value">{student.progress}%</strong>
            </div>
            <Slider value={student.progress} onChange={(_, value) => onProgressChange(student.id, Number(value))} aria-label="Progress" valueLabelDisplay="auto" />
            <div className="meta-pills">
              <span className="mode-pill">Mode: {student.mode}</span>
              <span className="subject-count-pill">Subjects: {student.subjects.length}</span>
            </div>
            <p className="subjects-line"><strong>Subjects:</strong> {student.subjects.join(', ')}</p>
            <p className="school-line"><strong>School:</strong> {student.school}</p>
          </div>
          <div className="student-detail-text">
            <div className="detail-grid">
              <p><strong>Date of birth:</strong> {student.dob || 'Not provided'}</p>
              <p><strong>Parent:</strong> {student.parentName || 'Not provided'}</p>
              <p><strong>Contact:</strong> {student.contactNumber || 'Not provided'}</p>
              <p className="detail-grid-full"><strong>Address:</strong> {student.address || 'Not provided'}</p>
              <p className="detail-grid-full"><strong>Notes:</strong> {student.notes || 'No notes added yet.'}</p>
            </div>
            {!isEditing ? (
              <Button size="small" variant="outlined" onClick={() => onBeginEdit(student)}>Edit</Button>
            ) : (
              <div className="edit-actions">
                <Button size="small" variant="contained" disabled={!hasUnsavedChanges} onClick={() => onSaveDetails(student.id)}>Save</Button>
                <Button size="small" variant="text" onClick={onCancelEdit}>Cancel</Button>
              </div>
            )}
            <div className="edit-fields">
              <TextField label="Parent Name" size="small" value={draftStudent?.parentName ?? student.parentName ?? ''} onChange={(event) => onDraftChange('parentName', event.target.value)} fullWidth disabled={!isEditing} />
              <TextField label="Contact Number" size="small" value={draftStudent?.contactNumber ?? student.contactNumber ?? ''} onChange={(event) => onDraftChange('contactNumber', event.target.value)} fullWidth disabled={!isEditing} />
              <TextField label="Address" size="small" multiline minRows={2} value={draftStudent?.address ?? student.address ?? ''} onChange={(event) => onDraftChange('address', event.target.value)} fullWidth disabled={!isEditing} />
              <TextField label="Notes" size="small" multiline minRows={2} value={draftStudent?.notes ?? student.notes ?? ''} onChange={(event) => onDraftChange('notes', event.target.value)} fullWidth disabled={!isEditing} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
