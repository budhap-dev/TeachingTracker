import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from './App';

const { initialStudents } = vi.hoisted(() => ({
  initialStudents: [
    {
      id: 1,
      name: 'Asha Perera',
      grade: 'Grade 10',
      subject: 'Mathematics',
      attendance: 95,
      progress: 88,
      paymentStatus: 'Paid',
      fee: 2500,
      notes: 'Excellent problem solving skills.',
    },
  ],
}));

vi.mock('./api/studentApi', () => ({
  fetchStudents: vi.fn().mockResolvedValue(initialStudents),
  createStudent: vi.fn(async (student: { name: string }) => ({ id: Date.now(), ...student })),
  updateStudentProgress: vi.fn(async (id: number, progress: number) => ({ id, progress })),
}));

describe('Teaching Tracker app', () => {
  it('renders the dashboard heading and navigation', () => {
    render(<App />);

    const navigation = screen.getByRole('navigation');

    expect(screen.getByRole('heading', { name: /teachtrack/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('button', { name: /^dashboard$/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('button', { name: /^students$/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('button', { name: /^payments$/i })).toBeInTheDocument();
  });

  it('shows the student form and allows adding a student', async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole('navigation');
    await user.click(within(navigation).getByRole('button', { name: /^students$/i }));

    expect(screen.getByRole('heading', { name: /add a student/i })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/name/i), 'Ruwan');
    await user.type(screen.getByPlaceholderText(/grade/i), 'Grade 12');
    await user.type(screen.getByPlaceholderText(/subject/i), 'Physics');
    await user.type(screen.getByPlaceholderText(/attendance/i), '90');
    await user.type(screen.getByPlaceholderText(/progress/i), '85');
    await user.type(screen.getByPlaceholderText(/fee/i), '3000');
    await user.type(screen.getByPlaceholderText(/notes/i), 'Very focused');

    await user.click(screen.getByRole('button', { name: /save student/i }));

    expect(await screen.findByText(/ruwan/i)).toBeInTheDocument();
  });

  it('switches to payments view and displays payment tracker', async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole('navigation');
    await user.click(within(navigation).getByRole('button', { name: /^payments$/i }));

    expect(screen.getByRole('heading', { name: /payment tracker/i })).toBeInTheDocument();
  });
});
