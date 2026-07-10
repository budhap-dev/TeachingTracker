import { useMemo } from 'react';

type DashboardViewProps = {
  stats: { onlineStudents: number; faceToFaceStudents: number; avgProgress: number; totalStudents: number };
  overviewChart: {
    label: string;
    value: number;
  }[];
  upcomingSessions: {
    id: number;
    studentId: number;
    date: string;
    time: string;
    studentName: string;
    subject: string;
    year: string;
    notes: string;
  }[];
  onManageStudents: () => void;
  onOpenStudentPage: (studentId: number) => void;
};

export const DashboardView = ({ stats, overviewChart, upcomingSessions, onManageStudents, onOpenStudentPage }: DashboardViewProps) => {
  const chartTotal = Math.max(overviewChart.reduce((sum, item) => sum + item.value, 0), 1);
  const chartRadius = 42;
  const chartCircumference = 2 * Math.PI * chartRadius;
  const chartPalette = ['var(--accent)', 'var(--accent-alt)', 'var(--pill-text)', 'var(--muted)'];

  const chartSegments = useMemo(() => {
    let offset = 0;

    return overviewChart.map((item, index) => {
      const segmentLength = (item.value / chartTotal) * chartCircumference;
      const segment = {
        ...item,
        color: chartPalette[index % chartPalette.length],
        dashArray: `${segmentLength} ${chartCircumference - segmentLength}`,
        dashOffset: -offset,
      };

      offset += segmentLength;

      return segment;
    });
  }, [chartCircumference, chartTotal, overviewChart]);

  return (
    <section className="grid">
      <div className="card hero-card">
        <h3>Today at a glance</h3>
        <p>Keep student progress, contact notes, and learning modes in one calm workspace.</p>
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
            <h3>Class and student chart</h3>
            <p>Overview of your student mix and active session load.</p>
          </div>
        </div>
        <div className="dashboard-chart" role="img" aria-label="Student and class overview pie chart">
          <div className="dashboard-chart-figure">
            <svg viewBox="0 0 120 120" className="dashboard-chart-pie" aria-hidden="true">
              <circle className="dashboard-chart-pie-track" cx="60" cy="60" r={chartRadius} />
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
                />
              ))}
              <circle className="dashboard-chart-pie-center" cx="60" cy="60" r="26" />
            </svg>
            <div className="dashboard-chart-total">
              <strong>{chartTotal}</strong>
              <span>Total items</span>
            </div>
          </div>
          <div className="dashboard-chart-legend">
            {chartSegments.map((segment) => (
              <div key={segment.label} className="dashboard-chart-legend-item">
                <span className="dashboard-chart-legend-swatch" style={{ backgroundColor: segment.color }} />
                <div className="dashboard-chart-legend-copy">
                  <strong>{segment.label}</strong>
                  <span>{segment.value} items</span>
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
            <span className="calendar-note">Google Calendar sync coming soon</span>
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
        <div className="calendar-list" role="list" aria-label="Upcoming sessions calendar">
          {upcomingSessions.map((session) => (
            <article key={session.id} className="session-item" role="listitem">
              <div className="session-date-pill">{new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
              <div className="session-content">
                <strong>
                  <a
                    href={`#student-${session.studentId}`}
                    className="student-link"
                    onClick={(event) => {
                      event.preventDefault();
                      onOpenStudentPage(session.studentId);
                    }}
                  >
                    {session.studentName}
                  </a>
                </strong>
                <p>{session.subject} • Year {session.year} • {session.time}</p>
                <small>{session.notes}</small>
              </div>
              <span className="session-mode booked">Booked</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
