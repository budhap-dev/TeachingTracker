import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Student } from '../data/students';
import { PaymentsView } from './PaymentsView';

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

describe('PaymentsView', () => {
  it('sorts and paginates the student snapshot table', async () => {
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

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Biology');

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText('Student6 Example')).toBeInTheDocument();
  });
});
