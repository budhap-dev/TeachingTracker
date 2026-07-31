import { Fragment, useMemo, useState } from 'react'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
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

/** '2026-07-03' → '03 Jul 2026'. Parsed at local midnight so the day is stable. */
const formatDate = (isoDate: string) =>
    new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })

/** '2026-07-03' → 'Thu'. */
const dayOfWeek = (isoDate: string) =>
    new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
        weekday: 'short',
    })

/** Minutes as hours and minutes: 90 → '1h 30m', 60 → '1h', 45 → '45m'. */
const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours && mins) return `${hours}h ${mins}m`
    if (hours) return `${hours}h`
    return `${mins}m`
}

/** A duration cell — an em dash when there's no time to show. */
const durationCell = (minutes: number) =>
    minutes > 0 ? formatDuration(minutes) : '—'

/** How many student tints the breakdown cycles through (see _components.scss). */
const studentGroupCount = 5

/**
 * One line for the Session breakdown table and the CSV export. A held class
 * carries a date/subject/duration; a monthly student's flat fee is a single
 * dateless row labelled as a monthly fee, after the classes it covers.
 */
type SessionBreakdownRow =
    | {
          kind: 'session'
          studentId: number
          studentName: string
          date: string
          subject: string
          durationMinutes: number
          fee: number
          /** True on a monthly student's class rows: the flat fee covers
              them, so no per-row fee is shown — the fee appears once, on
              the student's monthly-fee row. */
          coveredByMonthlyFee: boolean
      }
    | {
          kind: 'monthly'
          studentId: number
          studentName: string
          durationMinutes: number
          fee: number
      }


/** Orders rows by student, then date, a student's monthly-fee row last —
 *  '9999' sorts after any ISO date, so the charge line follows the dates
 *  its flat fee covers. */
const sortKey = (row: SessionBreakdownRow) =>
    `${row.studentName} ${row.kind === 'monthly' ? '9999' : row.date}`

/** Wraps a CSV field, quoting and escaping only when it needs it. */
const csvField = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value

/** Builds the CSV text for the visible rows — headers then one row each. */
const buildCsv = (rows: SessionBreakdownRow[], monthLabel: string): string => {
    const header = ['Student', 'Date', 'Day', 'Subject', 'Duration (min)', 'Fee']
    // The visible table's values, so the export matches what's on screen. A
    // monthly row spans the month, so its Date is the month and its Day blank;
    // the classes its flat fee covers export a blank Fee, so the fee appears
    // once and the column still sums to the total.
    const lines = rows.map((row) =>
        [
            csvField(row.studentName),
            row.kind === 'monthly' ? monthLabel : formatDate(row.date),
            row.kind === 'monthly' ? '' : dayOfWeek(row.date),
            csvField(row.kind === 'monthly' ? 'Monthly fee' : row.subject),
            String(row.durationMinutes),
            row.kind === 'session' && row.coveredByMonthlyFee
                ? ''
                : String(row.fee),
        ].join(',')
    )
    return [header.join(','), ...lines].join('\n')
}

/** Triggers a browser download of the CSV text as a .csv file. */
const downloadCsv = (filename: string, csv: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

type PaymentTab = 'summary' | 'sessions'

export const PaymentTrackerView = ({
    students,
    paymentsByMonth,
    onUpdatePaymentRecord,
    onOpenStudentPage,
}: PaymentTrackerViewProps) => {
    const monthOptions = useMemo(getMonthOptions, [])
    const currentMonth = useMemo(getCurrentMonth, [])
    const [selectedMonth, setSelectedMonth] = useState(currentMonth)
    // Which tab is showing, and (on the session breakdown) whose sessions —
    // 'all' or a student id as a string.
    const [tab, setTab] = useState<PaymentTab>('summary')
    const [studentFilter, setStudentFilter] = useState('all')

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

    // The billable records the breakdown itemises: a per-session student with
    // classes held (one row each), or a monthly student (one flat-fee row).
    // No-fee students, and per-session students with no classes, have nothing.
    const billableRecords = useMemo(
        () =>
            monthRecords.filter((record) => {
                const feeType = record.feeType ?? 'per-session'
                if (feeType === 'monthly') return true
                if (feeType === 'none') return false
                return record.sessions.length > 0
            }),
        [monthRecords]
    )

    // Keep the filter valid: if the chosen student isn't billable this month
    // (e.g. after switching month), fall back to "all" without a stray effect.
    const effectiveFilter = billableRecords.some(
        (record) => String(record.studentId) === studentFilter
    )
        ? studentFilter
        : 'all'

    // One flat row per held session — a monthly student's classes included —
    // plus a single dateless charge row for each monthly student's flat fee.
    // Student then date, the shape the table renders and the CSV exports.
    const sessionRows = useMemo<SessionBreakdownRow[]>(
        () =>
            billableRecords
                .filter(
                    (record) =>
                        effectiveFilter === 'all' ||
                        String(record.studentId) === effectiveFilter
                )
                .flatMap((record): SessionBreakdownRow[] => {
                    const isMonthly =
                        (record.feeType ?? 'per-session') === 'monthly'
                    const classRows = record.sessions.map((session) => ({
                        kind: 'session' as const,
                        studentId: record.studentId,
                        studentName: record.studentName,
                        ...session,
                        coveredByMonthlyFee: isMonthly,
                    }))
                    return isMonthly
                        ? [
                              // The dates the fee covered, then the fee itself
                              // as the one charged line.
                              ...classRows,
                              {
                                  kind: 'monthly' as const,
                                  studentId: record.studentId,
                                  studentName: record.studentName,
                                  // The whole month's teaching time, and the
                                  // flat monthly fee.
                                  durationMinutes: record.totalDurationMinutes,
                                  fee: record.amountDue,
                              },
                          ]
                        : classRows
                })
                .sort((left, right) =>
                    sortKey(left).localeCompare(sortKey(right))
                ),
        [billableRecords, effectiveFilter]
    )

    // Each student keeps one tint so their rows read as a block. Indexed over
    // every billable student in name order (the table's order), not just the
    // filtered ones, so a student's colour survives filtering and doesn't
    // depend on who else is visible.
    const studentGroupById = useMemo(
        () =>
            new Map(
                [...billableRecords]
                    .sort((left, right) =>
                        left.studentName.localeCompare(right.studentName)
                    )
                    .map((record, index) => [
                        record.studentId,
                        index % studentGroupCount,
                    ])
            ),
        [billableRecords]
    )

    // What each student's block adds up to, for the subtotal row that closes
    // it. Duration and fee follow the same rule as the grand total: a monthly
    // student's class rows are covered by their flat-fee line, so only the
    // charged line contributes and nothing is counted twice. Classes are
    // counted from the dated rows alone, so a monthly fee never reads as one.
    const studentTotals = useMemo(() => {
        const totals = new Map<
            number,
            { classCount: number; durationMinutes: number; fee: number }
        >()
        for (const row of sessionRows) {
            const running = totals.get(row.studentId) ?? {
                classCount: 0,
                durationMinutes: 0,
                fee: 0,
            }
            if (row.kind === 'session') {
                running.classCount += 1
            }
            if (!(row.kind === 'session' && row.coveredByMonthlyFee)) {
                running.durationMinutes += row.durationMinutes
                running.fee += row.fee
            }
            totals.set(row.studentId, running)
        }
        return totals
    }, [sessionRows])

    // A monthly student's class rows are covered by their monthly-fee row, so
    // only that one line contributes — the total still tallies the Due column.
    const sessionTotal = useMemo(
        () =>
            sessionRows.reduce(
                (total, row) =>
                    row.kind === 'session' && row.coveredByMonthlyFee
                        ? total
                        : total + row.fee,
                0
            ),
        [sessionRows]
    )

    const selectedMonthLabel = monthOptions.find(
        (option) => option.value === selectedMonth
    )!.label

    const exportSessionsCsv = () => {
        downloadCsv(
            `sessions-${selectedMonth}.csv`,
            buildCsv(sessionRows, selectedMonthLabel)
        )
    }

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
                    <label htmlFor="payment-month">
                        <CalendarMonthOutlinedIcon fontSize="small" />
                        Month
                    </label>
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

            <div className="payment-tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'summary'}
                    className={`payment-tab ${tab === 'summary' ? 'active' : ''}`}
                    onClick={() => setTab('summary')}
                >
                    Monthly summary
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'sessions'}
                    className={`payment-tab ${tab === 'sessions' ? 'active' : ''}`}
                    onClick={() => setTab('sessions')}
                >
                    Session breakdown
                </button>
            </div>

            {tab === 'summary' && (
            <>
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
            </>
            )}

            {tab === 'sessions' && (
            <div className="card">
                <div className="section-header">
                    <div>
                        <h3>{selectedMonthLabel} — session breakdown</h3>
                        <p>
                            Every class taught is listed with its date. A
                            per-session class shows its fee; a monthly
                            student&apos;s classes are covered by one flat-fee
                            row, so their payment appears on a single line.
                            Duration is shown for context; it doesn&apos;t
                            change the fee. Each student&apos;s block closes
                            with their own total, and the footed total tallies
                            the Due column of the monthly summary.
                        </p>
                    </div>
                </div>
                <div className="session-breakdown-toolbar">
                    <div className="session-student-filter">
                        <label htmlFor="session-student-filter">Student</label>
                        <select
                            id="session-student-filter"
                            value={effectiveFilter}
                            onChange={(event) =>
                                setStudentFilter(event.target.value)
                            }
                        >
                            <option value="all">All students</option>
                            {billableRecords.map((record) => (
                                <option
                                    key={record.studentId}
                                    value={String(record.studentId)}
                                >
                                    {record.studentName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button
                        type="button"
                        variant="outlined"
                        size="small"
                        className="session-export"
                        disabled={sessionRows.length === 0}
                        onClick={exportSessionsCsv}
                    >
                        Export CSV
                    </Button>
                </div>

                {sessionRows.length === 0 ? (
                    <p className="session-breakdown-empty">
                        No billable classes or fees to itemise for this month.
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table className="snapshot-table session-breakdown-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Date</th>
                                    <th>Day</th>
                                    <th>Subject</th>
                                    <th>Duration</th>
                                    <th>Fee</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessionRows.map((row, index) => {
                                    // Rows arrive grouped by student, so the
                                    // subtotal goes after the last of each run.
                                    const isLastForStudent =
                                        sessionRows[index + 1]?.studentId !==
                                        row.studentId
                                    const totals = studentTotals.get(
                                        row.studentId
                                    )!
                                    return (
                                        <Fragment
                                            key={`${row.studentName}-${index}`}
                                        >
                                        <tr
                                            className={`student-group-${studentGroupById.get(row.studentId)!}${
                                                row.kind === 'monthly'
                                                    ? ' session-monthly-row'
                                                    : ''
                                            }`}
                                        >
                                            <td data-label="Student">
                                                {row.studentName}
                                            </td>
                                            {row.kind === 'monthly' ? (
                                                // A monthly fee spans the whole
                                                // month: merge Date + Day into the
                                                // month it covers.
                                                <td
                                                    colSpan={2}
                                                    data-label="Period"
                                                >
                                                    {selectedMonthLabel}
                                                </td>
                                            ) : (
                                                <>
                                                    <td data-label="Date">
                                                        {formatDate(row.date)}
                                                    </td>
                                                    <td data-label="Day">
                                                        {dayOfWeek(row.date)}
                                                    </td>
                                                </>
                                            )}
                                            <td data-label="Subject">
                                                {row.kind === 'monthly'
                                                    ? 'Monthly fee'
                                                    : row.subject}
                                            </td>
                                            <td data-label="Duration">
                                                {durationCell(row.durationMinutes)}
                                            </td>
                                            <td data-label="Fee">
                                                {row.kind === 'session' &&
                                                row.coveredByMonthlyFee
                                                    ? // Covered by the student's
                                                      // monthly-fee row below.
                                                      '—'
                                                    : formatCurrency(row.fee)}
                                            </td>
                                        </tr>
                                        {isLastForStudent && (
                                            <tr
                                                className={`student-group-${studentGroupById.get(row.studentId)!} session-student-total-row`}
                                            >
                                                <td colSpan={4}>
                                                    {row.studentName} — total (
                                                    {totals.classCount}{' '}
                                                    {totals.classCount === 1
                                                        ? 'class'
                                                        : 'classes'}
                                                    )
                                                </td>
                                                <td data-label="Total duration">
                                                    {durationCell(
                                                        totals.durationMinutes
                                                    )}
                                                </td>
                                                <td data-label="Total fee">
                                                    {formatCurrency(totals.fee)}
                                                </td>
                                            </tr>
                                        )}
                                        </Fragment>
                                    )
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="session-total-row">
                                    <td colSpan={5}>
                                        Total ({sessionRows.length}{' '}
                                        {sessionRows.length === 1
                                            ? 'item'
                                            : 'items'}
                                        )
                                    </td>
                                    <td data-label="Total">
                                        {formatCurrency(sessionTotal)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
            )}
        </section>
    )
}
