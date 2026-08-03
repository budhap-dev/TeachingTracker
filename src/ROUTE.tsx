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
import { useDocumentMeta } from './hooks/useDocumentMeta'
import {
    archiveStudentRequested,
    addSessionMemberRequested,
    createSessionRequested,
    deleteSessionRequested,
    editSessionRequested,
    restoreStudentRequested,
    savePaymentRequested,
    saveStudentRequested,
    setSessionStatusRequested,
    fetchTestimonialsRequested,
    submitTestimonialRequested,
    fetchPendingTestimonialsRequested,
    moderateTestimonialRequested,
    deleteTestimonialRequested,
    fetchContactRequested,
    updateContactRequested,
    fetchLeadsRequested,
    submitLeadRequested,
    updateLeadStatusRequested,
    fetchSiteContentRequested,
    publishSiteContentRequested,
    deleteLeadRequested,
} from './store/store'
import { activeSessions } from './data/students'
import { toDateKey } from './utils/calendar'
import { getProgressBands, getWeekLoad } from './utils/dashboard'
import type {
    EditableStudentField,
    Lead,
    ScheduledSession,
    Student,
} from './data/students'
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
import { EnquireView } from './components/EnquireView'
import { LeadsView } from './components/LeadsView'
import { OfferingsView } from './components/OfferingsView'
import { SiteEditorView } from './components/SiteEditorView'
import { PrivacyView } from './components/PrivacyView'
import { ReviewsView } from './components/ReviewsView'
import { ReviewModerationView } from './components/ReviewModerationView'
import { PageLoading } from './components/PageLoading'
import { RequireTeacher } from './components/RequireTeacher'

import { useIsAuthenticated } from '@azure/msal-react'
import { isAuthConfigured } from './auth/msal'

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
    const dispatch = useAppDispatch()
    const openStudentPage = useOpenStudentPage()
    const allStudents = useAppSelector((state) => state.students.students)
    // The open-enquiry count rides the dashboard (REQ-019): load the inbox
    // alongside the boot data so the pill is fresh on arrival.
    const leads = useAppSelector((state) => state.students.leads)
    useEffect(() => {
        dispatch(fetchLeadsRequested())
    }, [dispatch])
    const newEnquiries = useMemo(
        () => leads.filter((lead) => lead.status === 'New').length,
        [leads]
    )
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
            newEnquiries={newEnquiries}
            onOpenLeads={() => navigate(paths.leads)}
        />
    )
}

const StudentsRoute = () => {
    const openStudentPage = useOpenStudentPage()
    const dispatch = useAppDispatch()
    const location = useLocation()
    const allStudents = useAppSelector((state) => state.students.students)
    const students = useMemo(
        () => allStudents.filter((student) => !student.isArchived),
        [allStudents]
    )
    const loading = useAppSelector((state) => state.students.loading)
    const { form, setField, resetForm, prefill } = useStudentForm()
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Converting a lead (REQ-019): arriving with the enquiry in router state
    // opens the add form pre-filled, so nothing needs retyping. The lead's
    // email and goal travel in the notes — a student record has no email field.
    useEffect(() => {
        const lead = (location.state as { prefillLead?: Lead } | null)
            ?.prefillLead
        if (lead) {
            prefill({
                parentName: lead.parentName,
                contactNumber: lead.phone ?? '',
                year: lead.year,
                subjects: lead.subjects,
                mode: lead.mode === 'Either' ? 'Both' : lead.mode,
                notes: `From enquiry${lead.email ? ` (${lead.email})` : ''}: ${lead.goal}`,
            })
            setIsModalOpen(true)
        }
    }, [location.state, prefill])

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

const StudentDetailRoute = ({
    tab = 'details',
}: {
    tab?: 'details' | 'diary'
}) => {
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
            // Dirty only once the draft actually differs from the stored
            // student — entering edit mode alone must not arm Save.
            hasUnsavedChanges={Boolean(
                draftStudent &&
                    editingStudentId &&
                    JSON.stringify(draftStudent) !== JSON.stringify(student)
            )}
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
            onArchive={(id, notes) => {
                dispatch(archiveStudentRequested({ id, notes }))
                // Archiving moves the student to Alumni, so leave edit mode —
                // otherwise the stale Save/Cancel controls linger over the
                // archived banner.
                setEditingStudentId(null)
                setDraftStudent(null)
            }}
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
            onAddMember={(sessionId, sId) =>
                dispatch(
                    addSessionMemberRequested({ sessionId, studentId: sId })
                )
            }
            onRemoveMember={(memberSessionId) =>
                dispatch(
                    setSessionStatusRequested({
                        id: memberSessionId,
                        status: 'Cancelled',
                        applyToGroup: false,
                    })
                )
            }
            // The notes log saves on its own, outside profile edit mode: send
            // the whole student with the updated list through the usual upsert.
            onUpdateNotes={(datedNotes) =>
                dispatch(saveStudentRequested({ ...student, datedNotes }))
            }
            activeTab={tab}
            // Switching tab is a URL change (deep-linkable), replacing history so
            // the tabs don't pile up entries; `from` is kept so Back still works.
            onSelectTab={(next) =>
                navigate(
                    next === 'diary'
                        ? paths.studentDiary(student.id)
                        : paths.studentDetail(student.id),
                    { state: { from }, replace: true }
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
    const allStudents = useAppSelector((state) => state.students.students)
    // Archived students have finished tutoring, so they drop off the payment
    // tracker — only the active roster is billed here.
    const students = useMemo(
        () => allStudents.filter((student) => !student.isArchived),
        [allStudents]
    )
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
    // An archived student's classes drop off the planner with them — their rows
    // (including their seat in a group class) are hidden, leaving active
    // attendees untouched.
    const sessions = useMemo(() => {
        const archivedIds = new Set(
            allStudents
                .filter((student) => student.isArchived)
                .map((student) => student.id)
        )
        return scheduledSessions.filter(
            (session) => !archivedIds.has(session.studentId)
        )
    }, [allStudents, scheduledSessions])
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
            sessions={sessions}
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
            onAddMember={(sessionId, studentId) =>
                dispatch(
                    addSessionMemberRequested({ sessionId, studentId })
                )
            }
            onDeleteClass={(id) => dispatch(deleteSessionRequested(id))}
        />
    )
}

/** All application routes. Rendered inside the router by {@link App}. */
/** Public page — reads site copy, never student data. */
const OfferingsRoute = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    // The teacher-published document (REQ-008): the bundled fallback renders
    // immediately; the fetched copy swaps in when it lands.
    const content = useAppSelector((state) => state.students.siteContent)
    useEffect(() => {
        dispatch(fetchSiteContentRequested())
    }, [dispatch])
    useDocumentMeta(
        'Subjects & how lessons run — AbhiTutor',
        'Maths, physics, chemistry and biology from KS3 to GCSE and A-level, matched to your exam board — online or in person. See how lessons run, from enquiry to weekly sessions.'
    )
    return (
        <OfferingsView
            content={content}
            // The assessment CTA starts a real enquiry (REQ-018).
            onBookAssessment={() => navigate(paths.enquire)}
        />
    )
}

/**
 * The teacher's site editor (REQ-008). Edits run against the published
 * document, so it is fetched on mount like the other self-loading routes;
 * the bundled fallback renders until it lands.
 */
const SiteEditorRoute = () => {
    const dispatch = useAppDispatch()
    const content = useAppSelector((state) => state.students.siteContent)
    const publishing = useAppSelector(
        (state) => state.students.publishingSiteContent
    )
    useEffect(() => {
        dispatch(fetchSiteContentRequested())
    }, [dispatch])
    return (
        <SiteEditorView
            content={content}
            publishing={publishing}
            onPublish={(next) => dispatch(publishSiteContentRequested(next))}
        />
    )
}

/**
 * Public page — reads contact details from the store, never student data.
 * Loads on mount (like the Reviews routes): the details are public and a
 * signed-out visitor must still see them. `canEdit` turns on the inline
 * teacher editor.
 */
const ContactRouteInner = ({ canEdit }: { canEdit: boolean }) => {
    const dispatch = useAppDispatch()
    useDocumentMeta(
        'Contact us — AbhiTutor',
        'Ask about tutoring availability, subjects or a free first assessment — by email, phone or WhatsApp. We usually reply within a day.'
    )
    const contact = useAppSelector((state) => state.students.contact)
    const loading = useAppSelector((state) => state.students.contactLoading)
    const saving = useAppSelector((state) => state.students.savingContact)
    useEffect(() => {
        dispatch(fetchContactRequested())
    }, [dispatch])

    if (loading) {
        return <PageLoading />
    }
    return (
        <ContactView
            contact={contact}
            canEdit={canEdit}
            saving={saving}
            onSave={(input) => dispatch(updateContactRequested(input))}
        />
    )
}

// The auth hook only runs beneath an MsalProvider, so it lives in its own
// component chosen by isAuthConfigured — the same split the Sidebar uses. With
// auth switched off (local dev), every visitor is treated as the teacher.
const ContactRouteSignedAware = () => (
    <ContactRouteInner canEdit={useIsAuthenticated()} />
)

const ContactRoute = () =>
    isAuthConfigured() ? (
        <ContactRouteSignedAware />
    ) : (
        <ContactRouteInner canEdit />
    )

/**
 * Public page — approved reviews plus a submit form. Loads its own data on
 * mount: testimonials aren't part of the app's auth-gated boot fetches, and a
 * signed-out visitor must still see them.
 */
const ReviewsRoute = () => {
    const dispatch = useAppDispatch()
    useDocumentMeta(
        'Reviews from families — AbhiTutor',
        'What parents and students say about tutoring with AbhiTutor — real reviews, checked before they appear. Share your own experience too.'
    )
    const testimonials = useAppSelector(
        (state) => state.students.testimonials
    )
    const loading = useAppSelector(
        (state) => state.students.testimonialsLoading
    )
    const saving = useAppSelector(
        (state) => state.students.savingTestimonial
    )
    useEffect(() => {
        dispatch(fetchTestimonialsRequested())
    }, [dispatch])

    if (loading) {
        return <PageLoading />
    }
    return (
        <ReviewsView
            testimonials={testimonials}
            saving={saving}
            onSubmit={(input) => dispatch(submitTestimonialRequested(input))}
        />
    )
}

/** Teacher-only moderation queue for submitted reviews. Loads on mount. */
const ReviewModerationRoute = () => {
    const dispatch = useAppDispatch()
    const pending = useAppSelector(
        (state) => state.students.pendingTestimonials
    )
    // The published (approved) reviews too, so the teacher can take one down
    // after approval — deleting removes it from the public page as well.
    const published = useAppSelector((state) => state.students.testimonials)
    const loading = useAppSelector(
        (state) => state.students.pendingTestimonialsLoading
    )
    useEffect(() => {
        dispatch(fetchPendingTestimonialsRequested())
        dispatch(fetchTestimonialsRequested())
    }, [dispatch])

    if (loading) {
        return <PageLoading />
    }
    return (
        <ReviewModerationView
            pending={pending}
            published={published}
            onApprove={(id) =>
                dispatch(
                    moderateTestimonialRequested({ id, status: 'Approved' })
                )
            }
            onReject={(id) =>
                dispatch(
                    moderateTestimonialRequested({ id, status: 'Rejected' })
                )
            }
            onDelete={(id) => dispatch(deleteTestimonialRequested(id))}
        />
    )
}

/** Public enquiry form (REQ-018) — no auth, mirrors the Reviews submit. */
const EnquireRoute = () => {
    const dispatch = useAppDispatch()
    const saving = useAppSelector((state) => state.students.savingLead)
    const submitted = useAppSelector((state) => state.students.leadSubmitted)
    return (
        <EnquireView
            saving={saving}
            submitted={submitted}
            onSubmit={(input) => dispatch(submitLeadRequested(input))}
        />
    )
}

/**
 * Teacher's enquiries inbox (REQ-019). Loads on mount; converting a lead
 * marks it Converted and opens the add-student form pre-filled via router
 * state, so the details never need retyping.
 */
const LeadsRoute = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const leads = useAppSelector((state) => state.students.leads)
    const loading = useAppSelector((state) => state.students.leadsLoading)
    useEffect(() => {
        dispatch(fetchLeadsRequested())
    }, [dispatch])

    if (loading) {
        return <PageLoading />
    }
    return (
        <LeadsView
            leads={leads}
            onSetStatus={(id, status) =>
                dispatch(updateLeadStatusRequested({ id, status }))
            }
            onDelete={(id) => dispatch(deleteLeadRequested(id))}
            onConvert={(lead) => {
                dispatch(
                    updateLeadStatusRequested({
                        id: lead.id,
                        status: 'Converted',
                    })
                )
                navigate(paths.students, { state: { prefillLead: lead } })
            }}
        />
    )
}

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
                path="/students/:studentId/diary"
                element={teacher(<StudentDetailRoute tab="diary" />)}
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
            <Route path={paths.enquire} element={<EnquireRoute />} />
            <Route path={paths.leads} element={teacher(<LeadsRoute />)} />
            <Route
                path={paths.siteEditor}
                element={teacher(<SiteEditorRoute />)}
            />
            <Route path={paths.contact} element={<ContactRoute />} />
            {/* Public by requirement (REQ-031): the privacy notice must be
                readable by families who never sign in. */}
            <Route path={paths.privacy} element={<PrivacyView />} />
            {/* Public reviews (REQ-027); moderation is teacher-only. */}
            <Route path={paths.reviews} element={<ReviewsRoute />} />
            <Route
                path={paths.reviewsModeration}
                element={teacher(<ReviewModerationRoute />)}
            />
            <Route
                path="*"
                element={<Navigate to={paths.dashboard} replace />}
            />
        </Routes>
    </>
)
