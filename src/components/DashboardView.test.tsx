import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardView } from './DashboardView';

describe('DashboardView', () => {
  it('renders summary cards and triggers the student-management action', async () => {
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
    expect(screen.getByText('82%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /manage students/i }));

    expect(onManageStudents).toHaveBeenCalledTimes(1);
  });
});
