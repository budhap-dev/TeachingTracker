type DashboardViewProps = {
  stats: { onlineStudents: number; avgProgress: number; totalStudents: number };
  upcomingSessions: {
    id: string;
    studentId: number;
    date: string;
    time: string;
    studentName: string;
    subject: string;
    mode: 'Online' | 'Face to Face';
  }[];
  onManageStudents: () => void;
  onOpenStudentPage: (studentId: number) => void;
};

export const DashboardView = ({ stats, upcomingSessions, onManageStudents, onOpenStudentPage }: DashboardViewProps) => (
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
              <p>{session.subject} • {session.time}</p>
            </div>
            <span className={`session-mode ${session.mode === 'Online' ? 'online' : 'face'}`}>{session.mode}</span>
          </article>
        ))}
      </div>
    </div>
  </section>
);
