type DashboardViewProps = {
  stats: { onlineStudents: number; avgProgress: number; totalStudents: number };
  onManageStudents: () => void;
};

export const DashboardView = ({ stats, onManageStudents }: DashboardViewProps) => (
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
  </section>
);
