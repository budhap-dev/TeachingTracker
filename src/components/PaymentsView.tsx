import { useMemo, useState } from 'react';
import type { Student } from '../data/students';

type PaymentsViewProps = {
  students: Student[];
};

type SortKey = 'student' | 'subject' | 'school' | 'mode';
type SortDirection = 'asc' | 'desc';

const rowsPerPage = 5;

export const PaymentsView = ({ students }: PaymentsViewProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('student');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);

  const sortedStudents = useMemo(() => {
    const copy = [...students];
    copy.sort((left, right) => {
      const leftValue = `${left.firstName} ${left.lastName}`.toLowerCase();
      const rightValue = `${right.firstName} ${right.lastName}`.toLowerCase();
      const values = {
        student: [leftValue, rightValue],
        subject: [left.subject.toLowerCase(), right.subject.toLowerCase()],
        school: [left.school.toLowerCase(), right.school.toLowerCase()],
        mode: [left.mode.toLowerCase(), right.mode.toLowerCase()],
      }[sortKey];

      const comparison = values[0].localeCompare(values[1]);
      return sortDirection === 'asc' ? comparison : comparison * -1;
    });

    return copy;
  }, [students, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / rowsPerPage));
  const currentPageStudents = sortedStudents.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  };

  return (
    <section className="content-stack">
      <div className="card">
        <h3>Study snapshot</h3>
        <p className="section-subtitle">A quick tabular view of students, subjects, and delivery mode.</p>
        <div className="table-wrapper">
          <table className="snapshot-table">
            <thead>
              <tr>
                <th>#</th>
                <th>
                  <button type="button" className="sort-button" onClick={() => handleSort('student')}>
                    Student {sortKey === 'student' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-button" onClick={() => handleSort('subject')}>
                    Subject {sortKey === 'subject' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-button" onClick={() => handleSort('school')}>
                    School {sortKey === 'school' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-button" onClick={() => handleSort('mode')}>
                    Mode {sortKey === 'mode' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPageStudents.map((student, index) => {
                const modeStyle = student.mode === 'Online'
                  ? { color: '#2563eb', fontWeight: 700 }
                  : { color: '#b45309', fontWeight: 700 };

                return (
                  <tr key={student.id}>
                    <td>{(page - 1) * rowsPerPage + index + 1}</td>
                    <td>{student.firstName} {student.lastName}</td>
                    <td>{student.subject}</td>
                    <td>{student.school}</td>
                    <td style={modeStyle}>{student.mode}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Page {page} of {totalPages}</span>
          <div className="pagination-controls">
            <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
          </div>
        </div>
      </div>
    </section>
  );
};
