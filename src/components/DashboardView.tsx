import { useMemo, useState } from 'react'
import { Button } from '@mui/material'
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
    overviewChart: {
        label: string
        value: number
    }[]
    upcomingSessions: {
        id: number
        studentId: number
        date: string
        time: string
        studentName: string
        subject: string
        year: string
        notes: string
    }[]
    weekLoad: DayLoad[]
    onManageStudents: () => void
    onOpenStudentPage: (studentId: number) => void
    onOpenDay: (dateKey: string) => void
}

export const DashboardView = ({
    stats,
    overviewChart,
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
    // Every student sits in exactly one year, so the slices genuinely sum to
    // the total in the middle. Year is ordered (8 -> 11), so the slices take one
    // hue light-to-dark rather than four unrelated colours: the reader sees the
    // order in the colour. The ramp is mixed from the active theme's accent, so
    // it follows whichever of the 14 themes is on.
    const chartTotal = overviewChart.reduce((sum, item) => sum + item.value, 0)
    const chartRadius = 42
    const chartCircumference = 2 * Math.PI * chartRadius
    /** A 2px gap of surface between slices, so neighbours never merge. */
    const sliceGap = 2

    const chartSegments = useMemo(() => {
        if (chartTotal === 0) {
            return []
        }
        let offset = 0

        return overviewChart.map((item, index) => {
            const share = item.value / chartTotal
            const segmentLength = Math.max(
                share * chartCircumference - sliceGap,
                0
            )
            const weight = 35 + (index / Math.max(overviewChart.length - 1, 1)) * 65
            const segment = {
                ...item,
                share,
                color: `color-mix(in srgb, var(--accent) ${Math.round(weight)}%, var(--surface))`,
                dashArray: `${segmentLength} ${chartCircumference - segmentLength}`,
                dashOffset: -offset,
            }

            offset += share * chartCircumference

            return segment
        })
    }, [chartCircumference, chartTotal, overviewChart])

    return (
        <section className="grid">
            <div className="card hero-card">
                <h3>Today at a glance</h3>
                <p>
                    Keep student progress, contact notes, and learning modes in
                    one calm workspace.
                </p>
                <button onClick={onManageStudents}>Manage students</button>
            </div>
            <div className="card stat-card">
                <span>Total students</span>
                <strong>{stats.totalStudents}</strong>
            </div>
            <div className="card stat-card">
                <span>Average progress</span>
                <strong>{stats.avgProgress}%</strong>
            </div>
            <div className="card stat-card">
                <span>Online learners</span>
                <strong>{stats.onlineStudents}</strong>
                <span>Face to Face learners</span>
                <strong>{stats.faceToFaceStudents}</strong>
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
            <div className="card dashboard-chart-card">
                <div className="section-header">
                    <div>
                        <h3>Who you're teaching</h3>
                        <p>
                            Your students by year group. Every student is
                            counted once.
                        </p>
                    </div>
                </div>
                <div
                    className="dashboard-chart"
                    role="img"
                    aria-label={`Students by year group: ${chartSegments
                        .map((s) => `${s.label} ${s.value}`)
                        .join(', ')}`}
                >
                    <div className="dashboard-chart-figure">
                        <svg
                            viewBox="0 0 120 120"
                            className="dashboard-chart-pie"
                            aria-hidden="true"
                        >
                            <circle
                                className="dashboard-chart-pie-track"
                                cx="60"
                                cy="60"
                                r={chartRadius}
                            />
                            {chartSegments.map((segment) => (
                                <circle
                                    key={segment.label}
                                    className="dashboard-chart-pie-segment"
                                    cx="60"
                                    cy="60"
                                    r={chartRadius}
                                    stroke={segment.color}
                                    strokeDasharray={segment.dashArray}
                                    strokeDashoffset={segment.dashOffset}
                                >
                                    <title>
                                        {`${segment.label}: ${segment.value} of ${chartTotal}`}
                                    </title>
                                </circle>
                            ))}
                            <circle
                                className="dashboard-chart-pie-center"
                                cx="60"
                                cy="60"
                                r="26"
                            />
                        </svg>
                        <div className="dashboard-chart-total">
                            <strong>{chartTotal}</strong>
                            <span>
                                {chartTotal === 1 ? 'Student' : 'Students'}
                            </span>
                        </div>
                    </div>
                    <div className="dashboard-chart-legend">
                        {chartSegments.map((segment) => (
                            <div
                                key={segment.label}
                                className="dashboard-chart-legend-item"
                            >
                                <span
                                    className="dashboard-chart-legend-swatch"
                                    style={{ backgroundColor: segment.color }}
                                />
                                <div className="dashboard-chart-legend-copy">
                                    <strong>{segment.label}</strong>
                                    <span>
                                        {segment.value}{' '}
                                        {segment.value === 1
                                            ? 'student'
                                            : 'students'}{' '}
                                        · {Math.round(segment.share * 100)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
                                <strong>
                                    <a
                                        href={`#student-${session.studentId}`}
                                        className="student-link"
                                        onClick={(event) => {
                                            event.preventDefault()
                                            onOpenStudentPage(session.studentId)
                                        }}
                                    >
                                        {session.studentName}
                                    </a>
                                </strong>
                                <p>
                                    {session.subject} • Year {session.year} •{' '}
                                    {session.time}
                                </p>
                                <small>{session.notes}</small>
                            </div>
                            <span className="session-mode booked">Booked</span>
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
        </section>
    )
}
