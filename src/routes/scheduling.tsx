import { ClassNotesView } from '../components/ClassNotesView'
import { ClassSchedulingView } from '../components/ClassSchedulingView'
import { PageLoading } from '../components/PageLoading'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { paths } from '../paths'
import { addSessionMemberRequested, createSessionRequested, deleteSessionRequested, editSessionRequested, setSessionStatusRequested } from '../store/store'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * Class notes (REQ-052): the same sessions the planner shows, read as a
 * chronological list of what was written. Archived students' classes stay
 * out, exactly as they do on the planner.
 */
export const ClassNotesRoute = () => {
    const navigate = useNavigate()
    useDocumentMeta(
        'Class notes — AbhiTutor',
        'Everything written on your classes, newest first.'
    )
    const allStudents = useAppSelector((state) => state.students.students)
    const scheduledSessions = useAppSelector(
        (state) => state.students.scheduledSessions
    )
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
    // The planner is the only way in, so Back always means the planner.
    return (
        <ClassNotesView
            sessions={sessions}
            onBack={() => navigate(paths.scheduling)}
        />
    )
}

export const SchedulingRoute = () => {
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
    // that day's modal; a class-notes row adds &entry= to land on its own
    // class rather than the day's first one (REQ-052).
    return (
        <ClassSchedulingView
            students={students}
            sessions={sessions}
            initialOpenDate={searchParams.get('day') ?? undefined}
            initialOpenEntryKey={searchParams.get('entry') ?? undefined}
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
