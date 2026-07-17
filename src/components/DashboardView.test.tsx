import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { DayLoad } from '../utils/dashboard'
import { DashboardView } from './DashboardView'

const quietWeek: DayLoad[] = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
].map((label, index) => ({
    label,
    dateKey: `2026-07-${String(13 + index).padStart(2, '0')}`,
    classes: 0,
    minutes: 0,
    isToday: label === 'Wed',
}))

describe('DashboardView', () => {
    it('previews four upcoming sessions and expands to the full list', async () => {
        const user = userEvent.setup()
        const manySessions = Array.from({ length: 6 }, (_, index) => ({
            id: index + 1,
            studentId: index + 1,
            date: `2026-07-2${index}`,
            time: '16:00',
            studentName: `Student ${index + 1}`,
            subject: 'Mathematics',
            year: '10',
            notes: '',
        }))

        render(
            <DashboardView
                stats={{ onlineStudents: 2, avgProgress: 82, totalStudents: 5 }}
                overviewChart={[{ label: 'Year 10', value: 5 }]}
                upcomingSessions={manySessions}
                weekLoad={quietWeek}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
                onOpenDay={vi.fn()}
            />
        )

        // A glance: the first four, and the toggle names the full count.
        const list = screen.getByRole('list', { name: /upcoming sessions/i })
        expect(within(list).getAllByRole('listitem')).toHaveLength(4)
        expect(screen.queryByText('Student 5')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /show all 6/i }))
        expect(within(list).getAllByRole('listitem')).toHaveLength(6)
        expect(screen.getByText('Student 5')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /show fewer/i }))
        expect(within(list).getAllByRole('listitem')).toHaveLength(4)
    })

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
                weekLoad={quietWeek}
                onManageStudents={onManageStudents}
                onOpenStudentPage={onOpenStudentPage}
                onOpenDay={vi.fn()}
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
                weekLoad={quietWeek}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
                onOpenDay={vi.fn()}
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
                weekLoad={quietWeek}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
                onOpenDay={vi.fn()}
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
                weekLoad={quietWeek}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
                onOpenDay={vi.fn()}
            />
        )
        const emptyChart = screen.getByRole('img', {
            name: /students by year group/i,
        })
        expect(within(emptyChart).getByText('0')).toBeInTheDocument()
    })

    it('draws the week as labelled, clickable bars', async () => {
        const user = userEvent.setup()
        const onOpenDay = vi.fn()
        const busyWeek = quietWeek.map((day) =>
            day.label === 'Thu'
                ? { ...day, classes: 2, minutes: 150 }
                : day.label === 'Wed'
                  ? { ...day, classes: 1, minutes: 60 }
                  : day
        )

        render(
            <DashboardView
                stats={{
                    onlineStudents: 2,
                    faceToFaceStudents: 3,
                    avgProgress: 82,
                    totalStudents: 5,
                }}
                overviewChart={[{ label: 'Year 9', value: 5 }]}
                upcomingSessions={[]}
                weekLoad={busyWeek}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
                onOpenDay={onOpenDay}
            />
        )

        expect(
            screen.getByRole('img', { name: /teaching load this week/i })
        ).toBeInTheDocument()
        // Selective direct labels: the max bar and today only.
        expect(screen.getByText('2.5 hrs')).toBeInTheDocument()
        expect(screen.getByText('1 hr')).toBeInTheDocument()

        await user.click(screen.getByTitle(/thu — 2 classes · 2\.5 hrs/i))
        expect(onOpenDay).toHaveBeenCalledWith('2026-07-16')
    })
})
