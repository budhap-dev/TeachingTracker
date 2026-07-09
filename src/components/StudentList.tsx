import { Button, Slider, TextField, Typography } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import type { Student } from '../data/students';

type StudentListProps = {
  students: Student[];
  expandedStudentId: number | null;
  editingStudentId: number | null;
  draftStudent: Partial<Student> | null;
  hasUnsavedChanges: boolean;
  onOpenDetails: (studentId: number) => void;
  onBeginEdit: (student: Student) => void;
  onDraftChange: (field: keyof Pick<Student, 'parentName' | 'contactNumber' | 'address' | 'notes'>, value: string) => void;
  onSaveDetails: (studentId: number) => void;
  onCancelEdit: () => void;
  onProgressChange: (studentId: number, value: number) => void;
};

const yearGroupColors: Record<string, { header: string; accent: string }> = {
  '8': { header: '#2563eb', accent: '#dbeafe' },
  '9': { header: '#7c3aed', accent: '#ede9fe' },
  '10': { header: '#0f766e', accent: '#ccfbf1' },
  '11': { header: '#b45309', accent: '#ffedd5' },
  '12': { header: '#dc2626', accent: '#fee2e2' },
  Unassigned: { header: '#475569', accent: '#e2e8f0' },
};

export const StudentList = ({ students, expandedStudentId, editingStudentId, draftStudent, hasUnsavedChanges, onOpenDetails, onBeginEdit, onDraftChange, onSaveDetails, onCancelEdit, onProgressChange }: StudentListProps) => {
  const groupedStudents = students.reduce<Record<string, Student[]>>((acc, student) => {
    const year = student.year || 'Unassigned';
    acc[year] = [...(acc[year] || []), student];
    return acc;
  }, {});

  return (
    <div className="student-list">
      {Object.entries(groupedStudents).sort(([a], [b]) => Number(b) - Number(a)).map(([year, yearStudents]) => {
        const groupStyle = yearGroupColors[year] || yearGroupColors.Unassigned;
        return (
        <div key={year} className="year-group" style={{ backgroundColor: groupStyle.accent, borderRadius: 16, padding: 12 }}>
          <h4 className="year-group-header" style={{ backgroundColor: groupStyle.header, color: '#fff' }}>Year {year}</h4>
          {yearStudents.map((student) => {
            const isExpanded = expandedStudentId === student.id;
            return (
              <div key={student.id} className="student-item">
                <button className="student-summary" onClick={() => onOpenDetails(student.id)}>
                  <span>
                    <strong>{student.firstName} {student.lastName}</strong>
                    <small>{student.subject} • {student.school}</small>
                  </span>
                  <span className="student-summary-meta">
                    <span>{student.studentId}</span>
                    <ExpandMoreIcon className={isExpanded ? 'rotated' : ''} />
                  </span>
                </button>
                {isExpanded && (
                  <div className="student-details">
                    <div className="student-meta">
                      <Typography variant="body2">Progress</Typography>
                      <Slider value={student.progress} onChange={(_, value) => onProgressChange(student.id, Number(value))} aria-label="Progress" valueLabelDisplay="auto" />
                      <span className="mode-pill">Mode: {student.mode}</span>
                    </div>
                    <div className="student-detail-text">
                      <p><strong>Date of birth:</strong> {student.dob || 'Not provided'}</p>
                      <p><strong>Parent:</strong> {student.parentName || 'Not provided'}</p>
                      <p><strong>Contact:</strong> {student.contactNumber || 'Not provided'}</p>
                      <p><strong>Address:</strong> {student.address || 'Not provided'}</p>
                      <p><strong>Notes:</strong> {student.notes || 'No notes added yet.'}</p>
                      {editingStudentId !== student.id ? (
                        <Button size="small" variant="outlined" onClick={() => onBeginEdit(student)}>Edit</Button>
                      ) : (
                        <div className="edit-actions">
                          <Button size="small" variant="contained" disabled={!hasUnsavedChanges} onClick={() => onSaveDetails(student.id)}>Save</Button>
                          <Button size="small" variant="text" onClick={onCancelEdit}>Cancel</Button>
                        </div>
                      )}
                      <div className="edit-fields">
                        <TextField label="Parent Name" size="small" value={draftStudent?.parentName ?? student.parentName ?? ''} onChange={(event) => onDraftChange('parentName', event.target.value)} fullWidth disabled={editingStudentId !== student.id} />
                        <TextField label="Contact Number" size="small" value={draftStudent?.contactNumber ?? student.contactNumber ?? ''} onChange={(event) => onDraftChange('contactNumber', event.target.value)} fullWidth disabled={editingStudentId !== student.id} />
                        <TextField label="Address" size="small" multiline minRows={2} value={draftStudent?.address ?? student.address ?? ''} onChange={(event) => onDraftChange('address', event.target.value)} fullWidth disabled={editingStudentId !== student.id} />
                        <TextField label="Notes" size="small" multiline minRows={2} value={draftStudent?.notes ?? student.notes ?? ''} onChange={(event) => onDraftChange('notes', event.target.value)} fullWidth disabled={editingStudentId !== student.id} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        );
      })}
    </div>
  );
};
