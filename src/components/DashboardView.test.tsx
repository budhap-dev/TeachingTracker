import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DashboardView } from './DashboardView'

describe('DashboardView', () => {
    it('renders summary cards and triggers the student-management action', async () => {
        const user = userEvent.setup()
        const onManageStudents = vi.fn()
        const onOpenStudentPage = vi.fn()

        render(
            <DashboardView
                stats={{ onlineStudents: 2, avgProgress: 82, totalStudents: 5 }}
                overviewChart={[
                    { label: 'Year 9', value: 2 },
                    { label: 'Year 10', value: 3 },
                ]}
                upcomingSessions={[
                    {
                        id: 1,
                        studentId: 1,
                        date: '2026-07-11T09:00:00.000Z',
                        time: '16:00',
                        studentName: 'Asha Perera',
                        subject: 'Mathematics',
                        year: '10',
                        notes: 'Problem solving practice',
                    },
                ]}
                onManageStudents={onManageStudents}
                onOpenStudentPage={onOpenStudentPage}
            />
        )

        expect(screen.getByText('Today at a glance')).toBeInTheDocument()
        expect(screen.getByText('Total students')).toBeInTheDocument()
        expect(
            screen.getByRole('img', { name: /students by year group/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: /upcoming sessions/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Asha Perera' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /connect google calendar/i })
        ).toBeInTheDocument()

        await user.click(screen.getByRole('link', { name: 'Asha Perera' }))

        expect(onOpenStudentPage).toHaveBeenCalledWith(1)

        await user.click(
            screen.getByRole('button', { name: /manage students/i })
        )

        expect(onManageStudents).toHaveBeenCalledTimes(1)
    })

    it('shows the year mix as parts of the student total', () => {
        render(
            <DashboardView
                stats={{ onlineStudents: 2, avgProgress: 82, totalStudents: 5 }}
                overviewChart={[
                    { label: 'Year 9', value: 2 },
                    { label: 'Year 10', value: 3 },
                ]}
                upcomingSessions={[]}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
            />
        )

        // The centre is the total the slices add up to — 2 + 3 — not a tally of
        // unrelated things. Scoped to the chart: the stat tiles also say 5.
        const chart = screen.getByRole('img', {
            name: /students by year group/i,
        })
        expect(within(chart).getByText('5')).toBeInTheDocument()
        expect(within(chart).getByText('Students')).toBeInTheDocument()
        // The legend carries counts and shares, so identity never rests on
        // colour alone.
        expect(screen.getByText('Year 9')).toBeInTheDocument()
        expect(screen.getByText(/2 students · 40%/)).toBeInTheDocument()
        expect(screen.getByText(/3 students · 60%/)).toBeInTheDocument()
    })

    it('reads naturally with a single student, and draws nothing with none', () => {
        const { rerender } = render(
            <DashboardView
                stats={{ onlineStudents: 1, avgProgress: 50, totalStudents: 1 }}
                overviewChart={[{ label: 'Year 11', value: 1 }]}
                upcomingSessions={[]}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
            />
        )
        const oneChart = screen.getByRole('img', {
            name: /students by year group/i,
        })
        expect(within(oneChart).getByText('Student')).toBeInTheDocument()
        expect(screen.getByText(/1 student · 100%/)).toBeInTheDocument()

        rerender(
            <DashboardView
                stats={{ onlineStudents: 0, avgProgress: 0, totalStudents: 0 }}
                overviewChart={[]}
                upcomingSessions={[]}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
            />
        )
        const emptyChart = screen.getByRole('img', {
            name: /students by year group/i,
        })
        expect(within(emptyChart).getByText('0')).toBeInTheDocument()
    })
})
