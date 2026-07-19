import type { Student } from '../data/students'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'

type AlumniViewProps = {
    /** Archived students only — the active roster is filtered out upstream. */
    alumni: Student[]
    onOpenStudentPage: (studentId: number) => void
}

/**
 * The teacher-only Alumni section (REQ-013): students who have finished
 * tutoring. They keep their full history — opening one shows the same student
 * page, with an Archived banner and a Restore action.
 */
export const AlumniView = ({ alumni, onOpenStudentPage }: AlumniViewProps) => (
    <section className="content-stack">
        <div className="card">
            <div className="section-header">
                <div>
                    <h3 className="page-heading">
                        <SchoolOutlinedIcon fontSize="small" />
                        Alumni
                    </h3>
                    <p className="section-subtitle">
                        Students who have finished tutoring. Their history is
                        kept — open one to view it or restore them.
                    </p>
                </div>
            </div>

            {alumni.length === 0 ? (
                <p>
                    No alumni yet. Archiving a student from their page moves
                    them here.
                </p>
            ) : (
                <div className="table-wrapper">
                    <table className="snapshot-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Year</th>
                                <th>Archived</th>
                                <th>Closing note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alumni.map((student) => (
                                <tr key={student.id}>
                                    <td>
                                        <a
                                            href={`#student-${student.id}`}
                                            className="student-link"
                                            onClick={(event) => {
                                                event.preventDefault()
                                                onOpenStudentPage(student.id)
                                            }}
                                        >
                                            {student.firstName}{' '}
                                            {student.lastName}
                                        </a>
                                    </td>
                                    <td>{student.year || '—'}</td>
                                    <td>{student.archivedOn ?? '—'}</td>
                                    <td>{student.archiveNotes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </section>
)
