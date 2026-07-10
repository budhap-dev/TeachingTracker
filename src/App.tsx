import { FormEvent, useEffect, useMemo, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { loadStudents, saveStudent, store, updateStudent, updateStudentDetails } from './store/store';
import { useAppDispatch, useAppSelector } from './hooks';
import type { Student } from './data/students';
import './styles.scss';
import { DashboardView } from './components/DashboardView';
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

const StudentApp = () => {
  const dispatch = useAppDispatch();
  const students = useAppSelector((state) => state.students.students);
  const loading = useAppSelector((state) => state.students.loading);
  const [activeView, setActiveView] = useState<'dashboard' | 'students' | 'studyModes' | 'studentDetail'>('dashboard');
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
    const avgProgress = Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length);
    return { onlineStudents, avgProgress, totalStudents: students.length };
  }, [students]);

  const upcomingSessions = useMemo(() => {
    const slots = ['16:00', '17:30', '09:30', '11:00', '14:00'];

    return students.slice(0, 5).map((student, index) => {
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() + index);

      return {
        id: `session-${student.id}`,
        studentId: student.id,
        date: sessionDate.toISOString(),
        time: slots[index % slots.length],
        studentName: `${student.firstName} ${student.lastName}`,
        subject: student.subjects.join(', '),
        mode: student.mode,
      };
    });
  }, [students]);

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

  const handleViewChange = (view: 'dashboard' | 'students' | 'studyModes') => {
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
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Teacher portal</p>
            <h2>Welcome back, Ms. Abhinanda!</h2>
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
