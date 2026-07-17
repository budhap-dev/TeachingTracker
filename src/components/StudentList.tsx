import type { CSSProperties } from 'react'
import type { Student } from '../data/students'

const yearGroupColors: Record<string, { header: string; accent: string }> = {
    '8': { header: 'var(--year-8-header)', accent: 'var(--year-8-accent)' },
    '9': { header: 'var(--year-9-header)', accent: 'var(--year-9-accent)' },
    '10': { header: 'var(--year-10-header)', accent: 'var(--year-10-accent)' },
    '11': { header: 'var(--year-11-header)', accent: 'var(--year-11-accent)' },
    '12': { header: 'var(--year-12-header)', accent: 'var(--year-12-accent)' },
    Unassigned: {
        header: 'var(--year-unassigned-header)',
        accent: 'var(--year-unassigned-accent)',
    },
}

type StudentListProps = {
    students: Student[]
    onOpenStudentPage: (studentId: number) => void
}

export const StudentList = ({
    students,
    onOpenStudentPage,
}: StudentListProps) => {
    const groupedStudents = students.reduce<Record<string, Student[]>>(
        (acc, student) => {
            const year = student.year || 'Unassigned'
            acc[year] = [...(acc[year] || []), student]
            return acc
        },
        {}
    )

    return (
        <div className="student-list">
            {Object.entries(groupedStudents)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, yearStudents]) => {
                    const groupStyle =
                        yearGroupColors[year] || yearGroupColors.Unassigned
                    const roster = [...yearStudents].sort((a, b) =>
                        `${a.firstName} ${a.lastName}`.localeCompare(
                            `${b.firstName} ${b.lastName}`
                        )
                    )
                    return (
                        // The year's colour pair rides as custom properties so
                        // the stylesheet owns the actual treatment.
                        <section
                            key={year}
                            className="year-group"
                            style={
                                {
                                    '--year-color': groupStyle.header,
                                    '--year-tint': groupStyle.accent,
                                } as CSSProperties
                            }
                        >
                            <header className="year-group-head">
                                <h4>Year {year}</h4>
                                <span className="year-count">
                                    {roster.length}{' '}
                                    {roster.length === 1
                                        ? 'student'
                                        : 'students'}
                                </span>
                            </header>
                            <ul className="year-students">
                                {roster.map((student) => (
                                    <li key={student.id}>
                                        <span className="student-cell">
                                            <a
                                                href={`#student-${student.id}`}
                                                className="student-link"
                                                onClick={(event) => {
                                                    event.preventDefault()
                                                    onOpenStudentPage(
                                                        student.id
                                                    )
                                                }}
                                            >
                                                {student.firstName}{' '}
                                                {student.lastName}
                                            </a>
                                            <small>
                                                {student.subjects.join(', ')} •{' '}
                                                {student.school}
                                            </small>
                                        </span>
                                        <span className="student-code">
                                            {student.studentId}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )
                })}
        </div>
    )
}
