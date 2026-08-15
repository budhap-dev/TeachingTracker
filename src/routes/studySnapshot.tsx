import { PageLoading } from '../components/PageLoading'
import { StudySnapshotView } from '../components/StudySnapshotView'
import { useAppSelector } from '../hooks'
import { useMemo } from 'react'
import { useOpenStudentPage } from '../hooks/useOpenStudentPage'

export const StudySnapshotRoute = () => {
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
