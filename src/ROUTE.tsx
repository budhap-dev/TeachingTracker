import { useEffect, useMemo, useState } from 'react'
import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
    useParams,
} from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './hooks'
import {
    createSessionRequested,
    editSessionRequested,
    savePaymentRequested,
    saveStudentRequested,
    setSessionStatusRequested,
} from './store/store'
import { activeSessions } from './data/students'
import { toDateKey } from './utils/calendar'
import { groupStudentsByYear } from './utils/studentMix'
import type { EditableStudentField, Student } from './data/students'
import { useStudentForm } from './hooks/useStudentForm'
import { paths } from './paths'
import { DashboardView } from './components/DashboardView'
import { StudentsView } from './components/StudentsView'
import { StudentDetailsView } from './components/StudentDetailsView'
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

/** Returns a callback that navigates to a student's detail page. */
const useOpenStudentPage = () => {
    const navigate = useNavigate()
    return (studentId: number) => navigate(paths.studentDetail(studentId))
}

const DashboardRoute = () => {
    const navigate = useNavigate()
    const openStudentPage = useOpenStudentPage()
    const students = useAppSelector((state) => state.students.students)
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
    }, [scheduledSessions])

    // Students by year: the old chart added students to sessions and counted
    // each student twice (once as a student, once by mode), so its "total" meant
    // nothing. Mode already has its own stat tiles.
    const overviewChart = useMemo(
        () => groupStudentsByYear(students),
        [students]
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
            onManageStudents={() => navigate(paths.students)}
            onOpenStudentPage={openStudentPage}
        />
    )
}

const StudentsRoute = () => {
    const openStudentPage = useOpenStudentPage()
    const dispatch = useAppDispatch()
    const students = useAppSelector((state) => state.students.students)
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
    const dispatch = useAppDispatch()
    const { studentId } = useParams()
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
            scheduledSessions={scheduledSessions}
            editingStudentId={editingStudentId}
            draftStudent={draftStudent}
            hasUnsavedChanges={Boolean(draftStudent && editingStudentId)}
            saving={savingStudent}
            onBack={() => navigate(paths.students)}
            onBeginEdit={(target) => {
                setEditingStudentId(target.id)
                setDraftStudent({ ...target })
            }}
            onDraftChange={(field: EditableStudentField, value) =>
                setDraftStudent((current) => ({ ...current!, [field]: value }))
            }
            onSaveDetails={handleSaveDetails}
            onCancelEdit={() => {
                setEditingStudentId(null)
                setDraftStudent(null)
            }}
        />
    )
}

const StudySnapshotRoute = () => {
    const openStudentPage = useOpenStudentPage()
    const students = useAppSelector((state) => state.students.students)
    const loading = useAppSelector((state) => state.students.loading)
    if (loading) {
        return <PageLoading />
    }
    return (
        <StudySnapshotView
            students={students}
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
    const students = useAppSelector((state) => state.students.students)
    const scheduledSessions = useAppSelector(
        (state) => state.students.scheduledSessions
    )
    const dataLoading = useAppSelector(
        (state) => state.students.loading || state.students.sessionsLoading
    )
    if (dataLoading) {
        return <PageLoading />
    }
    return (
        <ClassSchedulingView
            students={students}
            sessions={scheduledSessions}
            // Stay on the planner: the teacher books from a day modal and
            // usually has more to do on the calendar.
            onScheduleClass={(session) =>
                dispatch(createSessionRequested(session))
            }
            onEditClass={(id, changes) =>
                dispatch(editSessionRequested({ id, changes }))
            }
            onSetSessionStatus={(id, status) =>
                dispatch(setSessionStatusRequested({ id, status }))
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
