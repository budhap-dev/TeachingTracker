export type Student = {
  id: number;
  name: string;
  grade: string;
  subject: string;
  attendance: number;
  progress: number;
  paymentStatus: 'Paid' | 'Pending';
  fee: number;
  notes: string;
};

export const initialStudents: Student[] = [
  {
    id: 1,
    name: 'Asha Perera',
    grade: 'Grade 10',
    subject: 'Mathematics',
    attendance: 95,
    progress: 88,
    paymentStatus: 'Paid',
    fee: 2500,
    notes: 'Excellent problem solving skills.',
  },
  {
    id: 2,
    name: 'Nimal Fernando',
    grade: 'Grade 9',
    subject: 'Science',
    attendance: 84,
    progress: 74,
    paymentStatus: 'Pending',
    fee: 2200,
    notes: 'Needs extra practice with experiments.',
  },
  {
    id: 3,
    name: 'Kavindi Silva',
    grade: 'Grade 8',
    subject: 'English',
    attendance: 91,
    progress: 82,
    paymentStatus: 'Paid',
    fee: 2000,
    notes: 'Strong writing and reading confidence.',
  },
  {
    id: 4,
    name: 'Dilan Jayawardena',
    grade: 'Grade 11',
    subject: 'History',
    attendance: 79,
    progress: 70,
    paymentStatus: 'Pending',
    fee: 2400,
    notes: 'Needs more consistent revision habits.',
  },
];
