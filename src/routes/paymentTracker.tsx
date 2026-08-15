import { PageLoading } from '../components/PageLoading'
import { PaymentTrackerView } from '../components/PaymentTrackerView'
import { useAppDispatch, useAppSelector } from '../hooks'
import { savePaymentRequested } from '../store/store'
import { useMemo } from 'react'
import { useOpenStudentPage } from '../hooks/useOpenStudentPage'

export const PaymentTrackerRoute = () => {
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
