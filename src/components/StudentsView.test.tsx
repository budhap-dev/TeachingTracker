import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Student } from '../data/students';
import { StudentsView } from './StudentsView';

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

const formState: Omit<Student, 'id'> = {
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
};

describe('StudentsView', () => {
  it('shows loading text and forwards open-student-page callback', async () => {
    const user = userEvent.setup();
    const onOpenStudentPage = vi.fn();

    render(
      <StudentsView
        students={[buildStudent()]}
        loading
        isModalOpen={false}
        form={formState}
        onOpenModal={vi.fn()}
        onCloseModal={vi.fn()}
        onFormChange={vi.fn()}
        onSubmit={vi.fn()}
        onOpenStudentPage={onOpenStudentPage}
      />
    );

    expect(screen.getByText(/loading students from the api/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /asha perera/i }));
    expect(onOpenStudentPage).toHaveBeenCalledWith(1);
  });
});
