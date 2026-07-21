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

    // What's typed in each row's "amount received" box, keyed by student, until
    // it's committed. The box is free to type in; the API is only hit when the
    // row's Save button is pressed (or Enter) — never on a keystroke or blur.
    const [amountDrafts, setAmountDrafts] = useState<Record<number, string>>({})

    // Only the active roster is billed here, so archived students' records are
    // dropped before anything is rendered or totalled.
    const activeStudentIds = useMemo(
        () => new Set(students.map((student) => student.id)),
        [students]
    )

    const monthGroup = paymentsByMonth.find(
        (group) => group.month === selectedMonth
    )
    const monthRecords = useMemo(
        () =>
            (monthGroup?.records ?? []).filter((record) =>
                activeStudentIds.has(record.studentId)
            ),
        [monthGroup, activeStudentIds]
    )

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

    // Summed from the visible records, not the server's whole-month totals, so
    // an archived student's dues and payments leave the summary with their row.
    // What is *due* is still the API's figure per record — never recomputed from
    // fees here; this only re-adds the rows that remain.
    const summary = useMemo(() => {
        const totals = monthRecords.reduce(
            (acc, record) => {
                // No-fee students are shown but never billed, so they don't
                // touch the totals or the status tally.
                if (record.feeType === 'none') {
                    return acc
                }
                acc.totalDue += record.amountDue
                acc.totalReceived += record.amountPaid
                acc.sessionsHeld += record.sessionsHeld
                if (record.status === 'Paid') acc.paidCount += 1
                if (record.status === 'Partial') acc.partialCount += 1
                if (record.status === 'Pending') acc.pendingCount += 1
                return acc
            },
            {
                totalDue: 0,
                totalReceived: 0,
                sessionsHeld: 0,
                paidCount: 0,
                partialCount: 0,
                pendingCount: 0,
            }
        )

        return {
            ...totals,
            outstanding: Math.max(totals.totalDue - totals.totalReceived, 0),
        }
    }, [monthRecords])

    /** Commits the typed amount for a row, then drops the draft so the box
     *  tracks the stored figure again. No draft (untouched box) is a no-op. */
    const commitAmount = (record: PaymentRecord) => {
        const draft = amountDrafts[record.studentId]
        if (draft === undefined) {
            return
        }
        const parsed = Number.parseInt(draft, 10)
        onUpdatePaymentRecord({
            studentId: record.studentId,
            month: selectedMonth,
            amountPaid: Number.isNaN(parsed) ? 0 : parsed,
            notes: record.notes,
        })
        setAmountDrafts((drafts) => {
            const next = { ...drafts }
            delete next[record.studentId]
            return next
        })
    }

    /** True when a row has a typed amount that differs from what's stored, so
     *  the Save button lights up only when there's something to commit. */
    const isAmountDirty = (record: PaymentRecord) => {
        const draft = amountDrafts[record.studentId]
        if (draft === undefined) {
            return false
        }
        const parsed = Number.parseInt(draft, 10)
        return (Number.isNaN(parsed) ? 0 : parsed) !== record.amountPaid
    }

    const handleNotesChange = (record: PaymentRecord, value: string) => {
        onUpdatePaymentRecord({
            studentId: record.studentId,
            month: selectedMonth,
            amountPaid: record.amountPaid,
            notes: value,
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
                        How much is owed depends on the student: per-session
                        fees build up as classes are taught, monthly students
                        pay a flat fee, and no-fee students aren&apos;t billed.
                        Record what&apos;s received and the balance updates.
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
                            Per-session students are billed only for classes
                            that already happened; monthly students pay a flat
                            fee and no-fee students aren&apos;t billed. Open a
                            student to change their details.
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

                                // A no-fee student is listed but never billed:
                                // no amount, no status, no contribution to totals.
                                const isNoFee = record.feeType === 'none'

                                return (
                                    <tr
                                        key={record.id}
                                        className={`payment-row ${isNoFee ? 'nofee' : getStatusClass(record.status)}`}
                                    >
                                        <td className="cell-title">
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
                                        <td
                                            className="payment-basis"
                                            data-label="Classes taught"
                                        >
                                            <strong>
                                                {record.sessionsHeld}
                                            </strong>
                                            <small>
                                                {isNoFee
                                                    ? 'No fee'
                                                    : record.feeType ===
                                                        'monthly'
                                                      ? `${formatCurrency(record.feePerSession)} a month (flat)`
                                                      : `× ${formatCurrency(record.feePerSession)} a session`}
                                            </small>
                                        </td>
                                        <td data-label="Due">
                                            {isNoFee
                                                ? '—'
                                                : formatCurrency(
                                                      record.amountDue
                                                  )}
                                        </td>
                                        <td
                                            className="cell-input"
                                            data-label="Amount received"
                                        >
                                            {isNoFee ? (
                                                <span className="payment-nofee">
                                                    No fee
                                                </span>
                                            ) : (
                                            <div className="payment-amount-cell">
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
                                                    value={
                                                        amountDrafts[
                                                            record.studentId
                                                        ] ?? record.amountPaid
                                                    }
                                                    onChange={(event) =>
                                                        setAmountDrafts(
                                                            (drafts) => ({
                                                                ...drafts,
                                                                [record.studentId]:
                                                                    event.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.key === 'Enter'
                                                        ) {
                                                            commitAmount(record)
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    className="payment-amount-save"
                                                    disabled={
                                                        !isAmountDirty(record)
                                                    }
                                                    onClick={() =>
                                                        commitAmount(record)
                                                    }
                                                    aria-label={`Save ${student.firstName} ${student.lastName} amount received`}
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                            )}
                                        </td>
                                        <td
                                            className="cell-input"
                                            data-label="Notes"
                                        >
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
                                        <td data-label="Outstanding">
                                            {isNoFee
                                                ? '—'
                                                : formatCurrency(
                                                      record.outstanding
                                                  )}
                                        </td>
                                        <td data-label="Status">
                                            <span
                                                className={`payment-status-pill ${isNoFee ? 'nofee' : getStatusClass(record.status)}`}
                                            >
                                                {isNoFee
                                                    ? 'No fee'
                                                    : record.status}
                                            </span>
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
