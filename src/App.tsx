import { FormEvent, useEffect, useMemo, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { loadStudents, saveStudent, scheduleClass, store, updatePaymentRecord, updateStudent, updateStudentDetails } from './store/store';
import { useAppDispatch, useAppSelector } from './hooks';
import type { ScheduledSession, Student } from './data/students';
import './styles.scss';
import { DashboardView } from './components/DashboardView';
import { ClassSchedulingView } from './components/ClassSchedulingView';
import { PaymentTrackerView } from './components/PaymentTrackerView';
import { PaymentsView } from './components/PaymentsView';
import { StudentDetailsView } from './components/StudentDetailsView';
import { StudentsView } from './components/StudentsView';

type ThemeName = 'ocean' | 'sunset' | 'forest' | 'midnight' | 'lavender' | 'coral' | 'sage' | 'amber' | 'berry' | 'slate' | 'spring' | 'summer' | 'autumn' | 'winter';

type ThemePreset = {
  label: string;
  accent: string;
  accentAlt: string;
  sidebar: string;
  primary: string;
  secondary: string;
};

const themePresets: Record<ThemeName, ThemePreset> = {
  ocean: { label: 'Ocean', accent: '#2563eb', accentAlt: '#4f46e5', sidebar: 'linear-gradient(180deg, #0f172a, #1d4ed8)', primary: '#2563eb', secondary: '#4f46e5' },
  sunset: { label: 'Sunset', accent: '#ea580c', accentAlt: '#d946ef', sidebar: 'linear-gradient(180deg, #431407, #b45309)', primary: '#ea580c', secondary: '#d946ef' },
  forest: { label: 'Forest', accent: '#15803d', accentAlt: '#0f766e', sidebar: 'linear-gradient(180deg, #052e16, #166534)', primary: '#15803d', secondary: '#0f766e' },
  midnight: { label: 'Midnight', accent: '#6366f1', accentAlt: '#8b5cf6', sidebar: 'linear-gradient(180deg, #020617, #312e81)', primary: '#6366f1', secondary: '#8b5cf6' },
  lavender: { label: 'Lavender', accent: '#7c3aed', accentAlt: '#ec4899', sidebar: 'linear-gradient(180deg, #2e1065, #7c3aed)', primary: '#7c3aed', secondary: '#ec4899' },
  coral: { label: 'Coral', accent: '#f43f5e', accentAlt: '#fb923c', sidebar: 'linear-gradient(180deg, #4c0519, #be123c)', primary: '#f43f5e', secondary: '#fb923c' },
  sage: { label: 'Sage', accent: '#4d7c0f', accentAlt: '#65a30d', sidebar: 'linear-gradient(180deg, #111827, #4d7c0f)', primary: '#4d7c0f', secondary: '#65a30d' },
  amber: { label: 'Amber', accent: '#d97706', accentAlt: '#f59e0b', sidebar: 'linear-gradient(180deg, #451a03, #92400e)', primary: '#d97706', secondary: '#f59e0b' },
  berry: { label: 'Berry', accent: '#db2777', accentAlt: '#8b5cf6', sidebar: 'linear-gradient(180deg, #2d0a1d, #7e22ce)', primary: '#db2777', secondary: '#8b5cf6' },
  slate: { label: 'Slate', accent: '#475569', accentAlt: '#64748b', sidebar: 'linear-gradient(180deg, #0f172a, #334155)', primary: '#475569', secondary: '#64748b' },
  spring: { label: 'Spring', accent: '#0f766e', accentAlt: '#84cc16', sidebar: 'linear-gradient(180deg, #022c22, #0f766e)', primary: '#0f766e', secondary: '#84cc16' },
  summer: { label: 'Summer', accent: '#0284c7', accentAlt: '#f59e0b', sidebar: 'linear-gradient(180deg, #082f49, #0f766e)', primary: '#0284c7', secondary: '#f59e0b' },
  autumn: { label: 'Autumn', accent: '#b45309', accentAlt: '#a16207', sidebar: 'linear-gradient(180deg, #431407, #92400e)', primary: '#b45309', secondary: '#a16207' },
  winter: { label: 'Winter', accent: '#2563eb', accentAlt: '#38bdf8', sidebar: 'linear-gradient(180deg, #0f172a, #1d4ed8)', primary: '#2563eb', secondary: '#38bdf8' },
};

const   teacherQuotes = [
  'A teacher affects eternity; he can never tell where his influence stops. - Henry Adams',
  'The mediocre teacher tells. The good teacher explains. The superior teacher demonstrates. The great teacher inspires. - William Arthur Ward',
  'One child, one teacher, one book, one pen can change the world. - Malala Yousafzai',
  'A good teacher can inspire hope, ignite the imagination, and instill a love of learning. - Brad Henry',
  'The dream begins with a teacher who believes in you. - Dan Rather',
  'You cannot teach a man anything; you can only help him find it within himself. - Dale Carnegie',
  'A teacher who is attempting to teach without inspiring the pupil with a desire to learn is hammering on cold iron. - Horace Mann',
  'It is the supreme art of the teacher to awaken joy in creative expression and knowledge. - Albert Einstein',
  'The beautiful thing about learning is that nobody can take it away from you. - B.B. King',
  'I like a teacher who gives you something to take home to think about besides homework. - Lily Tomlin',
  'One looks back with appreciation to the brilliant teachers, but with gratitude to those who touched our human feelings. - Carl Jung',
  'The whole purpose of education is to turn mirrors into windows. - Sydney J. Harris',
  'Tell me and I forget. Teach me and I remember. Involve me and I learn. - Xunzi',
  'The mind is not a vessel to be filled but a fire to be kindled. - Plutarch',
  'Education is not the filling of a pail, but the lighting of a fire. - William Butler Yeats',
  'The art of teaching is the art of assisting discovery. - Mark Van Doren',
  'Teachers can change lives with just the right mix of chalk and challenges. - Joyce Meyer',
  'It is important that students question what is known, not worship it. - Jacob Bronowski',
  'Good teaching is more a giving of right questions than a giving of right answers. - Josef Albers',
  'What we want is to see the child in pursuit of knowledge, and not knowledge in pursuit of the child. - George Bernard Shaw',
  'Education is what survives when what has been learned has been forgotten. - B.F. Skinner',
  'He who opens a school door, closes a prison. - Victor Hugo',
  'The task of the modern educator is not to cut down jungles, but to irrigate deserts. - C.S. Lewis',
  'I touch the future. I teach. - Christa McAuliffe',
  'One good teacher in a lifetime may sometimes change a delinquent into a solid citizen. - Philip Wylie',
  'If you have to put someone on a pedestal, put teachers. They are society’s heroes. - Guy Kawasaki',
  'Teaching is the one profession that creates all other professions. - Unknown',
  'The influence of a good teacher can never be erased. - Unknown',
  'Students don’t care how much you know until they know how much you care. - Theodore Roosevelt',
  'A great teacher takes a hand, opens a mind, and touches a heart. - Unknown',
  'The best teachers are those who show you where to look, but do not tell you what to see. - Alexandra K. Trenfor',
  'To teach is to learn twice. - Joseph Joubert',
  'A teacher is one who makes himself progressively unnecessary. - Thomas Carruthers',
  'Those who know, do. Those that understand, teach. - Aristotle',
  'Education is the key to success in life, and teachers make a lasting impact in the lives of their students. - Solomon Ortiz',
  'The art of teaching is the art of awakening the natural curiosity of young minds. - Anatole France',
  'A great teacher is a great artist because education is the art of shaping human potential. - John Steinbeck',
  'Better than a thousand days of diligent study is one day with a great teacher. - Japanese Proverb',
  'The true teacher defends his pupils against his own personal influence. - Amos Bronson Alcott',
  'What the teacher is, is more important than what he teaches. - Karl Menninger'
];

const StudentApp = () => {
  const dispatch = useAppDispatch();
  const students = useAppSelector((state) => state.students.students);
  const scheduledSessions = useAppSelector((state) => state.students.scheduledSessions);
  const paymentRecords = useAppSelector((state) => state.students.paymentRecords);
  const loading = useAppSelector((state) => state.students.loading);
  const [activeView, setActiveView] = useState<'dashboard' | 'students' | 'studyModes' | 'paymentTracker' | 'studentDetail' | 'scheduling'>('dashboard');
  const [theme, setTheme] = useState<ThemeName>(() => {
    const storedTheme = window.localStorage.getItem('teachtrack-theme') as ThemeName | null;
    return storedTheme && themePresets[storedTheme] ? storedTheme : 'ocean';
  });
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [draftStudent, setDraftStudent] = useState<Partial<Student> | null>(null);
  const dailyQuote = useMemo(() => teacherQuotes[Math.floor(Math.random() * teacherQuotes.length)], []);
  const [form, setForm] = useState<Omit<Student, 'id'>>({
    studentId: '',
    firstName: '',
    lastName: '',
    dob: '',
    subjects: [],
    school: '',
    year: '',
    progress: 0,
    mode: 'Face to Face',
    notes: '',
    parentName: '',
    contactNumber: '',
    address: '',
  });

  const stats = useMemo(() => {
    const onlineStudents = students.filter((s) => s.mode === 'Online').length;
    const faceToFaceStudents = students.filter((s) => s.mode === 'Face to Face').length;
    const avgProgress = Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length);
    return { onlineStudents, faceToFaceStudents, avgProgress, totalStudents: students.length };
  }, [students]);

  const upcomingSessions = useMemo(
    () => [...scheduledSessions].sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`)),
    [scheduledSessions]
  );

  const overviewChart = useMemo(() => ([
    { label: 'Students', value: students.length },
    { label: 'Face to Face', value: stats.faceToFaceStudents },
    { label: 'Online', value: stats.onlineStudents },
    { label: 'Upcoming sessions', value: upcomingSessions.length },
  ]), [students.length, stats.faceToFaceStudents, stats.onlineStudents, upcomingSessions.length]);

  const activeTheme = themePresets[theme];

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: theme === 'midnight' ? 'dark' : 'light',
      primary: { main: activeTheme.primary },
      secondary: { main: activeTheme.secondary },
      background: {
        default: theme === 'midnight' ? '#111827' : '#f8fafc',
        paper: theme === 'midnight' ? '#111827' : '#ffffff',
      },
      text: {
        primary: theme === 'midnight' ? '#f8fafc' : '#0f172a',
      },
    },
  }), [activeTheme.primary, activeTheme.secondary, theme]);

  useEffect(() => {
    dispatch(loadStudents());
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('teachtrack-theme', theme);
  }, [theme]);

  const handleViewChange = (view: 'dashboard' | 'students' | 'studyModes' | 'paymentTracker' | 'scheduling') => {
    setActiveView(view);
    setIsMobileNavOpen(false);
    setSelectedStudentId(null);
    window.scrollTo({ top: 0, left: 0 });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || form.subjects.length === 0 || !form.school || !form.year) return;

    const newStudentId = `STU-${Date.now().toString().slice(-6)}`;

    dispatch(
      saveStudent({
        ...form,
        studentId: newStudentId,
        progress: Number(form.progress),
      })
    );

    setForm({
      studentId: '',
      firstName: '',
      lastName: '',
      dob: '',
      subjects: [],
      school: '',
      year: '',
      progress: 0,
      mode: 'Face to Face',
      notes: '',
      parentName: '',
      contactNumber: '',
      address: '',
    });
    setIsModalOpen(false);
    setActiveView('students');
  };

  const handleOpenStudentPage = (studentId: number) => {
    setSelectedStudentId(studentId);
    setActiveView('studentDetail');
    setEditingStudentId(null);
    setDraftStudent(null);
  };

  const handleBeginEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setDraftStudent({ ...student });
  };

  const handleDraftChange = (field: keyof Pick<Student, 'parentName' | 'contactNumber' | 'address' | 'notes'>, value: string) => {
    setDraftStudent((current) => ({ ...current!, [field]: value }));
  };

  const handleSaveStudentDetails = (studentId: number) => {
    Object.entries(draftStudent as Partial<Student>).forEach(([field, value]) => {
      const typedField = field as keyof Pick<Student, 'parentName' | 'contactNumber' | 'address' | 'notes'>;
      if (['parentName', 'contactNumber', 'address', 'notes'].includes(field)) {
        dispatch(updateStudentDetails({ id: studentId, field: typedField, value: String(value) }));
      }
    });
    setEditingStudentId(null);
    setDraftStudent(null);
  };

  const handleScheduleClass = (session: Omit<ScheduledSession, 'id'>) => {
    dispatch(scheduleClass(session));
    setActiveView('dashboard');
  };

  const hasUnsavedChanges = Boolean(draftStudent && editingStudentId);
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="app-shell">
      <aside className={`sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`} style={{ backgroundImage: activeTheme.sidebar }}>
        <div className="sidebar-header">
          <div>
            <h1>TeachTrack</h1>
            <p>One teacher dashboard for student growth and study snapshots.</p>
          </div>
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setIsMobileNavOpen((current) => !current)}
            aria-label={isMobileNavOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={isMobileNavOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <nav className="sidebar-nav">
          <button className={activeView === 'dashboard' ? 'active' : ''} onClick={() => handleViewChange('dashboard')}>
            Dashboard
          </button>
          <button className={activeView === 'students' ? 'active' : ''} onClick={() => handleViewChange('students')}>
            Students
          </button>
          <button className={activeView === 'studyModes' ? 'active' : ''} onClick={() => handleViewChange('studyModes')}>
            Study Snapshot
          </button>
          <button className={activeView === 'paymentTracker' ? 'active' : ''} onClick={() => handleViewChange('paymentTracker')}>
            Payment Tracker
          </button>
          <button className={activeView === 'scheduling' ? 'active' : ''} onClick={() => handleViewChange('scheduling')}>
            Class scheduling
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Teacher portal</p>
            <h2>Welcome back, Ms. Abhinanda!</h2>
            <div className="welcome-quote-container ">
            <p className="welcome-quote">{dailyQuote}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="theme-picker" aria-label="Theme selector">
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setIsThemePickerOpen((current) => !current)}
                aria-label={isThemePickerOpen ? 'Hide theme options' : 'Show theme options'}
              >
                <span className="theme-toggle-current">{activeTheme.label}</span>
              </button>
              {isThemePickerOpen && (
                <div className="theme-swatches">
                  {(Object.entries(themePresets) as [ThemeName, ThemePreset][]).map(([themeKey, preset]) => (
                    <button
                      key={themeKey}
                      type="button"
                      className={`theme-swatch ${theme === themeKey ? 'active' : ''}`}
                      onClick={() => {
                        setTheme(themeKey);
                        setIsThemePickerOpen(false);
                      }}
                      aria-label={`Select ${preset.label} theme`}
                      title={preset.label}
                    >
                      <span className="swatch-accent" style={{ background: preset.accent }} />
                      <span className="swatch-accent-alt" style={{ background: preset.accentAlt }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="pill">Active term • 2026</div>
          </div>
        </header>

        {activeView === 'dashboard' && (
          <DashboardView
            stats={stats}
            upcomingSessions={upcomingSessions}
            overviewChart={overviewChart}
            onManageStudents={() => handleViewChange('students')}
            onOpenStudentPage={handleOpenStudentPage}
          />
        )}

        {activeView === 'students' && (
          <StudentsView
            students={students}
            loading={loading}
            isModalOpen={isModalOpen}
            form={form}
            onOpenModal={() => setIsModalOpen(true)}
            onCloseModal={() => setIsModalOpen(false)}
            onFormChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
            onSubmit={handleSubmit}
            onOpenStudentPage={handleOpenStudentPage}
          />
        )}

        {activeView === 'studentDetail' && selectedStudent && (
          <StudentDetailsView
            student={selectedStudent}
            scheduledSessions={scheduledSessions}
            editingStudentId={editingStudentId}
            draftStudent={draftStudent}
            hasUnsavedChanges={hasUnsavedChanges}
            onBack={() => handleViewChange('students')}
            onBeginEdit={handleBeginEdit}
            onDraftChange={(field, value) => handleDraftChange(field, value)}
            onSaveDetails={handleSaveStudentDetails}
            onCancelEdit={() => {
              setEditingStudentId(null);
              setDraftStudent(null);
            }}
            onProgressChange={(studentId, value) => dispatch(updateStudent({ id: studentId, progress: value }))}
          />
        )}

        {activeView === 'studyModes' && (
          <PaymentsView students={students} />
        )}

        {activeView === 'paymentTracker' && (
          <PaymentTrackerView
            students={students}
            paymentRecords={paymentRecords}
            onUpdatePaymentRecord={(record) => dispatch(updatePaymentRecord(record))}
          />
        )}

        {activeView === 'scheduling' && (
          <ClassSchedulingView
            students={students}
            sessions={scheduledSessions}
            onOpenStudentPage={handleOpenStudentPage}
            onScheduleClass={handleScheduleClass}
          />
        )}
      </main>
      </div>
    </ThemeProvider>
  );
};

const App = () => (
  <Provider store={store}>
    <StudentApp />
  </Provider>
);

export default App;
