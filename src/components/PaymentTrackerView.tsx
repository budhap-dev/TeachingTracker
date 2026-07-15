import { useMemo, useState } from 'react'
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
    /** Month-grouped payments from the API, each with server-computed totals. */
    paymentsByMonth: MonthlyPaymentGroup[]
    onUpdatePaymentRecord: (record: PaymentRecordInput) => void
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

export const PaymentTrackerView = ({
    students,
    paymentsByMonth,
    onUpdatePaymentRecord,
}: PaymentTrackerViewProps) => {
    const monthOptions = useMemo(getMonthOptions, [])
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const defaultMonth = currentMonth
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth)

    const monthGroup = useMemo(
        () => paymentsByMonth.find((group) => group.month === selectedMonth),
        [paymentsByMonth, selectedMonth]
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

    // Money totals come straight from the API's monthly group; only the
    // per-status counts are derived here.
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
            totalDue: monthGroup?.totalExpected ?? 0,
            totalReceived: monthGroup?.totalReceived ?? 0,
            outstanding: monthGroup?.totalOutstanding ?? 0,
            ...counts,
        }
    }, [monthGroup, monthRecords])

    const handleUpdate = (
        studentId: number,
        field: 'status' | 'amountPaid' | 'notes',
        value: string
    ) => {
        const currentRecord = recordsByStudentId[studentId]!

        const nextStatus: PaymentStatus =
            field === 'status' ? (value as PaymentStatus) : currentRecord.status
        const nextAmount =
            field === 'amountPaid'
                ? Number.parseInt(value, 10)
                : currentRecord.amountPaid
        const nextNotes = field === 'notes' ? value : currentRecord.notes

        onUpdatePaymentRecord({
            studentId,
            month: selectedMonth,
            status: nextStatus,
            amountPaid: Number.isNaN(nextAmount) ? 0 : nextAmount,
            notes: nextNotes,
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
                    <h3>Monthly payment tracking</h3>
                    <p>
                        Track received, partial, and pending payments for each
                        student in one editable monthly table.
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
                    <span>Total expected</span>
                    <strong>{formatCurrency(summary.totalDue)}</strong>
                </div>
                <div className="card payment-summary-card status">
                    <span>Paid / partial / pending</span>
                    <strong>
                        {summary.paidCount} / {summary.partialCount} /{' '}
                        {summary.pendingCount}
                    </strong>
                </div>
            </div>

            <div className="card">
                <div className="section-header">
                    <div>
                        <h3>{selectedMonthLabel}</h3>
                        <p>
                            Update each row to reflect the current payment
                            status for that month.
                        </p>
                    </div>
                </div>
                <div className="table-wrapper payment-table-wrapper">
                    <table className="snapshot-table payment-tracker-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Fee</th>
                                <th>Amount received</th>
                                <th>Status</th>
                                <th>Notes</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => {
                                const record = recordsByStudentId[student.id]
                                if (!record) return null

                                const balance = Math.max(
                                    0,
                                    record.monthlyFee - record.amountPaid
                                )

                                return (
                                    <tr
                                        key={record.id}
                                        className={`payment-row ${getStatusClass(record.status)}`}
                                    >
                                        <td>
                                            <strong>
                                                {student.firstName}{' '}
                                                {student.lastName}
                                            </strong>
                                            <small>{student.school}</small>
                                        </td>
                                        <td>
                                            {formatCurrency(record.monthlyFee)}
                                        </td>
                                        <td>
                                            <TextField
                                                type="number"
                                                size="small"
                                                slotProps={{
                                                    htmlInput: {
                                                        'aria-label': `${student.firstName} ${student.lastName} amount received`,
                                                        min: 0,
                                                        max: record.monthlyFee,
                                                        step: 1,
                                                    },
                                                }}
                                                value={record.amountPaid}
                                                onChange={(event) =>
                                                    handleUpdate(
                                                        student.id,
                                                        'amountPaid',
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </td>
                                        <td>
                                            <select
                                                aria-label={`${student.firstName} ${student.lastName} status`}
                                                value={record.status}
                                                onChange={(event) =>
                                                    handleUpdate(
                                                        student.id,
                                                        'status',
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                <option value="Paid">
                                                    Paid
                                                </option>
                                                <option value="Partial">
                                                    Partial
                                                </option>
                                                <option value="Pending">
                                                    Pending
                                                </option>
                                            </select>
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
                                                    handleUpdate(
                                                        student.id,
                                                        'notes',
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Add a note"
                                                fullWidth
                                            />
                                        </td>
                                        <td>{formatCurrency(balance)}</td>
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
