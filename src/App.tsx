import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { loadStudents, saveStudent, store, updateStudent } from './store/store';
import { useAppDispatch, useAppSelector } from './hooks';
import type { Student } from './data/students';
import './styles.scss';

const StudentApp = () => {
  const dispatch = useAppDispatch();
  const students = useAppSelector((state) => state.students.students);
  const loading = useAppSelector((state) => state.students.loading);
  const [activeView, setActiveView] = useState<'dashboard' | 'students' | 'payments'>('dashboard');
  const [form, setForm] = useState<Omit<Student, 'id'>>({
    name: '',
    grade: '',
    subject: '',
    attendance: 0,
    progress: 0,
    paymentStatus: 'Pending',
    fee: 0,
    notes: '',
  });

  const stats = useMemo(() => {
    const paidCount = students.filter((s) => s.paymentStatus === 'Paid').length;
    const avgProgress = Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length);
    return { paidCount, avgProgress, totalStudents: students.length };
  }, [students]);

  useEffect(() => {
    dispatch(loadStudents());
  }, [dispatch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.grade || !form.subject) return;

    dispatch(
      saveStudent({
        ...form,
        attendance: Number(form.attendance),
        progress: Number(form.progress),
        fee: Number(form.fee),
      })
    );

    setForm({
      name: '',
      grade: '',
      subject: '',
      attendance: 0,
      progress: 0,
      paymentStatus: 'Pending',
      fee: 0,
      notes: '',
    });
    setActiveView('students');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h1>TeachTrack</h1>
          <p>One teacher dashboard for student growth and payments.</p>
        </div>
        <nav>
          <button className={activeView === 'dashboard' ? 'active' : ''} onClick={() => setActiveView('dashboard')}>
            Dashboard
          </button>
          <button className={activeView === 'students' ? 'active' : ''} onClick={() => setActiveView('students')}>
            Students
          </button>
          <button className={activeView === 'payments' ? 'active' : ''} onClick={() => setActiveView('payments')}>
            Payments
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Teacher portal</p>
            <h2>Welcome back, Ms. Nadeesha</h2>
          </div>
          <div className="pill">Active term • 2026</div>
        </header>

        {activeView === 'dashboard' && (
          <section className="grid">
            <div className="card hero-card">
              <h3>Today at a glance</h3>
              <p>Keep student progress, attendance, and fees in one calm workspace.</p>
              <button onClick={() => setActiveView('students')}>Manage students</button>
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
              <span>Paid fees</span>
              <strong>{stats.paidCount}</strong>
            </div>
          </section>
        )}

        {activeView === 'students' && (
          <section className="content-stack">
            <div className="card">
              <h3>Add a student</h3>
              <form onSubmit={handleSubmit} className="student-form">
                <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input placeholder="Grade" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
                <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                <input type="number" placeholder="Attendance %" value={form.attendance} onChange={(e) => setForm({ ...form, attendance: Number(e.target.value) })} />
                <input type="number" placeholder="Progress %" value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
                <input type="number" placeholder="Fee" value={form.fee} onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })} />
                <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as Student['paymentStatus'] })}>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
                <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                <button type="submit">Save student</button>
              </form>
            </div>

            <div className="card">
              <h3>Student list</h3>
              {loading && <p>Loading students from the API…</p>}
              <div className="student-list">
                {students.map((student) => (
                  <div key={student.id} className="student-item">
                    <div>
                      <h4>{student.name}</h4>
                      <p>{student.grade} • {student.subject}</p>
                      <small>{student.notes}</small>
                    </div>
                    <div className="student-meta">
                      <span>Attendance: {student.attendance}%</span>
                      <label>
                        Progress
                        <input type="range" min="0" max="100" value={student.progress} onChange={(e) => dispatch(updateStudent({ id: student.id, progress: Number(e.target.value) }))} />
                      </label>
                      <span className={student.paymentStatus === 'Paid' ? 'paid' : 'pending'}>{student.paymentStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeView === 'payments' && (
          <section className="content-stack">
            <div className="card">
              <h3>Payment tracker</h3>
              <div className="payment-list">
                {students.map((student) => (
                  <div key={student.id} className="payment-item">
                    <div>
                      <h4>{student.name}</h4>
                      <p>{student.grade}</p>
                    </div>
                    <div>
                      <strong>LKR {student.fee.toLocaleString()}</strong>
                      <p className={student.paymentStatus === 'Paid' ? 'paid' : 'pending'}>{student.paymentStatus}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

const App = () => (
  <Provider store={store}>
    <StudentApp />
  </Provider>
);

export default App;
