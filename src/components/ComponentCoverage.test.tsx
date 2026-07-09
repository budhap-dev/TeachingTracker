import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Student } from '../data/students';
import { DashboardView } from './DashboardView';
import { PaymentsView } from './PaymentsView';
import { StudentFormModal } from './StudentFormModal';
import { StudentList } from './StudentList';

beforeEach(() => {
  window.scrollTo = vi.fn();
});

const buildStudent = (overrides: Partial<Student> = {}): Student => ({
  id: overrides.id ?? 1,
  studentId: overrides.studentId ?? 'STU-100001',
  firstName: overrides.firstName ?? 'Asha',
  lastName: overrides.lastName ?? 'Perera',
  dob: overrides.dob ?? '2011-05-14',
  subject: overrides.subject ?? 'Mathematics',
  school: overrides.school ?? 'Kingston Grammar School',
  year: overrides.year ?? '10',
  progress: overrides.progress ?? 88,
  mode: overrides.mode ?? 'Face to Face',
  notes: overrides.notes ?? 'Excellent problem solving skills.',
  parentName: overrides.parentName ?? 'Nadia Patel',
  contactNumber: overrides.contactNumber ?? '+44 7700 900123',
  address: overrides.address ?? '12 Oak Road, Kingston upon Thames, KT2 6LP',
});

const StatefulStudentList = () => {
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [draftStudent, setDraftStudent] = useState<Partial<Student> | null>(null);

  return (
    <StudentList
      students={[buildStudent()]}
      expandedStudentId={expandedStudentId}
      editingStudentId={editingStudentId}
      draftStudent={draftStudent}
      hasUnsavedChanges={false}
      onOpenDetails={(studentId) => setExpandedStudentId((current) => (current === studentId ? null : studentId))}
      onBeginEdit={(student) => {
        setEditingStudentId(student.id);
        setDraftStudent({ ...student });
      }}
      onDraftChange={vi.fn()}
      onSaveDetails={vi.fn()}
      onCancelEdit={() => {
        setEditingStudentId(null);
        setDraftStudent(null);
      }}
      onProgressChange={vi.fn()}
    />
  );
};

describe('component-level coverage', () => {
  it('renders dashboard summary data and triggers the student-management action', async () => {
    const user = userEvent.setup();
    const onManageStudents = vi.fn();

    render(
      <DashboardView
        stats={{ onlineStudents: 2, avgProgress: 82, totalStudents: 5 }}
        onManageStudents={onManageStudents}
      />
    );

    expect(screen.getByText('Today at a glance')).toBeInTheDocument();
    expect(screen.getByText('Total students')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /manage students/i }));

    expect(onManageStudents).toHaveBeenCalledTimes(1);
  });

  it('expands a student row and starts editing details', async () => {
    const user = userEvent.setup();

    render(<StatefulStudentList />);

    await user.click(screen.getByRole('button', { name: /asha perera/i }));

    expect(screen.getByText(/progress/i)).toBeInTheDocument();
    expect(screen.getByText(/mode: face to face/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
  });

  it('renders the student form modal fields', () => {
    render(
      <StudentFormModal
        open
        form={{
          studentId: '',
          firstName: '',
          lastName: '',
          dob: '',
          subject: '',
          school: '',
          year: '',
          progress: 0,
          mode: 'Face to Face',
          notes: '',
          parentName: '',
          contactNumber: '',
          address: '',
        }}
        onClose={vi.fn()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /add a new student/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save student/i })).toBeInTheDocument();
  });

  it('sorts the study snapshot table and paginates through the rows', async () => {
    const user = userEvent.setup();
    const students = Array.from({ length: 6 }, (_, index) =>
      buildStudent({
        id: index + 1,
        firstName: `Student${index + 1}`,
        lastName: 'Example',
        subject: index % 2 === 0 ? 'Biology' : 'Chemistry',
      })
    );

    render(<PaymentsView students={students} />);

    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByText('Student1 Example')).toBeInTheDocument();
    expect(screen.queryByText('Student6 Example')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /subject/i }));

    const bodyRows = screen.getAllByRole('row');
    expect(bodyRows[1]).toHaveTextContent('Biology');

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText('Student6 Example')).toBeInTheDocument();
  });
});
