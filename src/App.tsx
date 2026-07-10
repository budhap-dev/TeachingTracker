import { FormEvent, useEffect, useMemo, useState } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Provider } from 'react-redux'
import {
    loadStudents,
    saveStudent,
    scheduleClass,
    store,
    updatePaymentRecord,
    updateStudent,
    updateStudentDetails,
} from './store/store'
import { useAppDispatch, useAppSelector } from './hooks'
import type { ScheduledSession, Student } from './data/students'
import './styles.scss'
import { DashboardView } from './components/DashboardView'
import { ClassSchedulingView } from './components/ClassSchedulingView'
import { PaymentTrackerView } from './components/PaymentTrackerView'
import { PaymentsView } from './components/PaymentsView'
import { StudentDetailsView } from './components/StudentDetailsView'
import { StudentsView } from './components/StudentsView'
import {
    teacherQuotes,
    ThemeName,
    ThemePreset,
    themePresets,
} from './utils/constants'

const StudentApp = () => {
    const dispatch = useAppDispatch()
    const students = useAppSelector((state) => state.students.students)
    const scheduledSessions = useAppSelector(
        (state) => state.students.scheduledSessions
    )
    const paymentRecords = useAppSelector(
        (state) => state.students.paymentRecords
    )
    const loading = useAppSelector((state) => state.students.loading)
    const [activeView, setActiveView] = useState<
        | 'dashboard'
        | 'students'
        | 'studyModes'
        | 'paymentTracker'
        | 'studentDetail'
        | 'scheduling'
    >('dashboard')
    const [theme, setTheme] = useState<ThemeName>(() => {
        const storedTheme = window.localStorage.getItem(
            'teachtrack-theme'
        ) as ThemeName | null
        return storedTheme && themePresets[storedTheme] ? storedTheme : 'ocean'
    })
    const [isThemePickerOpen, setIsThemePickerOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
        null
    )
    const [editingStudentId, setEditingStudentId] = useState<number | null>(
        null
    )
    const [draftStudent, setDraftStudent] = useState<Partial<Student> | null>(
        null
    )
    const dailyQuote = useMemo(
        () => teacherQuotes[Math.floor(Math.random() * teacherQuotes.length)],
        []
    )
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
    })

    const stats = useMemo(() => {
        const onlineStudents = students.filter(
            (s) => s.mode === 'Online'
        ).length
        const faceToFaceStudents = students.filter(
            (s) => s.mode === 'Face to Face'
        ).length
        const avgProgress = Math.round(
            students.reduce((sum, s) => sum + s.progress, 0) / students.length
        )
        return {
            onlineStudents,
            faceToFaceStudents,
            avgProgress,
            totalStudents: students.length,
        }
    }, [students])

    const upcomingSessions = useMemo(
        () =>
            [...scheduledSessions].sort((left, right) =>
                `${left.date} ${left.time}`.localeCompare(
                    `${right.date} ${right.time}`
                )
            ),
        [scheduledSessions]
    )

    const overviewChart = useMemo(
        () => [
            { label: 'Students', value: students.length },
            { label: 'Face to Face', value: stats.faceToFaceStudents },
            { label: 'Online', value: stats.onlineStudents },
            { label: 'Upcoming sessions', value: upcomingSessions.length },
        ],
        [
            students.length,
            stats.faceToFaceStudents,
            stats.onlineStudents,
            upcomingSessions.length,
        ]
    )

    const activeTheme = themePresets[theme]

    const muiTheme = useMemo(
        () =>
            createTheme({
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
            }),
        [activeTheme.primary, activeTheme.secondary, theme]
    )

    useEffect(() => {
        dispatch(loadStudents())
    }, [dispatch])

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        window.localStorage.setItem('teachtrack-theme', theme)
    }, [theme])

    const handleViewChange = (
        view:
            | 'dashboard'
            | 'students'
            | 'studyModes'
            | 'paymentTracker'
            | 'scheduling'
    ) => {
        setActiveView(view)
        setIsMobileNavOpen(false)
        setSelectedStudentId(null)
        window.scrollTo({ top: 0, left: 0 })
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (
            !form.firstName ||
            !form.lastName ||
            form.subjects.length === 0 ||
            !form.school ||
            !form.year
        )
            return

        const newStudentId = `STU-${Date.now().toString().slice(-6)}`

        dispatch(
            saveStudent({
                ...form,
                studentId: newStudentId,
                progress: Number(form.progress),
            })
        )

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
        })
        setIsModalOpen(false)
        setActiveView('students')
    }

    const handleOpenStudentPage = (studentId: number) => {
        setSelectedStudentId(studentId)
        setActiveView('studentDetail')
        setEditingStudentId(null)
        setDraftStudent(null)
    }

    const handleBeginEdit = (student: Student) => {
        setEditingStudentId(student.id)
        setDraftStudent({ ...student })
    }

    const handleDraftChange = (
        field: keyof Pick<
            Student,
            'parentName' | 'contactNumber' | 'address' | 'notes'
        >,
        value: string
    ) => {
        setDraftStudent((current) => ({ ...current!, [field]: value }))
    }

    const handleSaveStudentDetails = (studentId: number) => {
        Object.entries(draftStudent as Partial<Student>).forEach(
            ([field, value]) => {
                const typedField = field as keyof Pick<
                    Student,
                    'parentName' | 'contactNumber' | 'address' | 'notes'
                >
                if (
                    [
                        'parentName',
                        'contactNumber',
                        'address',
                        'notes',
                    ].includes(field)
                ) {
                    dispatch(
                        updateStudentDetails({
                            id: studentId,
                            field: typedField,
                            value: String(value),
                        })
                    )
                }
            }
        )
        setEditingStudentId(null)
        setDraftStudent(null)
    }

    const handleScheduleClass = (session: Omit<ScheduledSession, 'id'>) => {
        dispatch(scheduleClass(session))
        setActiveView('dashboard')
    }

    const hasUnsavedChanges = Boolean(draftStudent && editingStudentId)
    const selectedStudent =
        students.find((student) => student.id === selectedStudentId) ?? null

    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <div className="app-shell">
                <aside
                    className={`sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}
                    style={{ backgroundImage: activeTheme.sidebar }}
                >
                    <div className="sidebar-header">
                        <div>
                            <h1>TeachTrack</h1>
                            <p>
                                One teacher dashboard for student growth and
                                study snapshots.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="mobile-nav-toggle"
                            onClick={() =>
                                setIsMobileNavOpen((current) => !current)
                            }
                            aria-label={
                                isMobileNavOpen
                                    ? 'Close navigation'
                                    : 'Open navigation'
                            }
                            aria-expanded={isMobileNavOpen}
                        >
                            <span />
                            <span />
                            <span />
                        </button>
                    </div>
                    <nav className="sidebar-nav">
                        <button
                            className={
                                activeView === 'dashboard' ? 'active' : ''
                            }
                            onClick={() => handleViewChange('dashboard')}
                        >
                            Dashboard
                        </button>
                        <button
                            className={
                                activeView === 'students' ? 'active' : ''
                            }
                            onClick={() => handleViewChange('students')}
                        >
                            Students
                        </button>
                        <button
                            className={
                                activeView === 'studyModes' ? 'active' : ''
                            }
                            onClick={() => handleViewChange('studyModes')}
                        >
                            Study Snapshot
                        </button>
                        <button
                            className={
                                activeView === 'paymentTracker' ? 'active' : ''
                            }
                            onClick={() => handleViewChange('paymentTracker')}
                        >
                            Payment Tracker
                        </button>
                        <button
                            className={
                                activeView === 'scheduling' ? 'active' : ''
                            }
                            onClick={() => handleViewChange('scheduling')}
                        >
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
                            <div
                                className="theme-picker"
                                aria-label="Theme selector"
                            >
                                <button
                                    type="button"
                                    className="theme-toggle"
                                    onClick={() =>
                                        setIsThemePickerOpen(
                                            (current) => !current
                                        )
                                    }
                                    aria-label={
                                        isThemePickerOpen
                                            ? 'Hide theme options'
                                            : 'Show theme options'
                                    }
                                >
                                    <span className="theme-toggle-current">
                                        {activeTheme.label}
                                    </span>
                                </button>
                                {isThemePickerOpen && (
                                    <div className="theme-swatches">
                                        {(
                                            Object.entries(themePresets) as [
                                                ThemeName,
                                                ThemePreset,
                                            ][]
                                        ).map(([themeKey, preset]) => (
                                            <button
                                                key={themeKey}
                                                type="button"
                                                className={`theme-swatch ${theme === themeKey ? 'active' : ''}`}
                                                onClick={() => {
                                                    setTheme(themeKey)
                                                    setIsThemePickerOpen(false)
                                                }}
                                                aria-label={`Select ${preset.label} theme`}
                                                title={preset.label}
                                            >
                                                <span
                                                    className="swatch-accent"
                                                    style={{
                                                        background:
                                                            preset.accent,
                                                    }}
                                                />
                                                <span
                                                    className="swatch-accent-alt"
                                                    style={{
                                                        background:
                                                            preset.accentAlt,
                                                    }}
                                                />
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
                            onManageStudents={() =>
                                handleViewChange('students')
                            }
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
                            onFormChange={(field, value) =>
                                setForm((current) => ({
                                    ...current,
                                    [field]: value,
                                }))
                            }
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
                            onDraftChange={(field, value) =>
                                handleDraftChange(field, value)
                            }
                            onSaveDetails={handleSaveStudentDetails}
                            onCancelEdit={() => {
                                setEditingStudentId(null)
                                setDraftStudent(null)
                            }}
                            onProgressChange={(studentId, value) =>
                                dispatch(
                                    updateStudent({
                                        id: studentId,
                                        progress: value,
                                    })
                                )
                            }
                        />
                    )}

                    {activeView === 'studyModes' && (
                        <PaymentsView students={students} />
                    )}

                    {activeView === 'paymentTracker' && (
                        <PaymentTrackerView
                            students={students}
                            paymentRecords={paymentRecords}
                            onUpdatePaymentRecord={(record) =>
                                dispatch(updatePaymentRecord(record))
                            }
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
    )
}

const App = () => (
    <Provider store={store}>
        <StudentApp />
    </Provider>
)

export default App
