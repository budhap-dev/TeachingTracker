import { AlumniView } from '../components/AlumniView'
import { PageLoading } from '../components/PageLoading'
import { useAppSelector } from '../hooks'
import { useMemo } from 'react'
import { useOpenStudentPage } from '../hooks/useOpenStudentPage'

export const AlumniRoute = () => {
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
