import { useLocation, useNavigate } from 'react-router-dom'
import { paths } from '../paths'

/**
 * Returns a callback that opens a student's page, remembering where it was
 * opened from (in router state) so the page's Back button can return there —
 * the dashboard, the calendar, the roster, wherever — instead of always the
 * students list.
 */
export const useOpenStudentPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    return (studentId: number) =>
        navigate(paths.studentDetail(studentId), {
            state: { from: `${location.pathname}${location.search}` },
        })
}
