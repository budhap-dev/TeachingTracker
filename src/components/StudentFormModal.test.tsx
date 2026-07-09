import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StudentFormModal } from './StudentFormModal';

describe('StudentFormModal', () => {
  it('renders the add-student form fields', () => {
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
});
