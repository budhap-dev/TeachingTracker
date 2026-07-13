import type { Student } from '../data/students'

type StudentListProps = {
    students: Student[]
    onOpenStudentPage: (studentId: number) => void
}

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
                    return (
                        <div
                            key={year}
                            className="year-group"
                            style={{
                                backgroundColor: groupStyle.accent,
                                border: `1px solid color-mix(in srgb, ${groupStyle.header} 20%, var(--border))`,
                                borderRadius: 16,
                                padding: 12,
                            }}
                        >
                            <h4
                                className="year-group-header"
                                style={{
                                    backgroundColor: groupStyle.header,
                                    color: '#fff',
                                }}
                            >
                                Year {year}
                            </h4>
                            {yearStudents.map((student) => {
                                return (
                                    <div
                                        key={student.id}
                                        className="student-item"
                                    >
                                        <div className="student-row">
                                            <span>
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
                                                    {student.subjects.join(
                                                        ', '
                                                    )}{' '}
                                                    • {student.school}
                                                </small>
                                            </span>
                                            <span className="student-summary-meta">
                                                <span>{student.studentId}</span>
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
        </div>
    )
}
