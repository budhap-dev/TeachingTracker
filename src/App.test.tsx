/// <reference types="vitest/globals" />

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from './App';

const { initialStudents } = vi.hoisted(() => ({
  initialStudents: [
    {
      id: 1,
      studentId: 'STU-123456',
      firstName: 'Asha',
      lastName: 'Perera',
      dob: '2011-05-14',
      subject: 'Mathematics',
      school: 'Kingston Grammar School',
      year: '10',
      progress: 88,
      mode: 'Face to Face',
      notes: 'Excellent problem solving skills.',
      parentName: 'Nadia Patel',
      contactNumber: '+44 7700 900123',
      address: '12 Oak Road, Kingston upon Thames, KT2 6LP',
    },
  ],
}));

vi.mock('./api/studentApi', () => ({
  fetchStudents: vi.fn().mockResolvedValue(initialStudents),
  createStudent: vi.fn(async (student: { name: string }) => ({ id: Date.now(), ...student })),
  updateStudentProgress: vi.fn(async (id: number, progress: number) => ({ id, progress })),
}));

describe('Teaching Tracker app', () => {
  it('collapses the theme picker by default and expands on demand', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('button', { name: /select winter theme/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show theme options/i }));

    expect(screen.getByRole('button', { name: /select winter theme/i })).toBeInTheDocument();
  });

  it('lets users switch themes and persists the selection', async () => {
    const user = userEvent.setup();
    render(<App />);

    const toggleButton = screen.getByRole('button', { name: /show theme options/i });
    await user.click(toggleButton);

    const winterButton = screen.getByRole('button', { name: /select winter theme/i });
    await user.click(winterButton);

    expect(document.documentElement.getAttribute('data-theme')).toBe('winter');
    expect(window.localStorage.getItem('teachtrack-theme')).toBe('winter');
  });

  it('renders the dashboard heading and navigation', () => {
    render(<App />);

    const navigation = screen.getByRole('navigation');

    expect(screen.getByRole('heading', { name: /teachtrack/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('button', { name: /^dashboard$/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('button', { name: /^students$/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('button', { name: /study snapshot/i })).toBeInTheDocument();
  });

  it('shows the students view and allows adding a student', async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole('navigation');
    await user.click(within(navigation).getByRole('button', { name: /^students$/i }));

    expect(screen.getByRole('heading', { name: /view students/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add new student/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/first name/i), 'Ruwan');
    await user.type(screen.getByLabelText(/last name/i), 'Bandara');
    await user.type(screen.getByLabelText(/school/i), 'Royal College');
    await user.click(screen.getByLabelText(/subject/i));
    await user.click(screen.getByRole('option', { name: 'Physics' }));
    await user.click(screen.getByLabelText(/year/i));
    await user.click(screen.getByRole('option', { name: '12' }));
    const progressField = screen.getAllByLabelText(/progress/i).find((element) => element instanceof HTMLInputElement);
    if (progressField) {
      await user.clear(progressField);
      await user.type(progressField, '85');
    }
    await user.click(screen.getByLabelText(/mode/i));
    await user.click(screen.getByRole('option', { name: 'Online' }));
    await user.type(screen.getByLabelText(/parent name/i), 'Nimal Bandara');
    await user.type(screen.getByLabelText(/contact number/i), '0771234567');
    await user.type(screen.getByLabelText(/address/i), '10, Main Street, Colombo');
    await user.type(screen.getByLabelText(/notes/i), 'Very focused');

    await user.click(screen.getByRole('button', { name: /save student/i }));

    expect(await screen.findByText(/ruwan bandara/i)).toBeInTheDocument();
  });

  it('switches to payments view and displays payment tracker', async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole('navigation');
    await user.click(within(navigation).getByRole('button', { name: /study snapshot/i }));

    expect(screen.getByRole('heading', { name: /study snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText(/mathematics/i)).toBeInTheDocument();
  });
});
