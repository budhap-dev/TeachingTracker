import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
    fetchPaymentsRequested,
    fetchSiteContentRequested,
} from '../store/store'
import { paths } from '../paths'
import { StatementView } from '../components/StatementView'
import { PageLoading } from '../components/PageLoading'

/**
 * One student's month as a printable statement (REQ-055).
 *
 * Everything it shows already exists: the payment record carries the classes
 * held behind the bill and every figure, so this route reads, it never
 * recomputes — a statement whose totals disagreed with the payment tracker
 * would be worse than no statement.
 */
export const StatementRoute = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { studentId, month } = useParams()

    const students = useAppSelector((state) => state.students.students)
    const paymentsByMonth = useAppSelector(
        (state) => state.students.paymentsByMonth
    )
    const loading = useAppSelector((state) => state.students.paymentsLoading)
    const siteName = useAppSelector(
        (state) => state.students.siteContent.siteName
    )

    useEffect(() => {
        dispatch(fetchPaymentsRequested())
        // The business names itself from the published document.
        dispatch(fetchSiteContentRequested())
    }, [dispatch])

    if (loading) {
        return <PageLoading />
    }

    const id = Number(studentId)
    const student = students.find((candidate) => candidate.id === id)
    const record = paymentsByMonth
        .find((group) => group.month === month)
        ?.records.find((candidate) => candidate.studentId === id)

    // A statement for a student or a month that has no record is nothing to
    // print — back to the tracker rather than an invented empty document.
    if (!student || !record || !month) {
        return (
            <section className="content-stack">
                <div className="card">
                    <p className="section-subtitle">
                        There is no billing record for that student and month.
                    </p>
                </div>
            </section>
        )
    }

    return (
        <StatementView
            student={student}
            record={record}
            month={month}
            siteName={siteName}
            onBack={() => navigate(paths.payments)}
        />
    )
}
