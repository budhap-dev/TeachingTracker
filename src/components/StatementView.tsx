import { Button } from '@mui/material'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import type { PaymentRecord, Student } from '../data/students'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { BrandBadge } from './BrandBadge'
import { formatCurrency } from '../utils/money'

/**
 * One student's month, as a document a family can keep (REQ-055).
 *
 * It is a **statement**, not an invoice: it says what a month came to, what
 * has been paid and what is left. The word matters for tax reasons and is the
 * owner's to change — it appears once, below.
 *
 * The page prints itself. No PDF library: the site's CSP forbids loading one,
 * a bundled one would cost every visitor the download, and the browser's own
 * "Save as PDF" already produces the file — the print stylesheet is what makes
 * the result look like a document rather than a screenshot of the app.
 *
 * What it deliberately does NOT carry: the family's address, diary notes,
 * progress figures, safeguarding detail. A bill needs who, what and how much
 * (REQ-031 minimisation, applied to a document that leaves the app).
 */

/** The month key `2026-08` as "August 2026". */
const monthLabel = (month: string) => {
    const [year, index] = month.split('-').map(Number)
    return new Date(year, index - 1, 1).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
    })
}

const dayLabel = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
    })

type StatementViewProps = {
    student: Student
    record: PaymentRecord
    month: string
    /** The business's own name, from the published site document. */
    siteName: string
    onBack: () => void
}

export const StatementView = ({
    student,
    record,
    month,
    siteName,
    onBack,
}: StatementViewProps) => {
    // The browser names a saved PDF after the page title, so the title IS the
    // filename: "Statement - Ava Devlin - January 2026.pdf". Without it every
    // statement saves under the site's own name and a month's worth collide
    // in one folder. Hyphens, not en dashes — some filesystems mangle them.
    useDocumentMeta(
        `Statement - ${student.firstName} ${student.lastName} - ${monthLabel(month)}`,
        `Tutoring statement for ${monthLabel(month)}.`
    )
    const isMonthly = record.feeType === 'monthly'
    const isNoFee = record.feeType === 'none'
    const hours = Math.round((record.totalDurationMinutes / 60) * 10) / 10

    return (
        <section className="content-stack statement-page">
            {/* Screen-only chrome: the printed page starts at the document. */}
            <div className="card statement-actions no-print">
                <Button onClick={onBack}>Back to payments</Button>
                <Button
                    variant="contained"
                    startIcon={<PrintOutlinedIcon fontSize="small" />}
                    onClick={() => window.print()}
                >
                    Print or save as PDF
                </Button>
            </div>

            <article className="card statement">
                <header className="statement-head">
                    <div>
                        <h3 className="statement-title">Statement</h3>
                        <p className="statement-month">{monthLabel(month)}</p>
                    </div>
                    {/* The badge, not the lockup: it brings its own ground, so
                        it reads on white paper — the lockup's "Tutor" is white
                        and would vanish. The name still comes from the
                        published document, never hardcoded here. */}
                    <div className="statement-brand">
                        <BrandBadge size={52} />
                        <p className="statement-from">{siteName}</p>
                    </div>
                </header>

                <dl className="statement-for">
                    <div>
                        <dt>Student</dt>
                        <dd>
                            {student.firstName} {student.lastName}
                        </dd>
                    </div>
                    <div>
                        <dt>Year</dt>
                        <dd>{student.year}</dd>
                    </div>
                </dl>

                <h4 className="statement-section">Classes attended</h4>
                {record.sessions.length === 0 ? (
                    <p className="statement-empty">
                        No classes were held in {monthLabel(month)}.
                    </p>
                ) : (
                    <table className="statement-table">
                        <thead>
                            <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Subject</th>
                                <th scope="col">Length</th>
                                <th scope="col" className="statement-amount">
                                    Fee
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {record.sessions.map((session, index) => (
                                <tr key={`${session.date}-${index}`}>
                                    <td>{dayLabel(session.date)}</td>
                                    <td>{session.subject}</td>
                                    <td>{session.durationMinutes} min</td>
                                    <td className="statement-amount">
                                        {/* A monthly student's classes carry
                                            no per-class fee — the flat fee
                                            below covers them, and summing
                                            these would read £0 due. */}
                                        {isMonthly || isNoFee
                                            ? '—'
                                            : formatCurrency(session.fee)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <dl className="statement-totals">
                    <div>
                        <dt>Classes held</dt>
                        <dd>
                            {record.sessionsHeld} ({hours} hours)
                        </dd>
                    </div>
                    {isNoFee ? (
                        <div>
                            <dt>Fees</dt>
                            <dd>No fee is charged for these lessons.</dd>
                        </div>
                    ) : (
                        <>
                            <div>
                                <dt>
                                    {isMonthly
                                        ? 'Monthly fee'
                                        : 'Fee per class'}
                                </dt>
                                <dd>
                                    {formatCurrency(record.feePerSession)}
                                    {isMonthly ? ' a month' : ' a class'}
                                </dd>
                            </div>
                            <div>
                                <dt>Total for the month</dt>
                                <dd>{formatCurrency(record.amountDue)}</dd>
                            </div>
                            <div>
                                <dt>Received</dt>
                                <dd>{formatCurrency(record.amountPaid)}</dd>
                            </div>
                            <div className="statement-outstanding">
                                <dt>Outstanding</dt>
                                <dd>{formatCurrency(record.outstanding)}</dd>
                            </div>
                        </>
                    )}
                </dl>

                <p className="statement-note">
                    {isNoFee
                        ? 'This statement is a record of the classes held.'
                        : record.outstanding > 0
                          ? 'Thank you — please settle the outstanding amount at your convenience.'
                          : 'Thank you — this month is settled in full.'}
                </p>
            </article>
        </section>
    )
}
