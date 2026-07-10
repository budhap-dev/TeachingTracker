import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduledSession, Student } from '../data/students';
import { ClassSchedulingView } from './ClassSchedulingView';
import { DashboardView } from './DashboardView';
import { PaymentTrackerView } from './PaymentTrackerView';
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

const upcomingSessions: ScheduledSession[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'Asha Perera',
    year: '10',
    subject: 'Mathematics',
    date: '2026-07-11',
    time: '16:00',
    notes: 'Problem solving practice',
  },
];

describe('component-level coverage', () => {
  it('renders dashboard summary data and triggers the student-management action', async () => {
    const user = userEvent.setup();
    const onManageStudents = vi.fn();

    render(
      <DashboardView
        stats={{ onlineStudents: 2, faceToFaceStudents: 3, avgProgress: 82, totalStudents: 5 }}
        overviewChart={[
          { label: 'Students', value: 5 },
          { label: 'Face to Face', value: 3 },
          { label: 'Online', value: 2 },
          { label: 'Upcoming sessions', value: 4 },
        ]}
        upcomingSessions={upcomingSessions}
        onManageStudents={onManageStudents}
        onOpenStudentPage={vi.fn()}
      />
    );

    expect(screen.getByText('Today at a glance')).toBeInTheDocument();
    expect(screen.getByText('Total students')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /manage students/i }));

    expect(onManageStudents).toHaveBeenCalledTimes(1);
  });

  it('renders student link rows and emits navigation callback', async () => {
    const user = userEvent.setup();
    const onOpenStudentPage = vi.fn();

    render(<StudentList students={[buildStudent()]} onOpenStudentPage={onOpenStudentPage} />);

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

  it('renders and updates the payment tracker for a selected month', async () => {
    const user = userEvent.setup();
    const onUpdatePaymentRecord = vi.fn();
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    render(
      <PaymentTrackerView
        students={[buildStudent()]}
        paymentRecords={[
          {
            id: 1,
            studentId: 1,
            studentName: 'Asha Perera',
            month: currentMonth,
            monthlyFee: 120,
            amountPaid: 0,
            status: 'Pending',
            notes: 'Awaiting payment',
          },
        ]}
        onUpdatePaymentRecord={onUpdatePaymentRecord}
      />
    );

    expect(screen.getByRole('heading', { name: /monthly payment tracking/i })).toBeInTheDocument();
    expect(screen.getByText(/payments received/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/asha perera status/i), 'Paid');
    expect(onUpdatePaymentRecord).toHaveBeenCalledWith(expect.objectContaining({ status: 'Paid' }));

    fireEvent.change(screen.getByLabelText(/asha perera amount received/i), { target: { value: '120' } });
    expect(onUpdatePaymentRecord).toHaveBeenCalledWith(expect.objectContaining({ amountPaid: 120 }));

    fireEvent.change(screen.getByLabelText(/asha perera payment notes/i), { target: { value: 'Paid in cash' } });
    expect(onUpdatePaymentRecord).toHaveBeenCalledWith(expect.objectContaining({ notes: 'Paid in cash' }));

  });

  it('resets the payment tracker month to the current period', async () => {
    const user = userEvent.setup();
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const nextMonth = `${new Date().getFullYear()}-${String(Math.min(new Date().getMonth() + 2, 12)).padStart(2, '0')}`;

    render(
      <PaymentTrackerView
        students={[buildStudent()]}
        paymentRecords={[
          {
            id: 1,
            studentId: 1,
            studentName: 'Asha Perera',
            month: currentMonth,
            monthlyFee: 120,
            amountPaid: 0,
            status: 'Pending',
            notes: 'Awaiting payment',
          },
          {
            id: 2,
            studentId: 1,
            studentName: 'Asha Perera',
            month: nextMonth,
            monthlyFee: 120,
            amountPaid: 50,
            status: 'Partial',
            notes: 'Carry over balance',
          },
        ]}
        onUpdatePaymentRecord={vi.fn()}
      />
    );

    await user.selectOptions(screen.getByLabelText(/month/i), nextMonth);
    expect(screen.getByLabelText(/month/i)).toHaveValue(nextMonth);

    await user.click(screen.getByRole('button', { name: /reset to current month/i }));

    expect(screen.getByLabelText(/month/i)).toHaveValue(currentMonth);
  });

  it('omits students without payment records for the selected month', () => {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    render(
      <PaymentTrackerView
        students={[buildStudent(), buildStudent({ id: 2, firstName: 'Maya', lastName: 'Fernando' })]}
        paymentRecords={[
          {
            id: 1,
            studentId: 1,
            studentName: 'Asha Perera',
            month: currentMonth,
            monthlyFee: 120,
            amountPaid: 120,
            status: 'Paid',
            notes: 'Settled',
          },
        ]}
        onUpdatePaymentRecord={vi.fn()}
      />
    );

    expect(screen.getByText(/asha perera/i)).toBeInTheDocument();
    expect(screen.queryByText(/maya fernando/i)).not.toBeInTheDocument();
  });

  it('summarizes payment statuses for the selected month', () => {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    render(
      <PaymentTrackerView
        students={[
          buildStudent(),
          buildStudent({ id: 2, firstName: 'Maya', lastName: 'Fernando' }),
          buildStudent({ id: 3, firstName: 'Nimal', lastName: 'Silva' }),
        ]}
        paymentRecords={[
          {
            id: 1,
            studentId: 1,
            studentName: 'Asha Perera',
            month: currentMonth,
            monthlyFee: 120,
            amountPaid: 120,
            status: 'Paid',
            notes: 'Settled',
          },
          {
            id: 2,
            studentId: 2,
            studentName: 'Maya Fernando',
            month: currentMonth,
            monthlyFee: 130,
            amountPaid: 65,
            status: 'Partial',
            notes: 'Half received',
          },
          {
            id: 3,
            studentId: 3,
            studentName: 'Nimal Silva',
            month: currentMonth,
            monthlyFee: 140,
            amountPaid: 0,
            status: 'Pending',
            notes: 'Awaiting payment',
          },
        ]}
        onUpdatePaymentRecord={vi.fn()}
      />
    );

    expect(screen.getByText('1 / 1 / 1')).toBeInTheDocument();
    expect(screen.getByText(/£390/i)).toBeInTheDocument();
    expect(screen.getByText(/£185/i)).toBeInTheDocument();
  });

  it('renders the class scheduling calendar and shows overflow sessions', async () => {
    const user = userEvent.setup();
    const onOpenStudentPage = vi.fn();
    const onScheduleClass = vi.fn();
    const today = new Date();
    const scheduledDay = new Date(today.getFullYear(), today.getMonth(), 1, 12);
    const day = scheduledDay.toISOString().slice(0, 10);

    render(
      <ClassSchedulingView
        students={[
          buildStudent(),
          buildStudent({ id: 2, firstName: 'Maya', lastName: 'Fernando', subjects: ['Physics', 'Chemistry'] }),
        ]}
        sessions={[
          { id: 1, studentId: 1, studentName: 'Asha Perera', year: '10', subject: 'Mathematics', date: day, time: '09:00', notes: 'Warm-up' },
          { id: 2, studentId: 1, studentName: 'Asha Perera', year: '10', subject: 'Mathematics', date: day, time: '10:00', notes: 'Practice' },
          { id: 3, studentId: 1, studentName: 'Asha Perera', year: '10', subject: 'Mathematics', date: day, time: '11:00', notes: 'Review' },
          { id: 4, studentId: 2, studentName: 'Maya Fernando', year: '9', subject: 'Physics', date: day, time: '12:00', notes: 'Lab prep' },
        ]}
        onOpenStudentPage={onOpenStudentPage}
        onScheduleClass={onScheduleClass}
      />
    );

    expect(screen.getByRole('heading', { name: /class scheduling/i })).toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /previous/i }));

    await user.click(screen.getByRole('button', { name: /09:00asha perera/i }));
    expect(onOpenStudentPage).toHaveBeenCalledWith(1);

    expect(onScheduleClass).not.toHaveBeenCalled();
  });

  it('shows the empty scheduler state when there are no students', () => {
    const onOpenStudentPage = vi.fn();
    const onScheduleClass = vi.fn();

    render(
      <ClassSchedulingView
        students={[]}
        sessions={[]}
        onOpenStudentPage={onOpenStudentPage}
        onScheduleClass={onScheduleClass}
      />
    );

    expect(screen.getByText(/no student selected/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Biology' } });
    fireEvent.click(screen.getByRole('button', { name: /save class/i }));

    expect(onOpenStudentPage).not.toHaveBeenCalled();
    expect(onScheduleClass).not.toHaveBeenCalled();
  });

  it('switches the scheduler selection from autocomplete options', async () => {
    const user = userEvent.setup();
    const onOpenStudentPage = vi.fn();
    const onScheduleClass = vi.fn();

    render(
      <ClassSchedulingView
        students={[
          buildStudent(),
          buildStudent({ id: 2, firstName: 'Maya', lastName: 'Fernando', subjects: ['Physics', 'Chemistry'] }),
        ]}
        sessions={[]}
        onOpenStudentPage={onOpenStudentPage}
        onScheduleClass={onScheduleClass}
      />
    );

    const studentSearch = screen.getByRole('combobox', { name: /student name and year/i });
    await user.clear(studentSearch);
    await user.type(studentSearch, 'Maya');
    await user.click(screen.getByRole('option', { name: /maya fernandoyear 10/i }));

    expect(screen.getByText(/maya fernando/i)).toBeInTheDocument();
    expect(onOpenStudentPage).not.toHaveBeenCalled();
    expect(onScheduleClass).not.toHaveBeenCalled();
  });

  it('saves a scheduled class with the default note when notes are empty', async () => {
    const user = userEvent.setup();
    const onOpenStudentPage = vi.fn();
    const onScheduleClass = vi.fn();

    render(
      <ClassSchedulingView
        students={[buildStudent()]}
        sessions={[]}
        onOpenStudentPage={onOpenStudentPage}
        onScheduleClass={onScheduleClass}
      />
    );

    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Physics' } });

    await user.click(screen.getByRole('button', { name: /save class/i }));

    expect(onScheduleClass).toHaveBeenCalledWith(expect.objectContaining({ notes: 'Scheduled from the class planner' }));
  });
});
