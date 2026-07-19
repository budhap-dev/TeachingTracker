import { fireEvent, render, screen, within } from '@testing-library/react'
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

/** Everyone on track — a neutral default for tests not about the breakdown. */
const calmAttention = {
    onTrack: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Student ${i + 1}`,
    })),
    developing: [],
    needsAttention: [],
    total: 5,
}

describe('DashboardView', () => {
    it('previews four upcoming sessions and expands to the full list', async () => {
        const user = userEvent.setup()
        const manySessions = Array.from({ length: 6 }, (_, index) => ({
            id: index + 1,
            date: `2026-07-2${index}`,
            time: '16:00',
            subject: 'Mathematics',
            notes: '',
            members: [
                {
                    studentId: index + 1,
                    studentName: `Student ${index + 1}`,
                    year: '10',
                },
            ],
        }))

        render(
            <DashboardView
                stats={{ onlineStudents: 2, avgProgress: 82, totalStudents: 5 }}
                attention={calmAttention}
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
                attention={calmAttention}
                upcomingSessions={[
                    {
                        id: 1,
                        date: '2026-07-11T09:00:00.000Z',
                        time: '16:00',
                        subject: 'Mathematics',
                        notes: 'Problem solving practice',
                        members: [
                            {
                                studentId: 1,
                                studentName: 'Asha Perera',
                                year: '10',
                            },
                        ],
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
            screen.getByRole('heading', { name: /who needs attention/i })
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

    it('shows a group class once, tagged, with every attendee linked', async () => {
        const user = userEvent.setup()
        const onOpenStudentPage = vi.fn()

        render(
            <DashboardView
                stats={{ onlineStudents: 2, avgProgress: 82, totalStudents: 5 }}
                attention={calmAttention}
                upcomingSessions={[
                    {
                        id: 11,
                        date: '2026-07-20',
                        time: '16:00',
                        subject: 'Mathematics',
                        notes: 'Group revision',
                        members: [
                            {
                                studentId: 1,
                                studentName: 'Asha Perera',
                                year: '10',
                            },
                            {
                                studentId: 2,
                                studentName: 'Nimal Perera',
                                year: '11',
                            },
                        ],
                    },
                ]}
                weekLoad={quietWeek}
                onManageStudents={vi.fn()}
                onOpenStudentPage={onOpenStudentPage}
                onOpenDay={vi.fn()}
            />
        )

        const list = screen.getByRole('list', { name: /upcoming sessions/i })
        // One entry for the whole group, not one per attendee.
        expect(within(list).getAllByRole('listitem')).toHaveLength(1)
        expect(within(list).getByText('Group')).toBeInTheDocument()
        expect(within(list).getByText(/Group · 2/)).toBeInTheDocument()
        // The mixed years are dropped from the meta line; both names link.
        expect(within(list).queryByText(/Year 10/)).not.toBeInTheDocument()

        await user.click(
            within(list).getByRole('link', { name: 'Nimal Perera' })
        )
        expect(onOpenStudentPage).toHaveBeenCalledWith(2)
    })

    const mixedAttention = {
        onTrack: [
            { id: 5, name: 'Ravi Onder' },
            { id: 6, name: 'Sam Overby' },
            { id: 7, name: 'Uma Oyelaran' },
        ],
        developing: [{ id: 3, name: 'Devi Middle' }],
        needsAttention: [
            { id: 4, name: 'Dilan Silva' },
            { id: 1, name: 'Asha Perera' },
        ],
        total: 6,
    }

    it('breaks students into progress bands and reveals the neediest by default', async () => {
        const user = userEvent.setup()
        const onOpenStudentPage = vi.fn()
        render(
            <DashboardView
                stats={{ onlineStudents: 2, avgProgress: 62, totalStudents: 6 }}
                attention={mixedAttention}
                upcomingSessions={[]}
                weekLoad={quietWeek}
                onManageStudents={vi.fn()}
                onOpenStudentPage={onOpenStudentPage}
                onOpenDay={vi.fn()}
            />
        )

        // Every band is labelled with its count — identity never rests on
        // colour alone.
        const bar = screen.getByRole('img', { name: /progress of 6 students/i })
        expect(bar).toHaveAttribute(
            'aria-label',
            expect.stringContaining('2 Needs attention')
        )

        // With nothing hovered, the neediest band's students are shown and open
        // their page.
        await user.click(screen.getByRole('link', { name: 'Dilan Silva' }))
        expect(onOpenStudentPage).toHaveBeenCalledWith(4)
    })

    it('swaps the revealed band on hover (desktop), across bar and legend', async () => {
        const user = userEvent.setup()
        render(
            <DashboardView
                stats={{ onlineStudents: 2, avgProgress: 62, totalStudents: 6 }}
                attention={mixedAttention}
                upcomingSessions={[]}
                weekLoad={quietWeek}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
                onOpenDay={vi.fn()}
            />
        )

        const legend = screen.getByRole('list', {
            name: /students by progress band/i,
        })
        const onTrackRow = within(legend).getByRole('button', {
            name: /on track/i,
        })
        const needsRow = within(legend).getByRole('button', {
            name: /needs attention/i,
        })

        // Hover a legend row → its students; hover another → the pointer leaves
        // the first (reverting it) and the new band shows.
        await user.hover(onTrackRow)
        expect(
            screen.getByRole('link', { name: 'Ravi Onder' })
        ).toBeInTheDocument()
        await user.hover(needsRow)
        expect(
            screen.getByRole('link', { name: 'Dilan Silva' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('link', { name: 'Ravi Onder' })
        ).not.toBeInTheDocument()

        // The bar segments drive the same reveal.
        const onTrackSegment = screen.getByRole('button', {
            name: /on track: ravi onder/i,
        })
        await user.hover(onTrackSegment)
        expect(
            screen.getByRole('link', { name: 'Sam Overby' })
        ).toBeInTheDocument()
        // Leaving the segment reverts to the default (neediest) band.
        await user.hover(needsRow)
        expect(
            screen.queryByRole('link', { name: 'Sam Overby' })
        ).not.toBeInTheDocument()
    })

    it('pins a band on tap (mobile) and a second tap clears it', () => {
        render(
            <DashboardView
                stats={{ onlineStudents: 2, avgProgress: 62, totalStudents: 6 }}
                attention={mixedAttention}
                upcomingSessions={[]}
                weekLoad={quietWeek}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
                onOpenDay={vi.fn()}
            />
        )

        // fireEvent.click without a preceding hover mirrors a touch tap: no
        // hover state, so the pin alone drives what's shown.
        const legend = screen.getByRole('list', {
            name: /students by progress band/i,
        })
        const onTrackRow = within(legend).getByRole('button', {
            name: /on track/i,
        })
        fireEvent.click(onTrackRow)
        expect(
            screen.getByRole('link', { name: 'Uma Oyelaran' })
        ).toBeInTheDocument()
        fireEvent.click(onTrackRow)
        expect(
            screen.queryByRole('link', { name: 'Uma Oyelaran' })
        ).not.toBeInTheDocument()

        // A bar segment tap pins the same way.
        fireEvent.click(
            screen.getByRole('button', { name: /on track: ravi onder/i })
        )
        expect(
            screen.getByRole('link', { name: 'Sam Overby' })
        ).toBeInTheDocument()
    })

    it('drops the reveal list and bar when no one needs attention or exists', () => {
        const { rerender } = render(
            <DashboardView
                stats={{ onlineStudents: 1, avgProgress: 90, totalStudents: 1 }}
                attention={{
                    onTrack: [{ id: 1, name: 'Asha Perera' }],
                    developing: [],
                    needsAttention: [],
                    total: 1,
                }}
                upcomingSessions={[]}
                weekLoad={quietWeek}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
                onOpenDay={vi.fn()}
            />
        )
        // Neediest band is empty, so no students are revealed until a band with
        // members is chosen — but the bar still renders.
        expect(
            screen.queryByRole('link', { name: 'Asha Perera' })
        ).not.toBeInTheDocument()
        expect(
            screen.getByRole('img', { name: /progress of 1 student/i })
        ).toBeInTheDocument()

        rerender(
            <DashboardView
                stats={{ onlineStudents: 0, avgProgress: 0, totalStudents: 0 }}
                attention={{
                    onTrack: [],
                    developing: [],
                    needsAttention: [],
                    total: 0,
                }}
                upcomingSessions={[]}
                weekLoad={quietWeek}
                onManageStudents={vi.fn()}
                onOpenStudentPage={vi.fn()}
                onOpenDay={vi.fn()}
            />
        )
        // An empty roster shows a friendly prompt, not an empty bar.
        expect(screen.getByText(/no students yet/i)).toBeInTheDocument()
        expect(
            screen.queryByRole('img', { name: /progress of/i })
        ).not.toBeInTheDocument()
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
                attention={calmAttention}
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
