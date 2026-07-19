import { useEffect, useMemo, useState } from 'react'
import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './hooks'
import {
    archiveStudentRequested,
    createSessionRequested,
    editSessionRequested,
    restoreStudentRequested,
    savePaymentRequested,
    saveStudentRequested,
    setSessionStatusRequested,
} from './store/store'
import { activeSessions } from './data/students'
import { toDateKey } from './utils/calendar'
import { getWeekLoad } from './utils/dashboard'
import { groupStudentsByYear } from './utils/studentMix'
import type { EditableStudentField, Student } from './data/students'
import { useStudentForm } from './hooks/useStudentForm'
import { paths } from './paths'
import { DashboardView } from './components/DashboardView'
import { StudentsView } from './components/StudentsView'
import { StudentDetailsView } from './components/StudentDetailsView'
import { AlumniView } from './components/AlumniView'
import { StudySnapshotView } from './components/StudySnapshotView'
import { PaymentTrackerView } from './components/PaymentTrackerView'
import { ClassSchedulingView } from './components/ClassSchedulingView'
import { ContactView } from './components/ContactView'
import { OfferingsView } from './components/OfferingsView'
import { PageLoading } from './components/PageLoading'
import { RequireTeacher } from './components/RequireTeacher'
import { siteContent } from './data/siteContent'

/** How many of each student's next classes the dashboard lists. */
const upcomingPerStudent = 3

/** Scrolls to the top of the page whenever the route changes. */
const ScrollToTop = () => {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0 })
    }, [pathname])
    return null
}

/**
 * Returns a callback that opens a student's page, remembering where it was
 * opened from (in router state) so the page's Back button can return there —
 * the dashboard, the calendar, the roster, wherever — instead of always the
 * students list.
 */
const useOpenStudentPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    return (studentId: number) =>
        navigate(paths.studentDetail(studentId), {
            state: { from: `${location.pathname}${location.search}` },
        })
}

const DashboardRoute = () => {
    const navigate = useNavigate()
    const openStudentPage = useOpenStudentPage()
    const allStudents = useAppSelector((state) => state.students.students)
    // Archived students (REQ-013) leave every active surface — the dashboard,
    // the roster, snapshot and the planner — for the Alumni section.
    const students = useMemo(
        () => allStudents.filter((student) => !student.isArchived),
        [allStudents]
    )
    const scheduledSessions = useAppSelector(
        (state) => state.students.scheduledSessions
    )
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

        return activeSessions(scheduledSessions)
            .filter((session) => session.date >= from)
            .sort((left, right) =>
                `${left.date} ${left.time}`.localeCompare(
                    `${right.date} ${right.time}`
                )
            )
            .filter((session) => {
                // Sorted first, so the ones kept are genuinely the earliest.
                const kept = taken.get(session.studentId) ?? 0
                if (kept >= upcomingPerStudent) {
                    return false
                }
                taken.set(session.studentId, kept + 1)
                return true
            })
            .map((session) => {
                // Resolve name and year from the live student record. The
                // session carries a denormalised copy frozen at booking time,
                // which goes stale when a student is renamed — the dashboard
                // was the last screen still trusting that copy.
                const student = studentsById.get(session.studentId)
                return student
                    ? {
                          ...session,
                          studentName: `${student.firstName} ${student.lastName}`,
                          year: student.year,
                      }
                    : session
            })
    }, [scheduledSessions, students])

    // Students by year: the old chart added students to sessions and counted
    // each student twice (once as a student, once by mode), so its "total" meant
    // nothing. Mode already has its own stat tiles.
    const overviewChart = useMemo(
        () => groupStudentsByYear(students),
        [students]
    )

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
            overviewChart={overviewChart}
            weekLoad={weekLoad}
            onManageStudents={() => navigate(paths.students)}
            onOpenStudentPage={openStudentPage}
            onOpenDay={(dateKey) =>
                navigate(`${paths.scheduling}?day=${dateKey}`)
            }
        />
    )
}

const StudentsRoute = () => {
    const openStudentPage = useOpenStudentPage()
    const dispatch = useAppDispatch()
    const allStudents = useAppSelector((state) => state.students.students)
    const students = useMemo(
        () => allStudents.filter((student) => !student.isArchived),
        [allStudents]
    )
    const loading = useAppSelector((state) => state.students.loading)
    const { form, setField, resetForm } = useStudentForm()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (
            !form.firstName ||
            !form.lastName ||
            form.subjects.length === 0 ||
            !form.school ||
            !form.year
        ) {
            return
        }

        dispatch(
            saveStudentRequested({
                ...form,
                progress: Number(form.progress),
                fees: Number(form.fees),
            })
        )
        resetForm()
        setIsModalOpen(false)
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <StudentsView
            students={students}
            loading={loading}
            isModalOpen={isModalOpen}
            form={form}
            onOpenModal={() => setIsModalOpen(true)}
            onCloseModal={() => setIsModalOpen(false)}
            onFormChange={setField}
            onSubmit={handleSubmit}
            onOpenStudentPage={openStudentPage}
        />
    )
}

const StudentDetailRoute = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useAppDispatch()
    const openStudentPage = useOpenStudentPage()
    const { studentId } = useParams()

    // Return to wherever the teacher came from — carried in router state by
    // useOpenStudentPage. A fresh deep link has no such state, so fall back to
    // the students list.
    const from = (location.state as { from?: string } | null)?.from
    const goBack = () => navigate(from ?? paths.students)
    const students = useAppSelector((state) => state.students.students)
    const loading = useAppSelector((state) => state.students.loading)
    const scheduledSessions = useAppSelector(
        (state) => state.students.scheduledSessions
    )
    const savingStudent = useAppSelector(
        (state) => state.students.savingStudent
    )
    const [editingStudentId, setEditingStudentId] = useState<number | null>(
        null
    )
    const [draftStudent, setDraftStudent] = useState<Student | null>(null)

    const student =
        students.find((item) => item.id === Number(studentId)) ?? null

    if (!student) {
        // While students are still loading, don't bounce a deep-link to the
        // list — wait for the fetch so the target page can render.
        if (loading) {
            return <PageLoading />
        }
        return <Navigate to={paths.students} replace />
    }

    const handleSaveDetails = () => {
        // The draft is a full copy, so the whole student goes to the API in one
        // request and the server's response becomes the stored truth.
        dispatch(saveStudentRequested(draftStudent!))
        setEditingStudentId(null)
        setDraftStudent(null)
    }

    return (
        <StudentDetailsView
            student={student}
            students={students}
            scheduledSessions={scheduledSessions}
            editingStudentId={editingStudentId}
            draftStudent={draftStudent}
            hasUnsavedChanges={Boolean(draftStudent && editingStudentId)}
            saving={savingStudent}
            onBack={goBack}
            onBeginEdit={(target) => {
                setEditingStudentId(target.id)
                setDraftStudent({ ...target })
            }}
            onDraftChange={(field: EditableStudentField, value) =>
                setDraftStudent((current) => ({ ...current!, [field]: value }))
            }
            onOpenStudentPage={openStudentPage}
            onSaveDetails={handleSaveDetails}
            onCancelEdit={() => {
                setEditingStudentId(null)
                setDraftStudent(null)
            }}
            onArchive={(id, notes) =>
                dispatch(archiveStudentRequested({ id, notes }))
            }
            onRestore={(id) => dispatch(restoreStudentRequested(id))}
            onEditSession={(id, changes, applyToGroup) =>
                dispatch(editSessionRequested({ id, changes, applyToGroup }))
            }
            onCancelSession={(session) =>
                dispatch(
                    setSessionStatusRequested({
                        id: session.id,
                        status: 'Cancelled',
                        applyToGroup: false,
                    })
                )
            }
        />
    )
}

const AlumniRoute = () => {
    const openStudentPage = useOpenStudentPage()
    const allStudents = useAppSelector((state) => state.students.students)
    const loading = useAppSelector((state) => state.students.loading)
    const alumni = useMemo(
        () => allStudents.filter((student) => student.isArchived),
        [allStudents]
    )
    if (loading) {
        return <PageLoading />
    }
    return <AlumniView alumni={alumni} onOpenStudentPage={openStudentPage} />
}

const StudySnapshotRoute = () => {
    const openStudentPage = useOpenStudentPage()
    const allStudents = useAppSelector((state) => state.students.students)
    const students = useMemo(
        () => allStudents.filter((student) => !student.isArchived),
        [allStudents]
    )
    const sessions = useAppSelector(
        (state) => state.students.scheduledSessions
    )
    const loading = useAppSelector((state) => state.students.loading)
    if (loading) {
        return <PageLoading />
    }
    return (
        <StudySnapshotView
            students={students}
            sessions={sessions}
            onOpenStudentPage={openStudentPage}
        />
    )
}

const PaymentTrackerRoute = () => {
    const dispatch = useAppDispatch()
    const openStudentPage = useOpenStudentPage()
    const students = useAppSelector((state) => state.students.students)
    const paymentsByMonth = useAppSelector(
        (state) => state.students.paymentsByMonth
    )
    const dataLoading = useAppSelector(
        (state) => state.students.paymentsLoading || state.students.loading
    )
    if (dataLoading) {
        return <PageLoading />
    }
    return (
        <PaymentTrackerView
            students={students}
            paymentsByMonth={paymentsByMonth}
            onUpdatePaymentRecord={(record) =>
                dispatch(savePaymentRequested(record))
            }
            onOpenStudentPage={openStudentPage}
        />
    )
}

const SchedulingRoute = () => {
    const dispatch = useAppDispatch()
    const [searchParams] = useSearchParams()
    const allStudents = useAppSelector((state) => state.students.students)
    // Archived students can't be booked into new classes — only the active
    // roster appears in the planner's picker.
    const students = useMemo(
        () => allStudents.filter((student) => !student.isArchived),
        [allStudents]
    )
    const scheduledSessions = useAppSelector(
        (state) => state.students.scheduledSessions
    )
    const dataLoading = useAppSelector(
        (state) => state.students.loading || state.students.sessionsLoading
    )
    if (dataLoading) {
        return <PageLoading />
    }
    // Dashboard week bars land here with ?day=YYYY-MM-DD, straight into
    // that day's modal.
    return (
        <ClassSchedulingView
            students={students}
            sessions={scheduledSessions}
            initialOpenDate={searchParams.get('day') ?? undefined}
            // Stay on the planner: the teacher books from a day modal and
            // usually has more to do on the calendar.
            onScheduleClass={(input) =>
                dispatch(createSessionRequested(input))
            }
            onEditClass={(id, changes, applyToGroup) =>
                dispatch(editSessionRequested({ id, changes, applyToGroup }))
            }
            onSetSessionStatus={(id, status, applyToGroup) =>
                dispatch(
                    setSessionStatusRequested({ id, status, applyToGroup })
                )
            }
        />
    )
}

/** All application routes. Rendered inside the router by {@link App}. */
/** Public page — reads site copy, never student data. */
const OfferingsRoute = () => (
    <OfferingsView
        intro={siteContent.offerings.intro}
        subjects={siteContent.offerings.subjects}
        approach={siteContent.offerings.approach}
    />
)

/** Public page — reads site copy, never student data. */
const ContactRoute = () => (
    <ContactView
        email={siteContent.contact.email}
        phone={siteContent.contact.phone}
    />
)

/** Teacher-only route element: gated by sign-in when auth is configured. */
const teacher = (page: JSX.Element) => <RequireTeacher>{page}</RequireTeacher>

export const AppRoutes = () => (
    <>
        <ScrollToTop />
        <Routes>
            <Route
                path={paths.dashboard}
                element={teacher(<DashboardRoute />)}
            />
            <Route path={paths.students} element={teacher(<StudentsRoute />)} />
            <Route
                path="/students/:studentId"
                element={teacher(<StudentDetailRoute />)}
            />
            <Route
                path={paths.studySnapshot}
                element={teacher(<StudySnapshotRoute />)}
            />
            <Route path={paths.alumni} element={teacher(<AlumniRoute />)} />
            <Route
                path={paths.payments}
                element={teacher(<PaymentTrackerRoute />)}
            />
            <Route
                path={paths.scheduling}
                element={teacher(<SchedulingRoute />)}
            />
            {/* Public by requirement (REQ-006/007): reachable signed out. */}
            <Route path={paths.offerings} element={<OfferingsRoute />} />
            <Route path={paths.contact} element={<ContactRoute />} />
            <Route
                path="*"
                element={<Navigate to={paths.dashboard} replace />}
            />
        </Routes>
    </>
)
