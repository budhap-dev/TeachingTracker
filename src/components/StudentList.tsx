import type { Student } from '../data/students';

type StudentListProps = {
  students: Student[];
  onOpenStudentPage: (studentId: number) => void;
};

const yearGroupColors: Record<string, { header: string; accent: string }> = {
  '8': { header: '#2563eb', accent: '#dbeafe' },
  '9': { header: '#7c3aed', accent: '#ede9fe' },
  '10': { header: '#0f766e', accent: '#ccfbf1' },
  '11': { header: '#b45309', accent: '#ffedd5' },
  '12': { header: '#dc2626', accent: '#fee2e2' },
  Unassigned: { header: '#475569', accent: '#e2e8f0' },
};

export const StudentList = ({ students, onOpenStudentPage }: StudentListProps) => {
  const groupedStudents = students.reduce<Record<string, Student[]>>((acc, student) => {
    const year = student.year || 'Unassigned';
    acc[year] = [...(acc[year] || []), student];
    return acc;
  }, {});

  return (
    <div className="student-list">
      {Object.entries(groupedStudents).sort(([a], [b]) => Number(b) - Number(a)).map(([year, yearStudents]) => {
        const groupStyle = yearGroupColors[year] || yearGroupColors.Unassigned;
        return (
        <div key={year} className="year-group" style={{ backgroundColor: groupStyle.accent, borderRadius: 16, padding: 12 }}>
          <h4 className="year-group-header" style={{ backgroundColor: groupStyle.header, color: '#fff' }}>Year {year}</h4>
          {yearStudents.map((student) => {
            return (
              <div key={student.id} className="student-item">
                <div className="student-row">
                  <span>
                    <a
                      href={`#student-${student.id}`}
                      className="student-link"
                      onClick={(event) => {
                        event.preventDefault();
                        onOpenStudentPage(student.id);
                      }}
                    >
                      {student.firstName} {student.lastName}
                    </a>
                    <small>{student.subjects.join(', ')} • {student.school}</small>
                  </span>
                  <span className="student-summary-meta">
                    <span>{student.studentId}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        );
      })}
    </div>
  );
};
