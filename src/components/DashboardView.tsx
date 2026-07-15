import { useMemo } from 'react'

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
    onManageStudents: () => void
    onOpenStudentPage: (studentId: number) => void
}

export const DashboardView = ({
    stats,
    overviewChart,
    upcomingSessions,
    onManageStudents,
    onOpenStudentPage,
}: DashboardViewProps) => {
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
                    <div className="calendar-actions">
                        <span className="calendar-note">
                            Google Calendar sync coming soon
                        </span>
                        <button
                            type="button"
                            className="calendar-connect-btn"
                            title="Google Calendar integration will be available in a future update"
                            disabled
                        >
                            Connect Google Calendar
                        </button>
                    </div>
                </div>
                <div
                    className="calendar-list"
                    role="list"
                    aria-label="Upcoming sessions calendar"
                >
                    {upcomingSessions.map((session) => (
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
            </div>
        </section>
    )
}
