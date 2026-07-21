import { Fragment, useMemo, useState } from 'react'
import { Button } from '@mui/material'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import type { DayLoad } from '../utils/dashboard'
import { formatHours } from '../utils/dashboard'

/** The dashboard shows this many upcoming sessions before "Show all". */
const upcomingPreviewCount = 4

type DashboardViewProps = {
    stats: {
        onlineStudents: number
        faceToFaceStudents: number
        avgProgress: number
        totalStudents: number
    }
    attention: {
        onTrack: { id: number; name: string }[]
        developing: { id: number; name: string }[]
        needsAttention: { id: number; name: string }[]
        total: number
    }
    upcomingSessions: {
        id: number
        date: string
        time: string
        subject: string
        notes: string
        /** One entry per class: a group class carries every attendee. */
        members: {
            studentId: number
            studentName: string
            year: string
        }[]
    }[]
    weekLoad: DayLoad[]
    onManageStudents: () => void
    onOpenStudentPage: (studentId: number) => void
    onOpenDay: (dateKey: string) => void
}

export const DashboardView = ({
    stats,
    attention,
    upcomingSessions,
    weekLoad,
    onManageStudents,
    onOpenStudentPage,
    onOpenDay,
}: DashboardViewProps) => {
    // Collapsed, the sessions list is a glance; expanded, the full horizon.
    const [showAllSessions, setShowAllSessions] = useState(false)
    const visibleSessions = showAllSessions
        ? upcomingSessions
        : upcomingSessions.slice(0, upcomingPreviewCount)

    // The tallest bar owns the chart's height; label only it and today
    // (selective direct labels — every other bar answers on hover).
    const maxWeekMinutes = Math.max(...weekLoad.map((day) => day.minutes), 1)

    // Progress bands, worst first — status colours (reserved for state), each
    // shown with its own label and count, never colour alone.
    const attentionBands = useMemo(
        () => [
            {
                key: 'needsAttention' as const,
                label: 'Needs attention',
                students: attention.needsAttention,
                className: 'needs-attention',
            },
            {
                key: 'developing' as const,
                label: 'Developing',
                students: attention.developing,
                className: 'developing',
            },
            {
                key: 'onTrack' as const,
                label: 'On track',
                students: attention.onTrack,
                className: 'on-track',
            },
        ],
        [attention]
    )

    // Which band's students are shown: hover previews on desktop, a tap pins on
    // mobile (no hover), and a pin survives the pointer leaving.
    const [hoveredBand, setHoveredBand] = useState<string | null>(null)
    const [pinnedBand, setPinnedBand] = useState<string | null>(null)
    const activeBand = hoveredBand ?? pinnedBand
    const activeBandData = attentionBands.find(
        (band) => band.key === activeBand
    )
    // The band whose students are listed: the hovered/pinned one, else the
    // neediest by default. The detail area is always in the layout with a fixed
    // height, so revealing/swapping a band never resizes the card.
    const shownBand = activeBandData ?? attentionBands[0]
    const toggleBand = (key: string) =>
        setPinnedBand((current) => (current === key ? null : key))

    return (
        <section className="grid">
            {/* One banner instead of a hero plus three stat cards: the copy
                and action on the left, the numbers as a compact strip on the
                right — a whole row of vertical space handed back. */}
            <div className="card hero-card dashboard-hero">
                <div className="dashboard-hero-copy">
                    <h3 className="page-heading">
                        <SpaceDashboardOutlinedIcon fontSize="small" />
                        Today at a glance
                    </h3>
                    <p>
                        Keep student progress, contact notes, and learning
                        modes in one calm workspace.
                    </p>
                    <button onClick={onManageStudents}>Manage students</button>
                </div>
                <table className="dashboard-hero-stats">
                    <thead>
                        <tr>
                            <th scope="col">Total students</th>
                            <th scope="col">Avg progress</th>
                            <th scope="col">Online</th>
                            <th scope="col">Face to face</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{stats.totalStudents}</td>
                            <td>{stats.avgProgress}%</td>
                            <td>{stats.onlineStudents}</td>
                            <td>{stats.faceToFaceStudents}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="card calendar-card">
                <div className="calendar-header">
                    <h3>Upcoming sessions</h3>
                </div>
                <div
                    className="calendar-list"
                    role="list"
                    aria-label="Upcoming sessions calendar"
                >
                    {visibleSessions.map((session) => (
                        <article
                            key={session.id}
                            className="session-item"
                            role="listitem"
                        >
                            <div className="session-date-pill">
                                {new Date(session.date).toLocaleDateString(
                                    'en-GB',
                                    {
                                        day: '2-digit',
                                        month: 'short',
                                    }
                                )}
                            </div>
                            <div className="session-content">
                                <strong className="session-attendees">
                                    {session.members.length > 1 && (
                                        <span className="session-group-tag">
                                            Group
                                        </span>
                                    )}
                                    {session.members.map((member, index) => (
                                        <Fragment key={member.studentId}>
                                            {index > 0 && ', '}
                                            <a
                                                href={`#student-${member.studentId}`}
                                                className="student-link"
                                                onClick={(event) => {
                                                    event.preventDefault()
                                                    onOpenStudentPage(
                                                        member.studentId
                                                    )
                                                }}
                                            >
                                                {member.studentName}
                                            </a>
                                        </Fragment>
                                    ))}
                                </strong>
                                <p>
                                    {session.subject} •{' '}
                                    {session.members.length === 1 &&
                                        `Year ${session.members[0].year} • `}
                                    {session.time}
                                </p>
                                <small>{session.notes}</small>
                            </div>
                            <span className="session-mode booked">
                                {session.members.length > 1
                                    ? `Group · ${session.members.length}`
                                    : 'Booked'}
                            </span>
                        </article>
                    ))}
                </div>
                {upcomingSessions.length > upcomingPreviewCount && (
                    <Button
                        size="small"
                        variant="text"
                        onClick={() =>
                            setShowAllSessions((current) => !current)
                        }
                    >
                        {showAllSessions
                            ? 'Show fewer'
                            : `Show all ${upcomingSessions.length}`}
                    </Button>
                )}
            </div>

            <div className="card dashboard-chart-card attention-card">
                <div className="section-header">
                    <div>
                        <h3>Who needs attention</h3>
                        <p>
                            Students grouped by progress, so follow-ups are easy
                            to spot.
                        </p>
                    </div>
                </div>

                {attention.total === 0 ? (
                    <p className="attention-empty">
                        No students yet — add a few to see how they're tracking.
                    </p>
                ) : (
                    <div className="attention-body">
                        {/* Hover a segment (or tap it on mobile) to name its
                            students; the same drives the legend rows. */}
                        <div
                            className="attention-bar"
                            role="img"
                            aria-label={`Progress of ${attention.total} students: ${attentionBands
                                .map(
                                    (band) =>
                                        `${band.students.length} ${band.label}`
                                )
                                .join(', ')}`}
                        >
                            {attentionBands
                                .filter((band) => band.students.length > 0)
                                .map((band) => (
                                    <button
                                        type="button"
                                        key={band.key}
                                        className={`attention-bar-segment ${band.className}${
                                            activeBand === band.key
                                                ? ' active'
                                                : ''
                                        }`}
                                        style={{
                                            flexGrow: band.students.length,
                                        }}
                                        onMouseEnter={() =>
                                            setHoveredBand(band.key)
                                        }
                                        onMouseLeave={() =>
                                            setHoveredBand(null)
                                        }
                                        onClick={() => toggleBand(band.key)}
                                        aria-label={`${band.label}: ${band.students
                                            .map((student) => student.name)
                                            .join(', ')}`}
                                    />
                                ))}
                        </div>

                        <ul
                            className="attention-legend"
                            aria-label="Students by progress band"
                        >
                            {attentionBands.map((band) => (
                                <li
                                    key={band.key}
                                    className="attention-legend-item"
                                >
                                    <button
                                        type="button"
                                        className={`attention-legend-button${
                                            activeBand === band.key
                                                ? ' active'
                                                : ''
                                        }`}
                                        onMouseEnter={() =>
                                            setHoveredBand(band.key)
                                        }
                                        onMouseLeave={() =>
                                            setHoveredBand(null)
                                        }
                                        onClick={() => toggleBand(band.key)}
                                    >
                                        <span
                                            className={`attention-dot ${band.className}`}
                                        />
                                        <span className="attention-legend-label">
                                            {band.label}
                                        </span>
                                        <strong className="attention-legend-count">
                                            {band.students.length}
                                        </strong>
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Always in the layout with a fixed height, so revealing
                            or swapping a band's students never resizes the card.
                            The neediest band leads; when it's empty a hint stands
                            in until a band is hovered/tapped. */}
                        <div className="attention-detail">
                            {shownBand.students.length > 0 ? (
                                <>
                                    <span className="attention-detail-title">
                                        {shownBand.label}
                                    </span>
                                    <div className="attention-detail-names">
                                        {shownBand.students.map((student) => (
                                            <a
                                                key={student.id}
                                                href={`#student-${student.id}`}
                                                className="student-link"
                                                onClick={(event) => {
                                                    event.preventDefault()
                                                    onOpenStudentPage(student.id)
                                                }}
                                            >
                                                {student.name}
                                            </a>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="attention-detail-hint">
                                    Hover a band to list its students.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Week at a glance: one series, hours by weekday, each bar a
                door into that day's planner modal. */}
            <div className="card week-card">
                <h3>This week</h3>
                <div
                    className="week-chart"
                    role="img"
                    aria-label={`Teaching load this week: ${weekLoad
                        .map(
                            (day) =>
                                `${day.label} ${day.classes} ${day.classes === 1 ? 'class' : 'classes'}`
                        )
                        .join(', ')}`}
                >
                    {weekLoad.map((day) => (
                        <button
                            key={day.dateKey}
                            type="button"
                            className={`week-bar-cell ${day.isToday ? 'today' : ''}`}
                            onClick={() => onOpenDay(day.dateKey)}
                            title={`${day.label} — ${day.classes} ${day.classes === 1 ? 'class' : 'classes'}${day.minutes ? ` · ${formatHours(day.minutes)}` : ''}`}
                        >
                            {(day.isToday ||
                                (day.minutes === maxWeekMinutes &&
                                    day.minutes > 0)) && (
                                <span className="week-bar-value">
                                    {day.minutes > 0
                                        ? formatHours(day.minutes)
                                        : '—'}
                                </span>
                            )}
                            <span
                                className="week-bar"
                                style={{
                                    height: `${Math.max((day.minutes / maxWeekMinutes) * 72, day.minutes > 0 ? 8 : 3)}px`,
                                }}
                            />
                            <span className="week-bar-label">{day.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    )
}
