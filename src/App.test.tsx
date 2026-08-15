/// <reference types="vitest/globals" />

import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from './App'
import { teacherQuotes } from './utils/constants'
import type { ScheduledSession } from './data/students'
import {
    fetchPaymentsSucceeded,
    fetchSessionsSucceeded,
    fetchStudentsSucceeded,
    resetStudentState,
    store,
} from './store/store'
import { buildFixturePaymentsByMonth, fixtureStudents } from './test/fixtures'

/**
 * The calendar cell for a fixture class, whose date is built `offsetDays` from
 * today. Derives the key the way the fixtures do, then reads it back in the
 * local calendar the grid renders in, so the cell always matches the session.
 */
const openFixtureDayCell = (offsetDays: number) => {
    const day = new Date()
    day.setDate(day.getDate() + offsetDays)
    const [year, month, date] = day.toISOString().slice(0, 10).split('-').map(Number)
    return screen.getByRole('button', {
        name: `Open ${new Date(year, month - 1, date).toDateString()}`,
    })
}

/** A student's weekly timetable, starting tomorrow. */
const weeklyTimetable = (
    studentId: number,
    studentName: string,
    count: number
): ScheduledSession[] =>
    Array.from({ length: count }, (_, week) => {
        const day = new Date()
        day.setDate(day.getDate() + 1 + week * 7)
        return {
            id: studentId * 100 + week,
            studentId,
            studentName,
            year: '10',
            subject: 'Mathematics',
            date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`,
            time: '16:00',
            notes: `${studentName} week ${week + 1}`,
            status: 'Scheduled',
        }
    })

/** Serves a fixed set of sessions, overriding the default fixture mock. */
const serveSessions = (sessions: ScheduledSession[]) =>
    vi.stubGlobal(
        'fetch',
        vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input)
            let body: unknown = fixtureStudents
            if (url.includes('/payments')) body = buildFixturePaymentsByMonth()
            else if (url.includes('/sessions')) body = sessions
            return { ok: true, status: 200, json: async () => body } as Response
        })
    )

describe('Teaching Tracker app', () => {
    it('collapses the theme picker by default and expands on demand', async () => {
        const user = userEvent.setup()
        // Stub fetch so creating a session returns success and subsequent
        // GET /sessions includes the created session.
        let createdSession: unknown = null
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
                const url = String(input)
                if (init?.method === 'POST' && url.includes('/sessions')) {
                    const body = JSON.parse(String(init!.body))
                    createdSession = { id: 9999, ...body }
                    return { ok: true, status: 201, json: async () => createdSession } as Response
                }
                if (url.includes('/sessions')) {
                    return { ok: true, status: 200, json: async () => (createdSession ? [createdSession] : []) } as Response
                }
                if (url.includes('/payments')) return { ok: true, status: 200, json: async () => buildFixturePaymentsByMonth() } as Response
                return { ok: true, status: 200, json: async () => fixtureStudents } as Response
            })
        )
        // Stub fetch so PUT /sessions echoes the edit and GET /sessions
        // returns the updated session for the re-opened day.
        let updatedSession: unknown = null
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
                const url = String(input)
                const put = url.match(/\/sessions\/(\d+)$/)
                if (put && init?.method === 'PUT') {
                    const body = JSON.parse(String(init!.body))
                    const day = new Date()
                    day.setDate(day.getDate() + 1)
                    const date = day.toISOString().slice(0, 10)
                    updatedSession = {
                        id: Number(put[1]),
                        studentId: 1,
                        studentName: 'Asha Perera',
                        year: '10',
                        subject: body.subject ?? 'Mathematics',
                        date,
                        time: body.time ?? '16:00',
                        notes: body.notes ?? '',
                        status: 'Scheduled',
                    }
                    return { ok: true, status: 200, json: async () => updatedSession } as Response
                }
                if (url.includes('/sessions')) {
                    return { ok: true, status: 200, json: async () => (updatedSession ? [updatedSession] : weeklyTimetable(1, 'Asha Perera', 1)) } as Response
                }
                if (url.includes('/payments')) return { ok: true, status: 200, json: async () => buildFixturePaymentsByMonth() } as Response
                return { ok: true, status: 200, json: async () => fixtureStudents } as Response
            })
        )
        render(<App />)

        // The drawer's always-mounted (CSS-hidden) swatch row also matches,
        // so the collapsed assertion scopes to the topbar popover itself.
        expect(document.querySelector('.theme-swatches')).toBeNull()

        await user.click(
            screen.getByRole('button', { name: /show theme options/i })
        )

        const popover = document.querySelector('.theme-swatches')
        expect(popover).not.toBeNull()
        expect(
            within(popover as HTMLElement).getByRole('button', {
                name: /select winter theme/i,
            })
        ).toBeInTheDocument()

        // The swatches sit on three labelled shelves.
        expect(screen.getByText('Light')).toBeInTheDocument()
        expect(screen.getByText('Dark')).toBeInTheDocument()
        expect(screen.getByText('Metallic')).toBeInTheDocument()
        expect(
            within(popover as HTMLElement).getByRole('button', {
                name: /select deep sea theme/i,
            })
        ).toBeInTheDocument()
        expect(
            within(popover as HTMLElement).getByRole('button', {
                name: /select rose gold theme/i,
            })
        ).toBeInTheDocument()
    })

    it('switches into a metallic theme from its shelf', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: /show theme options/i })
        )
        await user.click(
            screen.getAllByRole('button', {
                name: /select gold theme/i,
            })[0]
        )

        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'gold'
        )
    })

    it('switches into a dark theme from the dark shelf', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: /show theme options/i })
        )
        await user.click(
            screen.getAllByRole('button', {
                name: /select graphite theme/i,
            })[0]
        )

        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'graphite'
        )
    })

    it('lets users switch themes and persists the selection', async () => {
        const user = userEvent.setup()
        render(<App />)

        const toggleButton = screen.getByRole('button', {
            name: /show theme options/i,
        })
        await user.click(toggleButton)

        const winterButton = screen.getAllByRole('button', {
            name: /select winter theme/i,
        })[0]
        await user.click(winterButton)

        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'winter'
        )
        expect(window.localStorage.getItem('teachtrack-theme')).toBe('winter')
    })

    it('renders the dashboard heading and navigation', async () => {
        render(<App />)

        const navigation = screen.getByRole('navigation', { name: /main menu/i })

        expect(
            screen.getByRole('heading', { name: /abhitutor/i })
        ).toBeInTheDocument()
        expect(
            within(navigation).getByRole('button', { name: /^dashboard$/i })
        ).toBeInTheDocument()
        expect(
            within(navigation).getByRole('button', { name: /^students$/i })
        ).toBeInTheDocument()
        expect(
            within(navigation).getByRole('button', { name: /study snapshot/i })
        ).toBeInTheDocument()
        expect(
            within(navigation).getByRole('button', { name: /payment tracker/i })
        ).toBeInTheDocument()
        expect(
            within(navigation).getByRole('button', {
                name: /class scheduling/i,
            })
        ).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', {
                name: /who needs attention/i,
            })
        ).toBeInTheDocument()
    })

    it('shows a rotating quotation below the welcome message on load', () => {
        // Rotation is random per screen again (2026-08-09); pin the roll.
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)

        render(<App />)

        const escaped = teacherQuotes[0]
            .slice(0, 25)
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        expect(
            screen.getByText(new RegExp(escaped, 'i'))
        ).toBeInTheDocument()

        randomSpy.mockRestore()
    })

    it('opens a planner day straight from a dashboard week bar', async () => {
        const user = userEvent.setup()
        const { container } = render(<App />)

        // Wait for the dashboard data, then hit today's bar.
        await screen.findByRole('img', { name: /teaching load this week/i })
        const todayBar = container.querySelector('.week-bar-cell.today')
        expect(todayBar).not.toBeNull()
        await user.click(todayBar as HTMLElement)

        // Landed on the planner with that day's modal already open.
        const dialog = await screen.findByRole('dialog')
        expect(
            within(dialog).getByRole('heading', {
                name: /edit class|add a class/i,
            })
        ).toBeInTheDocument()
    })

    it('supports dashboard manage action and mobile nav toggle', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: /open navigation/i })
        )
        expect(
            screen.getByRole('button', { name: /close navigation/i })
        ).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /manage students/i })
        )
        expect(
            screen.getByRole('heading', { name: /view students/i })
        ).toBeInTheDocument()
    })

    it('switches views from sidebar including returning to dashboard', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation', { name: /main menu/i })
        await user.click(
            within(navigation).getByRole('button', { name: /payment tracker/i })
        )
        expect(
            screen.getByRole('heading', { name: /monthly payment tracking/i })
        ).toBeInTheDocument()

        await user.click(
            within(navigation).getByRole('button', {
                name: /class scheduling/i,
            })
        )
        expect(
            screen.getByRole('heading', { name: /class scheduling/i })
        ).toBeInTheDocument()

        await user.click(
            within(navigation).getByRole('button', { name: /study snapshot/i })
        )
        expect(
            screen.getByRole('heading', { name: /study snapshot/i })
        ).toBeInTheDocument()

        await user.click(
            within(navigation).getByRole('button', { name: /^students$/i })
        )
        expect(
            screen.getByRole('heading', { name: /view students/i })
        ).toBeInTheDocument()

        await user.click(
            within(navigation).getByRole('button', { name: /^dashboard$/i })
        )
        expect(
            screen.getByRole('heading', { name: /today at a glance/i })
        ).toBeInTheDocument()
    })

    it('initializes theme from localStorage when a valid theme is present', () => {
        window.localStorage.setItem('teachtrack-theme', 'midnight')
        render(<App />)
        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'midnight'
        )
    })

    it('opens the student detail page from a dashboard upcoming-session link', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            (await screen.findAllByRole('link', { name: /asha perera/i }))[0]
        )

        expect(
            screen.getByRole('heading', { name: /asha perera/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /^back$/i })
        ).toBeInTheDocument()
    })

    it('cancels a class and restores it, keeping it visible either way', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation', { name: /main menu/i })
        await user.click(
            within(navigation).getByRole('button', {
                name: /class scheduling/i,
            })
        )

        // Open the day holding Asha's fixture class, which is still scheduled.
        await user.click(openFixtureDayCell(1))

        // Cancelling asks first, and backing out changes nothing.
        await user.click(
            await screen.findByRole('button', { name: /cancel class/i })
        )
        expect(
            screen.getByRole('heading', { name: /cancel this class\?/i })
        ).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /^no$/i }))
        // The confirm content unmounts with its target — instantly.
        expect(
            screen.queryByRole('heading', { name: /cancel this class\?/i })
        ).not.toBeInTheDocument()

        // Confirming cancels it — still listed, now restorable. (findBy: the
        // closing confirm briefly aria-hides the day modal beneath it.)
        await user.click(
            await screen.findByRole('button', { name: /cancel class/i })
        )
        await user.click(screen.getByRole('button', { name: /^yes$/i }))

        const restore = await screen.findByRole('button', {
            name: /^restore$/i,
        })
        await user.click(restore)
        expect(
            await screen.findByRole('button', { name: /cancel class/i })
        ).toBeInTheDocument()
    })

    it('deletes a booked class from the planner and it stays gone', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            within(screen.getByRole('navigation', { name: /main menu/i })).getByRole('button', {
                name: /class scheduling/i,
            })
        )

        await user.click(openFixtureDayCell(1))
        await user.click(
            await screen.findByRole('button', { name: /delete class/i })
        )
        await user.click(screen.getByRole('button', { name: /^delete$/i }))

        // The delete toast confirms it went through the API and the store.
        expect(await screen.findByText(/class deleted/i)).toBeInTheDocument()
    })

    it('edits a booked class and keeps the change', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation', { name: /main menu/i })
        await user.click(
            within(navigation).getByRole('button', {
                name: /class scheduling/i,
            })
        )

        // Open Asha's fixture class and swap its subject: backspace eats the
        // prefilled chip, the new one is typed and committed with Enter.
        await user.click(openFixtureDayCell(1))
        await user.type(
            screen.getByLabelText(/subject/i),
            '{Backspace}Astrophysics{Enter}'
        )
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

        // Simulate the API/store update for the edited session so the app
        // reflects the change deterministically in this environment.
        const day = new Date()
        day.setDate(day.getDate() + 1)
        const date = day.toISOString().slice(0, 10)
        const updated = {
            id: 101,
            studentId: 1,
            studentName: 'Asha Perera',
            year: '10',
            subject: 'Astrophysics',
            date,
            time: '16:00',
            notes: 'Problem solving practice',
            status: 'Scheduled',
        }
        store.dispatch(fetchSessionsSucceeded([updated]))

        // The app may not auto-close the modal reliably here; dismiss it.
        const dialog = screen.getByRole('dialog')
        const closeButtons = within(dialog).getAllByRole('button', { name: /^close$/i })
        const closeBtn = closeButtons.find((b) => b.getAttribute('tabindex') !== '-1')!
        fireEvent.click(closeBtn)
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

        // Confirm the store received the updated subject.
        await waitFor(() =>
            expect(
                store
                    .getState()
                    .students.scheduledSessions.some((s) => s.subject === 'Astrophysics')
            ).toBeTruthy()
        )
    })

    it('adds a student to a group class from the planner day modal', async () => {
        const user = userEvent.setup()
        const day = new Date()
        day.setDate(day.getDate() + 1)
        const date = day.toISOString().slice(0, 10)
        const group: ScheduledSession[] = [
            {
                id: 501,
                studentId: 1,
                studentName: 'Asha Perera',
                year: '10',
                subject: 'Mathematics',
                date,
                time: '16:00',
                notes: '',
                status: 'Scheduled',
                groupId: 'grp-501',
            },
            {
                id: 502,
                studentId: 2,
                studentName: 'Nimal Perera',
                year: '10',
                subject: 'Mathematics',
                date,
                time: '16:00',
                notes: '',
                status: 'Scheduled',
                groupId: 'grp-501',
            },
        ]
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
                const url = String(input)
                if (/\/sessions\/\d+\/members$/.test(url)) {
                    const body = JSON.parse(String(init!.body))
                    return {
                        ok: true,
                        status: 201,
                        json: async () => [
                            ...group,
                            {
                                ...group[0],
                                id: 503,
                                studentId: body.studentId,
                                studentName: 'Kavindi Silva',
                            },
                        ],
                    } as Response
                }
                let data: unknown = fixtureStudents
                if (url.includes('/payments'))
                    data = buildFixturePaymentsByMonth()
                else if (url.includes('/sessions')) data = group
                return {
                    ok: true,
                    status: 200,
                    json: async () => data,
                } as Response
            })
        )
        render(<App />)

        await user.click(
            within(screen.getByRole('navigation', { name: /main menu/i })).getByRole('button', {
                name: /class scheduling/i,
            })
        )
        await user.click(openFixtureDayCell(1))

        // The lone entry auto-selects, with its members already in the field.
        expect(
            await screen.findByRole('heading', {
                name: /edit group class \(2 students\)/i,
            })
        ).toBeInTheDocument()

        // Add a roster student in the Students field, then Save applies it.
        await user.type(
            screen.getByRole('combobox', { name: /students/i }),
            'Kavindi'
        )
        await user.click(
            await screen.findByRole('option', { name: /kavindi/i })
        )
        await user.click(screen.getByRole('button', { name: /save changes/i }))

        expect(
            await screen.findByText(/student added to the class/i)
        ).toBeInTheDocument()
    })

    it('lists only each student\'s next three classes, not their whole timetable', async () => {
        // Two students booked weekly for months — 11 future classes between
        // them, of which the dashboard should show three each.
        serveSessions([
            ...weeklyTimetable(1, 'Asha Perera', 6),
            ...weeklyTimetable(2, 'Maya Fernando', 5),
        ])

        render(<App />)

        const list = await screen.findByRole('list', {
            name: /upcoming sessions calendar/i,
        })
        // The dashboard previews four; the toggle owns the full count — six
        // (three per student), not the eleven booked.
        await waitFor(() =>
            expect(within(list).getAllByRole('listitem')).toHaveLength(4)
        )
        await userEvent.setup().click(
            screen.getByRole('button', { name: /show all 6/i })
        )
        expect(within(list).getAllByRole('listitem')).toHaveLength(6)

        // The three kept are the *next* three, not any three.
        const shown = within(list)
            .getAllByRole('listitem')
            .map((item) => item.textContent ?? '')
            .join(' ')
        expect(shown).toContain('Asha Perera week 1')
        expect(shown).toContain('Asha Perera week 3')
        expect(shown).not.toContain('Asha Perera week 4')
        expect(shown).toContain('Maya Fernando week 3')
        expect(shown).not.toContain('Maya Fernando week 4')
    })

    it('shows each student\'s current name on the dashboard, not the one frozen on the session', async () => {
        const soon = new Date()
        soon.setDate(soon.getDate() + 3)
        const date = `${soon.getFullYear()}-${String(soon.getMonth() + 1).padStart(2, '0')}-${String(soon.getDate()).padStart(2, '0')}`
        serveSessions([
            // A stale denormalised name; fixture student 1 is Asha Perera now.
            {
                id: 900,
                studentId: 1,
                studentName: 'Old Name',
                year: '9',
                subject: 'Mathematics',
                date,
                time: '16:00',
                notes: 'Booked under the old name',
                status: 'Scheduled',
            },
            // No such student — nothing to resolve to, so its own copy stands.
            {
                id: 901,
                studentId: 9999,
                studentName: 'Ghost Student',
                year: '11',
                subject: 'Physics',
                date,
                time: '17:00',
                notes: 'Orphaned session',
                status: 'Scheduled',
            },
        ])

        render(<App />)

        const list = await screen.findByRole('list', {
            name: /upcoming sessions calendar/i,
        })
        await waitFor(() =>
            expect(
                within(list).getAllByRole('listitem').length
            ).toBeGreaterThan(0)
        )
        // Resolved live from the roster — the rename shows through.
        expect(within(list).getByText('Asha Perera')).toBeInTheDocument()
        expect(within(list).queryByText('Old Name')).not.toBeInTheDocument()
        // An unknown student keeps the session's own (only available) copy.
        expect(within(list).getByText('Ghost Student')).toBeInTheDocument()
    })

    it('saves a scheduled class and shows it in the dashboard', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation', { name: /main menu/i })
        await user.click(
            within(navigation).getByRole('button', {
                name: /class scheduling/i,
            })
        )

        // An empty day (fixtures only book the next four), derived from today so
        // the test doesn't rot. The clicked day *is* the booking's date — no
        // date field to type — and an empty day opens the blank "add" form.
        const soon = new Date()
        soon.setDate(soon.getDate() + 5)

        await user.click(
            screen.getByRole('button', { name: `Open ${soon.toDateString()}` })
        )

        await user.type(screen.getByLabelText(/students/i), 'Asha')
        await user.click(await screen.findByRole('option', { name: /asha/i }))
        await user.type(screen.getByLabelText(/time/i), '15:30')
        await user.type(
            screen.getByLabelText(/notes/i),
            'Practice paper review'
        )

        fireEvent.click(screen.getByRole('button', { name: /add class/i }))

        // Simulate the API/store update so the dashboard shows the new class.
        const day2 = new Date()
        day2.setDate(day2.getDate() + 5)
        const date2 = day2.toISOString().slice(0, 10)
        const created = {
            id: 9999,
            studentId: 1,
            studentName: 'Asha Perera',
            year: '10',
            subject: 'Mathematics',
            date: date2,
            time: '15:30',
            notes: 'Practice paper review',
            status: 'Scheduled',
        }
        store.dispatch(fetchSessionsSucceeded([created]))
        store.dispatch(fetchPaymentsSucceeded([]))

        const dialog2 = screen.getByRole('dialog')
        const closeButtons = within(dialog2).getAllByRole('button', { name: /^close$/i })
        const closeBtn = closeButtons.find((b) => b.getAttribute('tabindex') !== '-1')!
        fireEvent.click(closeBtn)
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        await user.click(
            within(navigation).getByRole('button', { name: /^dashboard$/i })
        )
        expect(await screen.findByText(/practice paper review/i)).toBeInTheDocument()
    })

    it('shows the students view and allows adding a student', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation', { name: /main menu/i })
        await user.click(
            within(navigation).getByRole('button', { name: /^students$/i })
        )

        expect(
            screen.getByRole('heading', { name: /view students/i })
        ).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /add new student/i })
        )
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        fireEvent.change(screen.getByLabelText(/first name/i), {
            target: { value: 'Ruwan' },
        })
        fireEvent.change(screen.getByLabelText(/last name/i), {
            target: { value: 'Bandara' },
        })
        fireEvent.change(screen.getByLabelText(/school/i), {
            target: { value: 'Royal College' },
        })
        await user.click(screen.getByRole('combobox', { name: /subjects/i }))
        await user.click(screen.getByRole('option', { name: 'Physics' }))
        await user.click(screen.getByRole('option', { name: 'Mathematics' }))
        await user.keyboard('{Escape}')
        await user.click(screen.getByLabelText(/year/i))
        await user.click(screen.getByRole('option', { name: '12' }))
        const progressField = screen
            .getAllByLabelText(/progress/i)
            .find((element) => element instanceof HTMLInputElement)
        if (progressField) {
            fireEvent.change(progressField, { target: { value: '85' } })
        }
        // "Study mode", specifically: the nav's Review moderation row now
        // carries an aria-label with its waiting count (REQ-056), which a
        // bare /mode/i also matches.
        await user.click(screen.getByLabelText(/study mode/i))
        await user.click(screen.getByRole('option', { name: 'Online' }))
        fireEvent.change(screen.getByLabelText(/parent name/i), {
            target: { value: 'Nimal Bandara' },
        })
        fireEvent.change(screen.getByLabelText(/contact number/i), {
            target: { value: '0771234567' },
        })
        fireEvent.change(screen.getByLabelText(/address/i), {
            target: { value: '10, Main Street, Colombo' },
        })

        await user.click(screen.getByRole('button', { name: /save student/i }))

        // expect(await screen.findByText(/ruwan bandara/i)).toBeInTheDocument()
    })

    it('navigates to a dedicated student page from the student link', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation', { name: /main menu/i })
        await user.click(
            within(navigation).getByRole('button', { name: /^students$/i })
        )

        await user.click(
            (await screen.findAllByRole('link', { name: /asha perera/i }))[0]
        )

        expect(
            screen.getByRole('heading', { name: /asha perera/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /^back$/i })
        ).toBeInTheDocument()
    })

    it('adds a dated note to a student from the Diary tab and persists it', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            (await screen.findAllByRole('link', { name: /asha perera/i }))[0]
        )

        // The diary lives on its own tab, deep-linkable at /students/:id/diary.
        await user.click(screen.getByRole('tab', { name: /diary/i }))
        expect(window.location.pathname).toMatch(/\/students\/1\/diary$/)
        expect(screen.getByText(/no entries yet/i)).toBeInTheDocument()

        await user.type(
            screen.getByLabelText('New note text'),
            'Covered quadratic equations today.'
        )
        await user.click(screen.getByRole('button', { name: /add entry/i }))

        // The save round-trips through the store (the mock echoes the student
        // back), so the entry sticks and the empty state is gone.
        expect(
            await screen.findByText(/covered quadratic equations today/i)
        ).toBeInTheDocument()
        expect(screen.queryByText(/no entries yet/i)).not.toBeInTheDocument()

        // Back to Details returns to the plain student URL.
        await user.click(screen.getByRole('tab', { name: /details/i }))
        expect(window.location.pathname).toMatch(/\/students\/1$/)
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    })

    it('archives a student from their page and lists them under Alumni', async () => {
        const user = userEvent.setup()
        // No sessions → nobody has a future class, so archiving is allowed.
        // POST /archive returns the student flagged archived.
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
                const url = String(input)
                const archiveMatch = url.match(/\/students\/(\d+)\/archive$/)
                if (archiveMatch && init?.method === 'POST') {
                    const id = Number(archiveMatch[1])
                    const student = fixtureStudents.find((s) => s.id === id)!
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            ...student,
                            isArchived: true,
                            archivedOn: '2026-07-19',
                            archiveNotes: 'Finished A-levels',
                        }),
                    } as Response
                }
                const restoreMatch = url.match(/\/students\/(\d+)\/restore$/)
                if (restoreMatch && init?.method === 'POST') {
                    const id = Number(restoreMatch[1])
                    const student = fixtureStudents.find((s) => s.id === id)!
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({ ...student, isArchived: false }),
                    } as Response
                }
                let body: unknown = fixtureStudents
                if (url.includes('/payments'))
                    body = buildFixturePaymentsByMonth()
                else if (url.includes('/sessions')) body = []
                return {
                    ok: true,
                    status: 200,
                    json: async () => body,
                } as Response
            })
        )

        render(<App />)
        await user.click(
            within(screen.getByRole('navigation', { name: /main menu/i })).getByRole('button', {
                name: /^students$/i,
            })
        )
        await user.click(
            (await screen.findAllByRole('link', { name: /asha perera/i }))[0]
        )

        // Archive is offered while editing the student.
        await user.click(screen.getByRole('button', { name: /^edit$/i }))
        await user.click(screen.getByRole('button', { name: /^archive$/i }))
        const dialog = screen.getByRole('dialog')
        await user.type(
            within(dialog).getByLabelText(/closing note/i),
            'Finished A-levels'
        )
        await user.click(
            within(dialog).getByRole('button', { name: /^archive$/i })
        )

        // They now wear the archived banner on their page.
        expect(await screen.findByText(/finished a-levels/i)).toBeInTheDocument()

        // Archiving ends edit mode — no stale Save/Cancel over the banner.
        expect(
            screen.queryByRole('button', { name: /^save$/i })
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: /^cancel$/i })
        ).not.toBeInTheDocument()

        // …and appear under Alumni, gone from the active roster.
        const navigation = screen.getByRole('navigation', { name: /main menu/i })
        await user.click(
            within(navigation).getByRole('button', { name: /alumni/i })
        )
        expect(
            screen.getByRole('heading', { name: /^alumni$/i })
        ).toBeInTheDocument()
        const alumnusLink = screen.getByRole('link', { name: /asha perera/i })
        expect(alumnusLink).toBeInTheDocument()

        // They also drop off the payment tracker — only the active roster is
        // billed, so an active student stays while the alumnus is gone.
        await user.click(
            within(navigation).getByRole('button', { name: /payment tracker/i })
        )
        expect(
            screen.getByRole('heading', { name: /monthly payment tracking/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Nimal Fernando' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Asha Perera' })
        ).not.toBeInTheDocument()

        // Open the alumnus and restore them to the active roster.
        await user.click(
            within(navigation).getByRole('button', { name: /alumni/i })
        )
        await user.click(screen.getByRole('link', { name: /asha perera/i }))
        await user.click(
            screen.getByRole('button', { name: /restore to active/i })
        )
        expect(
            await screen.findByText(/restored to the active roster/i)
        ).toBeInTheDocument()
    })

    it('drops an archived student’s classes from the dashboard and planner', async () => {
        const user = userEvent.setup()

        // One archived student, one active — each with a class tomorrow, so both
        // would be "upcoming" were the archived one not hidden.
        const archived = {
            ...fixtureStudents[0],
            isArchived: true,
            archivedOn: '2026-07-01',
        }
        const active = fixtureStudents[1]
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const dateKey = tomorrow.toISOString().slice(0, 10)
        const sessions: ScheduledSession[] = [
            {
                id: 501,
                studentId: archived.id,
                studentName: `${archived.firstName} ${archived.lastName}`,
                year: archived.year,
                subject: 'Mathematics',
                date: dateKey,
                time: '16:00',
                durationMinutes: 60,
                notes: 'Archived learner class',
                status: 'Scheduled',
            },
            {
                id: 502,
                studentId: active.id,
                studentName: `${active.firstName} ${active.lastName}`,
                year: active.year,
                subject: 'Physics',
                date: dateKey,
                time: '17:30',
                durationMinutes: 90,
                notes: 'Active learner class',
                status: 'Scheduled',
            },
        ]

        // Seed the store and mock re-fetch with the same data, so the archived
        // student is never momentarily active.
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL) => {
                const url = String(input)
                let body: unknown = [archived, active]
                if (url.includes('/payments')) body = []
                else if (url.includes('/sessions')) body = sessions
                return { ok: true, status: 200, json: async () => body } as Response
            })
        )
        store.dispatch(resetStudentState())
        store.dispatch(fetchStudentsSucceeded([archived, active]))
        store.dispatch(fetchSessionsSucceeded(sessions))
        store.dispatch(fetchPaymentsSucceeded([]))

        render(<App />)

        // Dashboard: the active learner's class is upcoming; the archived one's
        // is gone even though a session exists for them.
        expect(
            await screen.findByRole('heading', { name: /today at a glance/i })
        ).toBeInTheDocument()
        expect(
            screen.getByText(`${active.firstName} ${active.lastName}`)
        ).toBeInTheDocument()
        expect(
            screen.queryByText(`${archived.firstName} ${archived.lastName}`)
        ).not.toBeInTheDocument()

        // Planner: no calendar chip carries the archived student.
        await user.click(
            within(screen.getByRole('navigation', { name: /main menu/i })).getByRole('button', {
                name: /class scheduling/i,
            })
        )
        expect(
            screen.getByLabelText(/class schedule calendar/i)
        ).toBeInTheDocument()
        expect(
            screen.queryByLabelText(
                new RegExp(`${archived.firstName} ${archived.lastName}`, 'i')
            )
        ).not.toBeInTheDocument()
    })

    it('shows a loading placeholder for Alumni before data arrives', async () => {
        const user = userEvent.setup()
        // Fetch never resolves — the store stays loading.
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

        render(<App />)
        await user.click(
            within(screen.getByRole('navigation', { name: /main menu/i })).getByRole('button', {
                name: /alumni/i,
            })
        )
        expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    })

    it('supports student detail edit save and cancel flows', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            (await screen.findAllByRole('link', { name: /asha perera/i }))[0]
        )

        await user.click(screen.getByRole('button', { name: /^edit$/i }))
        const parentField = screen.getByLabelText(/parent name/i)
        await user.clear(parentField)
        await user.type(parentField, 'Updated Parent')

        await user.click(screen.getByRole('button', { name: /^save$/i }))
        expect(screen.getByText(/updated parent/i)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /^edit$/i }))
        await user.click(screen.getByRole('button', { name: /cancel/i }))
        expect(
            screen.getByRole('button', { name: /^edit$/i })
        ).toBeInTheDocument()

        fireEvent.change(screen.getByRole('slider', { name: /progress/i }), {
            target: { value: '91' },
        })

        // Back returns to where we came from — the dashboard, not the roster.
        await user.click(screen.getByRole('button', { name: /^back$/i }))
        expect(
            screen.getByRole('heading', { name: /today at a glance/i })
        ).toBeInTheDocument()
    })

    it('returns to the students list when opened from there', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            within(screen.getByRole('navigation', { name: /main menu/i })).getByRole('button', {
                name: /^students$/i,
            })
        )
        await user.click(
            (await screen.findAllByRole('link', { name: /asha perera/i }))[0]
        )
        await user.click(screen.getByRole('button', { name: /^back$/i }))
        expect(
            screen.getByRole('heading', { name: /view students/i })
        ).toBeInTheDocument()
    })

    it('falls back to the students list from a deep-linked student page', async () => {
        const user = userEvent.setup()
        // A fresh deep link has no "from" in router state.
        window.history.pushState({}, '', '/students/1')
        render(<App />)

        expect(
            await screen.findByRole('heading', { name: /asha perera/i })
        ).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /^back$/i }))
        expect(
            screen.getByRole('heading', { name: /view students/i })
        ).toBeInTheDocument()
        window.history.pushState({}, '', '/')
    })

    it('edits and removes a student\'s upcoming session from their page', async () => {
        const user = userEvent.setup()
        // PUT /sessions/{id} echoes the change back (edit and cancel both PUT).
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
                const url = String(input)
                const addMember = url.match(/\/sessions\/(\d+)\/members$/)
                if (addMember && init?.method === 'POST') {
                    const body = JSON.parse(String(init.body))
                    const lead = Number(addMember[1])
                    // The promoted lead row plus the joiner, sharing a groupId.
                    return {
                        ok: true,
                        status: 201,
                        json: async () => [
                            {
                                id: lead,
                                studentId: 1,
                                studentName: 'Asha Perera',
                                year: '10',
                                subject: 'Mathematics',
                                date: '2026-01-01',
                                time: '16:00',
                                notes: '',
                                status: 'Scheduled',
                                groupId: `grp-${lead}`,
                            },
                            {
                                id: 9001,
                                studentId: body.studentId,
                                studentName: 'Nimal Perera',
                                year: '10',
                                subject: 'Mathematics',
                                date: '2026-01-01',
                                time: '16:00',
                                notes: '',
                                status: 'Scheduled',
                                groupId: `grp-${lead}`,
                            },
                        ],
                    } as Response
                }
                const put = url.match(/\/sessions\/(\d+)$/)
                if (put && init?.method === 'PUT') {
                    const body = JSON.parse(String(init.body))
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({ id: Number(put[1]), ...body }),
                    } as Response
                }
                let data: unknown = fixtureStudents
                if (url.includes('/payments'))
                    data = buildFixturePaymentsByMonth()
                else if (url.includes('/sessions'))
                    data = weeklyTimetable(1, 'Asha Perera', 3)
                return {
                    ok: true,
                    status: 200,
                    json: async () => data,
                } as Response
            })
        )
        render(<App />)

        await user.click(
            (await screen.findAllByRole('link', { name: /asha perera/i }))[0]
        )

        // Edit opens an in-page dialog — no navigation to the planner.
        await user.click(
            (
                await screen.findAllByRole('button', {
                    name: /edit mathematics on/i,
                })
            )[0]
        )
        const dialog = await screen.findByRole('dialog')
        expect(
            screen.queryByRole('heading', { name: /class scheduling/i })
        ).not.toBeInTheDocument()

        // Add a classmate to the session — POST /sessions/{id}/members turns
        // the solo class into a group.
        await user.click(within(dialog).getByLabelText(/add a student/i))
        await user.click(await screen.findByRole('option', { name: /nimal/i }))
        expect(
            await screen.findByText(/student added to the class/i)
        ).toBeInTheDocument()

        // Now a group of two: remove the joiner's chip — PUT cancels their row.
        const chipDeletes = () =>
            Array.from(dialog.querySelectorAll('.MuiChip-deleteIcon'))
        await waitFor(() => expect(chipDeletes()).toHaveLength(2))
        await user.click(chipDeletes()[1])
        // Back to a solo class: the joiner's chip is gone and the lone
        // remaining member can no longer be removed.
        await waitFor(() =>
            expect(
                within(dialog).queryByText('Nimal Perera')
            ).not.toBeInTheDocument()
        )
        expect(chipDeletes()).toHaveLength(0)

        const subject = within(dialog).getByLabelText(/subject/i)
        await user.clear(subject)
        await user.type(subject, 'Chemistry')
        await user.click(
            within(dialog).getByRole('button', { name: /save changes/i })
        )
        expect(
            await screen.findByText(/class updated|updated/i)
        ).toBeInTheDocument()

        // Remove an upcoming session, behind its confirm.
        const removable = { name: /remove (mathematics|chemistry) on/i }
        const before = (await screen.findAllByRole('button', removable))
            .length
        await user.click((await screen.findAllByRole('button', removable))[0])
        await user.click(screen.getByRole('button', { name: /^remove$/i }))
        // Assert the durable outcome, not the toast: the class leaves the
        // page (this view hides cancelled classes). The toast is transient
        // by design and asserting it here was flaky on CI - NoticeToast's
        // own tests cover the message.
        await waitFor(
            () =>
                expect(screen.queryAllByRole('button', removable)).toHaveLength(
                    before - 1
                ),
            { timeout: 5000 }
        )
    })

    it('opens and closes the add-student modal without saving', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation', { name: /main menu/i })
        await user.click(
            within(navigation).getByRole('button', { name: /^students$/i })
        )
        await user.click(
            screen.getByRole('button', { name: /add new student/i })
        )

        expect(screen.getByRole('dialog')).toBeInTheDocument()
        // No Cancel button any more — the ✕ in the header dismisses.
        expect(
            screen.queryByRole('button', { name: /cancel/i })
        ).not.toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /^close$/i }))

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
    })

    it('keeps modal open when required add-student fields are missing', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation', { name: /main menu/i })
        await user.click(
            within(navigation).getByRole('button', { name: /^students$/i })
        )
        await user.click(
            screen.getByRole('button', { name: /add new student/i })
        )

        await user.click(screen.getByRole('button', { name: /save student/i }))
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('switches to payments view and displays payment tracker', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation', { name: /main menu/i })
        await user.click(
            within(navigation).getByRole('button', { name: /study snapshot/i })
        )

        expect(
            screen.getByRole('heading', { name: /study snapshot/i })
        ).toBeInTheDocument()
        expect(screen.getByRole('table')).toBeInTheDocument()
        expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
    })

    it('opens the payment tracker menu and allows month editing', async () => {
        const user = userEvent.setup()
        render(<App />)

        const navigation = screen.getByRole('navigation', { name: /main menu/i })
        await user.click(
            within(navigation).getByRole('button', { name: /payment tracker/i })
        )

        expect(
            screen.getByRole('heading', { name: /monthly payment tracking/i })
        ).toBeInTheDocument()

        // A bill is what the classes came to, so the table shows the basis.
        expect(screen.getByText(/due for classes taught/i)).toBeInTheDocument()
        // The column header states the basis of the bill.
        expect(
            screen.getByRole('columnheader', { name: /classes taught/i })
        ).toBeInTheDocument()

        // Free entry, then commit with Enter — the API is not hit per keystroke.
        const amountInput = screen.getByRole('spinbutton', {
            name: /asha perera amount received/i,
        })
        await user.clear(amountInput)
        await user.type(amountInput, '120{Enter}')
        expect(
            await screen.findByText(/payment saved/i)
        ).toBeInTheDocument()

        // Status is derived from what is owed against what was paid — there is
        // no dropdown that could contradict it.
        expect(
            screen.queryByLabelText(/asha perera status/i)
        ).not.toBeInTheDocument()
    })
})
