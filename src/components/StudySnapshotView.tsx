import { useEffect, useMemo, useState } from 'react'
import type { Student } from '../data/students'

type StudySnapshotViewProps = {
    students: Student[]
    onOpenStudentPage: (studentId: number) => void
}

type SortKey = 'student' | 'subject' | 'school' | 'mode'
type SortDirection = 'asc' | 'desc'

const pageSizeOptions = [5, 10, 20]

export const StudySnapshotView = ({
    students,
    onOpenStudentPage,
}: StudySnapshotViewProps) => {
    const [sortKey, setSortKey] = useState<SortKey>('student')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
    const [page, setPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const sortedStudents = useMemo(() => {
        const copy = [...students]
        copy.sort((left, right) => {
            const leftValue = `${left.firstName} ${left.lastName}`.toLowerCase()
            const rightValue =
                `${right.firstName} ${right.lastName}`.toLowerCase()
            const leftSubjects = left.subjects.join(', ').toLowerCase()
            const rightSubjects = right.subjects.join(', ').toLowerCase()
            const values = {
                student: [leftValue, rightValue],
                subject: [leftSubjects, rightSubjects],
                school: [left.school.toLowerCase(), right.school.toLowerCase()],
                mode: [left.mode.toLowerCase(), right.mode.toLowerCase()],
            }[sortKey]

            const comparison = values[0].localeCompare(values[1])
            return sortDirection === 'asc' ? comparison : comparison * -1
        })

        return copy
    }, [students, sortKey, sortDirection])

    const totalPages = Math.max(
        1,
        Math.ceil(sortedStudents.length / rowsPerPage)
    )
    const currentPageStudents = sortedStudents.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    )

    useEffect(() => {
        setPage((current) => Math.min(current, totalPages))
    }, [totalPages])

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
            return
        }

        setSortKey(key)
        setSortDirection('asc')
    }

    return (
        <section className="content-stack">
            <div className="card">
                <h3>Study snapshot</h3>
                <p className="section-subtitle">
                    A quick tabular view of students, subjects, and delivery
                    mode.
                </p>
                <div className="table-wrapper">
                    <table className="snapshot-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>
                                    <button
                                        type="button"
                                        className="sort-button"
                                        onClick={() => handleSort('student')}
                                    >
                                        Student
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        className="sort-button"
                                        onClick={() => handleSort('subject')}
                                    >
                                        Subject
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        className="sort-button"
                                        onClick={() => handleSort('school')}
                                    >
                                        School
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        className="sort-button"
                                        onClick={() => handleSort('mode')}
                                    >
                                        Mode
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPageStudents.map((student, index) => {
                                const modeStyle =
                                    student.mode === 'Online'
                                        ? { color: '#2563eb', fontWeight: 700 }
                                        : { color: '#b45309', fontWeight: 700 }

                                return (
                                    <tr key={student.id}>
                                        <td>
                                            {(page - 1) * rowsPerPage +
                                                index +
                                                1}
                                        </td>
                                        <td>
                                            {/* Same link idiom as the students
                                                list: every student name in the
                                                app opens their page. */}
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
                                        </td>
                                        <td>{student.subjects.join(', ')}</td>
                                        <td>{student.school}</td>
                                        <td style={modeStyle}>
                                            {student.mode}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="table-footer">
                    <div className="page-size-control">
                        <label htmlFor="rows-per-page">Rows per page</label>
                        <select
                            id="rows-per-page"
                            value={rowsPerPage}
                            onChange={(event) => {
                                setRowsPerPage(Number(event.target.value))
                                setPage(1)
                            }}
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <div className="pagination-controls">
                        <button
                            type="button"
                            disabled={page === 1}
                            onClick={() =>
                                setPage((current) => Math.max(1, current - 1))
                            }
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={page === totalPages}
                            onClick={() =>
                                setPage((current) =>
                                    Math.min(totalPages, current + 1)
                                )
                            }
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
