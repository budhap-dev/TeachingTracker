import { DashboardView } from '../components/DashboardView'
import { PageLoading } from '../components/PageLoading'
import { activeSessions } from '../data/students'
import type { ScheduledSession } from '../data/students'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
    deleteReminderRequested,
    fetchRemindersRequested,
    saveReminderRequested,
} from '../store/store'
import { paths } from '../paths'
import { selectNewEnquiries, selectPendingReviews } from '../store/waiting'
import { toDateKey } from '../utils/calendar'
import { splitReminders } from '../utils/reminders'
import { useMinuteTick } from '../hooks/useMinuteTick'
import { getProgressBands, getWeekLoad } from '../utils/dashboard'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOpenStudentPage } from '../hooks/useOpenStudentPage'

/** How many of each student's next classes the dashboard lists. */
const upcomingPerStudent = 3

export const DashboardRoute = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const openStudentPage = useOpenStudentPage()
    const allStudents = useAppSelector((state) => state.students.students)
    // What is waiting (REQ-019, widened by REQ-056): both counts come from
    // the shared selectors, so the dashboard, the nav and the app badge can
    // never disagree. The data itself loads with the boot fetches.
    // The teacher's own reminders ride the same list as the classes
    // (REQ-057), so they load with the dashboard.
    const allReminders = useAppSelector((state) => state.students.reminders)
    useEffect(() => {
        dispatch(fetchRemindersRequested())
    }, [dispatch])
    /*
     * A reminder that has been and gone leaves "what's coming up" and waits in
     * "Past reminders" instead (REQ-062). Left unfiltered it led the
     * dashboard for ever — last week's "order the new workbooks" above
     * tomorrow's classes — and a list that keeps what the teacher has already
     * dealt with stops being read at all.
     *
     * It moves rather than vanishing, which is what makes going by the CLOCK
     * safe: a 3pm reminder can leave at 3pm precisely because the teacher who
     * opens the dashboard at five can still find it. Nothing is deleted — the
     * retention schedule (REQ-033) keeps that the teacher's own call, and the
     * delete button rides along to the section below.
     *
     * `now` ticks each minute, so a reminder crosses over while the dashboard
     * is open rather than at the next reload.
     */
    const now = useMinuteTick()
    const { upcoming: reminders, past: pastReminders } = useMemo(
        () => splitReminders(allReminders, now),
        [allReminders, now]
    )

    const newEnquiries = useAppSelector(selectNewEnquiries)
    const pendingReviews = useAppSelector(selectPendingReviews)
    // Archived students (REQ-013) leave every active surface — the dashboard,
    // the roster, snapshot and the planner — for the Alumni section.
    const students = useMemo(
        () => allStudents.filter((student) => !student.isArchived),
        [allStudents]
    )
    const allSessions = useAppSelector(
        (state) => state.students.scheduledSessions
    )
    // Archived students leave the dashboard, so their classes leave with them:
    // both the upcoming list and the week-load bars ignore their rows.
    const scheduledSessions = useMemo(() => {
        const archivedIds = new Set(
            allStudents
                .filter((student) => student.isArchived)
                .map((student) => student.id)
        )
        return allSessions.filter(
            (session) => !archivedIds.has(session.studentId)
        )
    }, [allStudents, allSessions])
    const dataLoading = useAppSelector(
        (state) => state.students.loading || state.students.sessionsLoading
    )

    const stats = useMemo(() => {
        // A "Both" student learns in each mode, so they count in both tiles —
        // the tiles read "learners using this mode", not a partition.
        const onlineStudents = students.filter(
            (student) => student.mode === 'Online' || student.mode === 'Both'
        ).length
        const faceToFaceStudents = students.filter(
            (student) =>
                student.mode === 'Face to Face' || student.mode === 'Both'
        ).length
        const avgProgress = students.length
            ? Math.round(
                  students.reduce((sum, s) => sum + s.progress, 0) /
                      students.length
              )
            : 0
        return {
            onlineStudents,
            faceToFaceStudents,
            avgProgress,
            totalStudents: students.length,
        }
    }, [students])

    const upcomingSessions = useMemo(() => {
        // "Upcoming" is each student's next few classes — never one that has
        // already happened, and never a cancelled one, which is not upcoming
        // and must not inflate the count.
        //
        // Capped per student rather than by a date window: with a weekly
        // timetable the whole future runs past a hundred classes, while a
        // window would show nothing at all for a student whose next class
        // happens to fall outside it.
        const from = toDateKey(new Date())
        const taken = new Map<number, number>()
        const studentsById = new Map(students.map((s) => [s.id, s]))

        const futureRows = activeSessions(scheduledSessions)
            .filter((session) => session.date >= from)
            .sort((left, right) =>
                `${left.date} ${left.time}`.localeCompare(
                    `${right.date} ${right.time}`
                )
            )

        // Fold a group class — linked rows sharing a groupId — into one entry,
        // so the dashboard lists it once rather than once per attendee.
        // Insertion order is preserved, so entries stay earliest-first.
        const entries: { rows: ScheduledSession[] }[] = []
        const byKey = new Map<string, { rows: ScheduledSession[] }>()
        futureRows.forEach((row) => {
            const key = row.groupId ?? `solo-${row.id}`
            const existing = byKey.get(key)
            if (existing) {
                existing.rows.push(row)
            } else {
                const entry = { rows: [row] }
                byKey.set(key, entry)
                entries.push(entry)
            }
        })

        return entries
            .filter((entry) => {
                // Sorted first, so the ones kept are genuinely the earliest. A
                // group stays while at least one attendee is still under the
                // cap, and counts against every attendee's tally.
                const under = entry.rows.some(
                    (row) =>
                        (taken.get(row.studentId) ?? 0) < upcomingPerStudent
                )
                if (!under) {
                    return false
                }
                entry.rows.forEach((row) =>
                    taken.set(
                        row.studentId,
                        (taken.get(row.studentId) ?? 0) + 1
                    )
                )
                return true
            })
            .map((entry) => {
                const lead = entry.rows[0]
                // Resolve name and year from the live student record. The row
                // carries a denormalised copy frozen at booking time, which
                // goes stale when a student is renamed.
                const members = entry.rows
                    .map((row) => {
                        const student = studentsById.get(row.studentId)
                        return student
                            ? {
                                  studentId: row.studentId,
                                  studentName: `${student.firstName} ${student.lastName}`,
                                  year: student.year,
                              }
                            : {
                                  studentId: row.studentId,
                                  studentName: row.studentName,
                                  year: row.year,
                              }
                    })
                    .sort((a, b) => a.studentName.localeCompare(b.studentName))
                return {
                    id: lead.id,
                    date: lead.date,
                    time: lead.time,
                    subject: lead.subject,
                    notes: lead.notes,
                    members,
                }
            })
    }, [scheduledSessions, students])

    // Students by year: the old chart added students to sessions and counted
    // Progress bands: who's on track, developing, or needs a follow-up — far
    // more actionable on a dashboard than a headcount by year.
    const attention = useMemo(() => getProgressBands(students), [students])

    const todayKey = toDateKey(new Date())
    const weekLoad = useMemo(
        () => getWeekLoad(scheduledSessions, new Date()),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the
        // day, not the Date instance, so the memo is honest across renders.
        [scheduledSessions, todayKey]
    )

    // After the hooks: a loading gate above them would break hook order.
    if (dataLoading) {
        return <PageLoading />
    }

    return (
        <DashboardView
            stats={stats}
            upcomingSessions={upcomingSessions}
            attention={attention}
            weekLoad={weekLoad}
            onManageStudents={() => navigate(paths.students)}
            onOpenSnapshot={() => navigate(paths.studySnapshot)}
            onOpenStudentPage={openStudentPage}
            onOpenDay={(dateKey) =>
                navigate(`${paths.scheduling}?day=${dateKey}`)
            }
            reminders={reminders}
            pastReminders={pastReminders}
            onSaveReminder={(id, input) =>
                dispatch(saveReminderRequested({ id, input }))
            }
            onDeleteReminder={(id) => dispatch(deleteReminderRequested(id))}
            newEnquiries={newEnquiries}
            onOpenLeads={() => navigate(paths.leads)}
            pendingReviews={pendingReviews}
            onOpenModeration={() => navigate(paths.reviewsModeration)}
        />
    )
}
