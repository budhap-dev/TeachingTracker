import { useMemo, useState } from 'react'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import { Button, TextField } from '@mui/material'
import type {
    MonthlyPaymentGroup,
    PaymentRecord,
    PaymentRecordInput,
    PaymentStatus,
    Student,
} from '../data/students'

type PaymentTrackerViewProps = {
    students: Student[]
    /** Month-grouped bills from the API, each with server-computed totals. */
    paymentsByMonth: MonthlyPaymentGroup[]
    onUpdatePaymentRecord: (record: PaymentRecordInput) => void
    onOpenStudentPage: (studentId: number) => void
}

const monthLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
]

const getMonthOptions = () => {
    const year = new Date().getFullYear()
    return monthLabels.map((label, index) => ({
        value: `${year}-${String(index + 1).padStart(2, '0')}`,
        label: `${label} ${year}`,
    }))
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
    }).format(value)

const getStatusClass = (status: PaymentStatus) => status.toLowerCase()

const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const PaymentTrackerView = ({
    students,
    paymentsByMonth,
    onUpdatePaymentRecord,
    onOpenStudentPage,
}: PaymentTrackerViewProps) => {
    const monthOptions = useMemo(getMonthOptions, [])
    const currentMonth = useMemo(getCurrentMonth, [])
    const [selectedMonth, setSelectedMonth] = useState(currentMonth)

    const monthGroup = paymentsByMonth.find(
        (group) => group.month === selectedMonth
    )
    const monthRecords = useMemo(() => monthGroup?.records ?? [], [monthGroup])

    const recordsByStudentId = useMemo(
        () =>
            monthRecords.reduce<Record<number, PaymentRecord>>(
                (acc, record) => {
                    acc[record.studentId] = record
                    return acc
                },
                {}
            ),
        [monthRecords]
    )

    // Totals come from the API — it alone decides what is due, from the classes
    // that took place. Only the per-status tally is counted here.
    const summary = useMemo(() => {
        const counts = monthRecords.reduce(
            (acc, record) => {
                if (record.status === 'Paid') acc.paidCount += 1
                if (record.status === 'Partial') acc.partialCount += 1
                if (record.status === 'Pending') acc.pendingCount += 1
                return acc
            },
            { paidCount: 0, partialCount: 0, pendingCount: 0 }
        )

        return {
            totalDue: monthGroup?.totalDue ?? 0,
            totalReceived: monthGroup?.totalReceived ?? 0,
            outstanding: monthGroup?.totalOutstanding ?? 0,
            sessionsHeld: monthGroup?.sessionsHeld ?? 0,
            ...counts,
        }
    }, [monthGroup, monthRecords])

    const handleAmountChange = (record: PaymentRecord, value: string) => {
        const parsed = Number.parseInt(value, 10)
        onUpdatePaymentRecord({
            studentId: record.studentId,
            month: selectedMonth,
            amountPaid: Number.isNaN(parsed) ? 0 : parsed,
            notes: record.notes,
        })
    }

    const handleNotesChange = (record: PaymentRecord, value: string) => {
        onUpdatePaymentRecord({
            studentId: record.studentId,
            month: selectedMonth,
            amountPaid: record.amountPaid,
            notes: value,
        })
    }

    /** Settles the month: the API pays exactly what the classes came to. */
    const handleMarkPaid = (record: PaymentRecord) => {
        onUpdatePaymentRecord({
            studentId: record.studentId,
            month: selectedMonth,
            notes: record.notes,
        })
    }

    const selectedMonthLabel = monthOptions.find(
        (option) => option.value === selectedMonth
    )!.label

    return (
        <section className="content-stack payment-tracker-view">
            <div className="card payment-tracker-hero">
                <div>
                    <p className="eyebrow">Payment tracker</p>
                    <h3 className="page-heading">
                        <PaymentsOutlinedIcon fontSize="small" />
                        Monthly payment tracking
                    </h3>
                    <p>
                        Each student owes for the classes that actually took
                        place. A month builds up as lessons are taught — mark it
                        paid once it&apos;s settled.
                    </p>
                </div>
                <div className="payment-month-filter">
                    <label htmlFor="payment-month">Month</label>
                    <select
                        id="payment-month"
                        value={selectedMonth}
                        onChange={(event) =>
                            setSelectedMonth(event.target.value)
                        }
                    >
                        {monthOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="payment-summary-grid">
                <div className="card payment-summary-card received">
                    <span>Payments received</span>
                    <strong>{formatCurrency(summary.totalReceived)}</strong>
                </div>
                <div className="card payment-summary-card pending">
                    <span>Yet to be paid</span>
                    <strong>{formatCurrency(summary.outstanding)}</strong>
                </div>
                <div className="card payment-summary-card total">
                    <span>Due for classes taught</span>
                    <strong>{formatCurrency(summary.totalDue)}</strong>
                    <small>{summary.sessionsHeld} classes taught</small>
                </div>
                <div className="card payment-summary-card status">
                    <span>Payment status</span>
                    {/* A small table beats "2 / 1 / 3": each status is named
                        over its count, in its own colour — columns, so the
                        card stays as short as its neighbours. */}
                    <table className="status-mini-table">
                        <thead>
                            <tr>
                                <th scope="col" className="paid">
                                    Paid
                                </th>
                                <th scope="col" className="partial">
                                    Partial
                                </th>
                                <th scope="col" className="pending">
                                    Pending
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{summary.paidCount}</td>
                                <td>{summary.partialCount}</td>
                                <td>{summary.pendingCount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                <div className="section-header">
                    <div>
                        <h3>{selectedMonthLabel}</h3>
                        <p>
                            Only classes that already happened are billed —
                            cancelled and future ones are not. Open a student to
                            change their details.
                        </p>
                    </div>
                </div>
                <div className="table-wrapper payment-table-wrapper">
                    <table className="snapshot-table payment-tracker-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Classes taught</th>
                                <th>Due</th>
                                <th>Amount received</th>
                                <th>Notes</th>
                                <th>Outstanding</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => {
                                const record = recordsByStudentId[student.id]
                                if (!record) return null

                                return (
                                    <tr
                                        key={record.id}
                                        className={`payment-row ${getStatusClass(record.status)}`}
                                    >
                                        <td>
                                            <button
                                                type="button"
                                                className="payment-student-link"
                                                onClick={() =>
                                                    onOpenStudentPage(
                                                        student.id
                                                    )
                                                }
                                            >
                                                {student.firstName}{' '}
                                                {student.lastName}
                                            </button>
                                            <small>{student.school}</small>
                                        </td>
                                        <td className="payment-basis">
                                            <strong>
                                                {record.sessionsHeld}
                                            </strong>
                                            <small>
                                                ×{' '}
                                                {formatCurrency(
                                                    record.feePerSession
                                                )}{' '}
                                                a session
                                            </small>
                                        </td>
                                        <td>
                                            {formatCurrency(record.amountDue)}
                                        </td>
                                        <td>
                                            <TextField
                                                type="number"
                                                size="small"
                                                slotProps={{
                                                    htmlInput: {
                                                        'aria-label': `${student.firstName} ${student.lastName} amount received`,
                                                        min: 0,
                                                        step: 1,
                                                    },
                                                }}
                                                value={record.amountPaid}
                                                onChange={(event) =>
                                                    handleAmountChange(
                                                        record,
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </td>
                                        <td>
                                            <TextField
                                                size="small"
                                                slotProps={{
                                                    htmlInput: {
                                                        'aria-label': `${student.firstName} ${student.lastName} payment notes`,
                                                    },
                                                }}
                                                value={record.notes}
                                                onChange={(event) =>
                                                    handleNotesChange(
                                                        record,
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Add a note"
                                                fullWidth
                                            />
                                        </td>
                                        <td>
                                            {formatCurrency(record.outstanding)}
                                        </td>
                                        <td>
                                            <span
                                                className={`payment-status-pill ${getStatusClass(record.status)}`}
                                            >
                                                {record.status}
                                            </span>
                                            {record.outstanding > 0 && (
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    onClick={() =>
                                                        handleMarkPaid(record)
                                                    }
                                                    aria-label={`Mark ${student.firstName} ${student.lastName} as paid`}
                                                >
                                                    Mark paid
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="payment-row-legend">
                    <span className="paid">Paid</span>
                    <span className="partial">Partial</span>
                    <span className="pending">Pending</span>
                </div>
                <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setSelectedMonth(currentMonth)}
                >
                    Reset to current month
                </Button>
            </div>
        </section>
    )
}
