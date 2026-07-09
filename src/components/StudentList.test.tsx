import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Student } from '../data/students';
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

describe('StudentList', () => {
  it('expands a student row and shows the edit controls', async () => {
    const user = userEvent.setup();

    render(<StatefulStudentList />);

    await user.click(screen.getByRole('button', { name: /asha perera/i }));

    expect(screen.getByText(/progress/i)).toBeInTheDocument();
    expect(screen.getByText(/mode: face to face/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
  });
});
