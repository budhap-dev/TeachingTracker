import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  subjects: overrides.subjects ?? ['Mathematics'],
  school: overrides.school ?? 'Kingston Grammar School',
  year: overrides.year ?? '10',
  progress: overrides.progress ?? 88,
  mode: overrides.mode ?? 'Face to Face',
  notes: overrides.notes ?? 'Excellent problem solving skills.',
  parentName: overrides.parentName ?? 'Nadia Patel',
  contactNumber: overrides.contactNumber ?? '+44 7700 900123',
  address: overrides.address ?? '12 Oak Road, Kingston upon Thames, KT2 6LP',
});

describe('component-level coverage', () => {
  it('renders dashboard summary data and triggers the student-management action', async () => {
    const user = userEvent.setup();
    const onManageStudents = vi.fn();

    render(
      <DashboardView
        stats={{ onlineStudents: 2, avgProgress: 82, totalStudents: 5 }}
        upcomingSessions={[
          {
            id: 'session-1',
            studentId: 1,
            date: '2026-07-11T09:00:00.000Z',
            time: '16:00',
            studentName: 'Asha Perera',
            subject: 'Mathematics',
            mode: 'Face to Face',
          },
        ]}
        onManageStudents={onManageStudents}
        onOpenStudentPage={vi.fn()}
      />
    );

    expect(screen.getByText('Today at a glance')).toBeInTheDocument();
    expect(screen.getByText('Total students')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /manage students/i }));

    expect(onManageStudents).toHaveBeenCalledTimes(1);
  });

  it('renders student link rows and emits navigation callback', async () => {
    const user = userEvent.setup();
    const onOpenStudentPage = vi.fn();

    render(
      <StudentList
        students={[buildStudent()]}
        onOpenStudentPage={onOpenStudentPage}
      />
    );

    await user.click(screen.getByRole('link', { name: /asha perera/i }));

    expect(onOpenStudentPage).toHaveBeenCalledWith(1);
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
          subjects: [],
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
    expect(screen.getByLabelText(/subjects/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save student/i })).toBeInTheDocument();
  });

  it('sorts the study snapshot table and paginates through the rows', async () => {
    const user = userEvent.setup();
    const students = Array.from({ length: 6 }, (_, index) =>
      buildStudent({
        id: index + 1,
        firstName: `Student${index + 1}`,
        lastName: 'Example',
        subjects: [index % 2 === 0 ? 'Biology' : 'Chemistry'],
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
