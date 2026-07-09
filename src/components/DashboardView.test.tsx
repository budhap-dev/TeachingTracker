import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardView } from './DashboardView';

describe('DashboardView', () => {
  it('renders summary cards and triggers the student-management action', async () => {
    const user = userEvent.setup();
    const onManageStudents = vi.fn();
    const onOpenStudentPage = vi.fn();

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
        onOpenStudentPage={onOpenStudentPage}
      />
    );

    expect(screen.getByText('Today at a glance')).toBeInTheDocument();
    expect(screen.getByText('Total students')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /upcoming sessions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Asha Perera' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect google calendar/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Asha Perera' }));

    expect(onOpenStudentPage).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: /manage students/i }));

    expect(onManageStudents).toHaveBeenCalledTimes(1);
  });
});
