import { Button } from '@mui/material';
import type { Student } from '../data/students';
import { StudentFormModal } from './StudentFormModal';
import { StudentList } from './StudentList';

type StudentsViewProps = {
  students: Student[];
  loading: boolean;
  isModalOpen: boolean;
  expandedStudentId: number | null;
  editingStudentId: number | null;
  draftStudent: Partial<Student> | null;
  hasUnsavedChanges: boolean;
  form: Omit<Student, 'id'>;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onFormChange: (field: keyof Omit<Student, 'id'>, value: string | number) => void;
  onSubmit: (event: React.FormEvent) => void;
  onOpenDetails: (studentId: number) => void;
  onBeginEdit: (student: Student) => void;
  onDraftChange: (field: keyof Pick<Student, 'parentName' | 'contactNumber' | 'address' | 'notes'>, value: string) => void;
  onSaveDetails: (studentId: number) => void;
  onCancelEdit: () => void;
  onProgressChange: (studentId: number, value: number) => void;
};

export const StudentsView = ({ students, loading, isModalOpen, expandedStudentId, editingStudentId, draftStudent, hasUnsavedChanges, form, onOpenModal, onCloseModal, onFormChange, onSubmit, onOpenDetails, onBeginEdit, onDraftChange, onSaveDetails, onCancelEdit, onProgressChange }: StudentsViewProps) => (
  <section className="content-stack">
    <div className="card">
      <div className="section-header">
        <div>
          <h3>View students</h3>
          <p>Browse students by year and expand any record for details.</p>
        </div>
        <Button variant="contained" onClick={onOpenModal}>Add new student</Button>
      </div>
      {loading && <p>Loading students from the API…</p>}
      <StudentList
        students={students}
        expandedStudentId={expandedStudentId}
        editingStudentId={editingStudentId}
        draftStudent={draftStudent}
        hasUnsavedChanges={hasUnsavedChanges}
        onOpenDetails={onOpenDetails}
        onBeginEdit={onBeginEdit}
        onDraftChange={onDraftChange}
        onSaveDetails={onSaveDetails}
        onCancelEdit={onCancelEdit}
        onProgressChange={onProgressChange}
      />
    </div>

    <StudentFormModal open={isModalOpen} form={form} onClose={onCloseModal} onChange={onFormChange} onSubmit={onSubmit} />
  </section>
);
