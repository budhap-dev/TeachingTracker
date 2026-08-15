import { PageLoading } from '../components/PageLoading'
import { StudentDetailsView } from '../components/StudentDetailsView'
import { StudentsView } from '../components/StudentsView'
import type { EditableStudentField, Lead, Student } from '../data/students'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useStudentForm } from '../hooks/useStudentForm'
import { paths } from '../paths'
import { addSessionMemberRequested, archiveStudentRequested, editSessionRequested, restoreStudentRequested, saveStudentRequested, setSessionStatusRequested } from '../store/store'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useOpenStudentPage } from '../hooks/useOpenStudentPage'

export const StudentsRoute = () => {
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

export const StudentDetailRoute = ({
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
