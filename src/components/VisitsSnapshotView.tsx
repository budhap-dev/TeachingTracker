import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import type { DailyVisits, PageKey } from '../api/pageVisits'
import { PageLoading } from './PageLoading'

/** How each page key reads to the teacher, who never sees a route key. */
const pageLabels: Record<PageKey, string> = {
    home: 'Home',
    offerings: 'Offerings',
    pricing: 'Pricing',
    enquire: 'Enquire',
    about: 'About',
    reviews: 'Reviews',
    faq: 'FAQ',
    contact: 'Contact',
    privacy: 'Privacy',
}

/** A date key as a person says it: "Sat 15 Aug 2026". `en-GB` like every
    other date in the app — the runtime's locale would read US on CI. */
const readableDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })

type VisitsSnapshotViewProps = {
    daily: DailyVisits[]
    loading: boolean
}

/**
 * How many visits the public site had each day, and which pages they reached
 * (REQ-058).
 *
 * The word is *visits*, never people or users, and the page says so: a visit
 * is a browser tab, the id behind it dies when the tab closes, and a reload
 * counts again. Nobody is identified, which is the whole design — so the
 * screen must not imply otherwise.
 */
export const VisitsSnapshotView = ({
    daily,
    loading,
}: VisitsSnapshotViewProps) => {
    if (loading) {
        return <PageLoading />
    }
    const busiest = Math.max(...daily.map((day) => day.visits), 1)

    return (
        <section className="content-stack">
            <div className="card">
                <div className="section-header">
                    <div>
                        <h3 className="page-heading">
                            <InsightsOutlinedIcon fontSize="small" />
                            Visits to the public site
                        </h3>
                        <p className="section-subtitle">
                            How many visits each day, and which pages they
                            reached. A visit is a browser tab — nothing is
                            stored on anyone’s device and nobody is
                            identified, so this counts visits, not people.
                        </p>
                    </div>
                </div>

                {daily.length === 0 ? (
                    <p className="section-subtitle">
                        No visits counted yet. Days with none are left out
                        rather than shown as zero.
                    </p>
                ) : (
                    <ul className="visits-days">
                        {daily.map((day) => (
                            <li key={day.date} className="visits-day">
                                <div className="visits-day-head">
                                    <span className="visits-date">
                                        {readableDate(day.date)}
                                    </span>
                                    <span className="visits-total">
                                        {day.visits}{' '}
                                        {day.visits === 1 ? 'visit' : 'visits'}
                                    </span>
                                </div>
                                {/* The bar is the day against the busiest day
                                    in view — a shape to scan, not a number to
                                    read twice. */}
                                <div
                                    className="visits-bar"
                                    aria-hidden
                                    style={{
                                        width: `${Math.round((day.visits / busiest) * 100)}%`,
                                    }}
                                />
                                <ul className="visits-pages">
                                    {day.pages.map((entry) => (
                                        <li key={entry.page}>
                                            <span className="visits-page-name">
                                                {pageLabels[entry.page] ??
                                                    entry.page}
                                            </span>
                                            <span className="visits-page-count">
                                                {entry.visits}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    )
}
