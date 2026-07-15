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
    addStudent,
    createSessionRequested,
    updatePaymentRecord,
    updateProgress,
    updateStudentDetails,
} from './store/store'
import {
    editableStudentFields,
    type Student,
    type StudentDetailField,
} from './data/students'
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
import { siteContent } from './data/siteContent'

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

    const stats = useMemo(() => {
        const onlineStudents = students.filter(
            (student) => student.mode === 'Online'
        ).length
        const faceToFaceStudents = students.filter(
            (student) => student.mode === 'Face to Face'
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

    const upcomingSessions = useMemo(
        () =>
            [...scheduledSessions].sort((left, right) =>
                `${left.date} ${left.time}`.localeCompare(
                    `${right.date} ${right.time}`
                )
            ),
        [scheduledSessions]
    )

    const overviewChart = useMemo(
        () => [
            { label: 'Students', value: students.length },
            { label: 'Face to Face', value: stats.faceToFaceStudents },
            { label: 'Online', value: stats.onlineStudents },
            { label: 'Upcoming sessions', value: upcomingSessions.length },
        ],
        [
            students.length,
            stats.faceToFaceStudents,
            stats.onlineStudents,
            upcomingSessions.length,
        ]
    )

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

        dispatch(addStudent({ ...form, progress: Number(form.progress) }))
        resetForm()
        setIsModalOpen(false)
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
    const [editingStudentId, setEditingStudentId] = useState<number | null>(
        null
    )
    const [draftStudent, setDraftStudent] = useState<Partial<Student> | null>(
        null
    )

    const student =
        students.find((item) => item.id === Number(studentId)) ?? null

    if (!student) {
        // While students are still loading, don't bounce a deep-link to the
        // list — wait for the fetch so the target page can render.
        if (loading) {
            return <p className="loading-state">Loading student…</p>
        }
        return <Navigate to={paths.students} replace />
    }

    const handleSaveDetails = (id: number) => {
        // draftStudent is a full copy of the student, so every editable field
        // is present when Save is enabled (see hasUnsavedChanges).
        editableStudentFields.forEach((field: StudentDetailField) => {
            dispatch(
                updateStudentDetails({
                    id,
                    field,
                    value: String(draftStudent![field]),
                })
            )
        })
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
            onBack={() => navigate(paths.students)}
            onBeginEdit={(target) => {
                setEditingStudentId(target.id)
                setDraftStudent({ ...target })
            }}
            onDraftChange={(field, value) =>
                setDraftStudent((current) => ({ ...current!, [field]: value }))
            }
            onSaveDetails={handleSaveDetails}
            onCancelEdit={() => {
                setEditingStudentId(null)
                setDraftStudent(null)
            }}
            onProgressChange={(id, value) =>
                dispatch(updateProgress({ id, progress: value }))
            }
        />
    )
}

const StudySnapshotRoute = () => {
    const students = useAppSelector((state) => state.students.students)
    return <StudySnapshotView students={students} />
}

const PaymentTrackerRoute = () => {
    const dispatch = useAppDispatch()
    const students = useAppSelector((state) => state.students.students)
    const paymentsByMonth = useAppSelector(
        (state) => state.students.paymentsByMonth
    )
    return (
        <PaymentTrackerView
            students={students}
            paymentsByMonth={paymentsByMonth}
            onUpdatePaymentRecord={(record) =>
                dispatch(updatePaymentRecord(record))
            }
        />
    )
}

const SchedulingRoute = () => {
    const navigate = useNavigate()
    const openStudentPage = useOpenStudentPage()
    const dispatch = useAppDispatch()
    const students = useAppSelector((state) => state.students.students)
    const scheduledSessions = useAppSelector(
        (state) => state.students.scheduledSessions
    )
    return (
        <ClassSchedulingView
            students={students}
            sessions={scheduledSessions}
            onOpenStudentPage={openStudentPage}
            onScheduleClass={(session) => {
                dispatch(createSessionRequested(session))
                navigate(paths.dashboard)
            }}
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

export const AppRoutes = () => (
    <>
        <ScrollToTop />
        <Routes>
            <Route path={paths.dashboard} element={<DashboardRoute />} />
            <Route path={paths.students} element={<StudentsRoute />} />
            <Route
                path="/students/:studentId"
                element={<StudentDetailRoute />}
            />
            <Route
                path={paths.studySnapshot}
                element={<StudySnapshotRoute />}
            />
            <Route path={paths.payments} element={<PaymentTrackerRoute />} />
            <Route path={paths.scheduling} element={<SchedulingRoute />} />
            <Route path={paths.offerings} element={<OfferingsRoute />} />
            <Route path={paths.contact} element={<ContactRoute />} />
            <Route
                path="*"
                element={<Navigate to={paths.dashboard} replace />}
            />
        </Routes>
    </>
)
