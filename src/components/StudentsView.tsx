import { Button } from '@mui/material';
import type { Student } from '../data/students';
import { StudentFormModal } from './StudentFormModal';
import { StudentList } from './StudentList';

type StudentsViewProps = {
  students: Student[];
  loading: boolean;
  isModalOpen: boolean;
  form: Omit<Student, 'id'>;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onFormChange: (field: keyof Omit<Student, 'id'>, value: string | number | string[]) => void;
  onSubmit: (event: React.FormEvent) => void;
  onOpenStudentPage: (studentId: number) => void;
};

export const StudentsView = ({ students, loading, isModalOpen, form, onOpenModal, onCloseModal, onFormChange, onSubmit, onOpenStudentPage }: StudentsViewProps) => (
  <section className="content-stack">
    <div className="card">
      <div className="section-header">
        <div>
          <h3>View students</h3>
          <p>Browse students by year and open each student page for full details.</p>
        </div>
        <Button variant="contained" onClick={onOpenModal}>Add new student</Button>
      </div>
      {loading && <p>Loading students from the API…</p>}
      <StudentList
        students={students}
        onOpenStudentPage={onOpenStudentPage}
      />
    </div>

    <StudentFormModal open={isModalOpen} form={form} onClose={onCloseModal} onChange={onFormChange} onSubmit={onSubmit} />
  </section>
);
