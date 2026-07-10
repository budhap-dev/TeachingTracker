import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Student } from '../data/students';
import { initialStudents } from '../data/students';
import { createStudent, fetchStudents, updateStudentProgress } from '../api/studentApi';
import {
  addStudent,
  loadStudents,
  saveStudent,
  store,
  resetStudentState,
  updatePaymentRecord,
  updateProgress,
  updateStudent,
  updateStudentDetails,
} from './store';

vi.mock('../api/studentApi', () => ({
  fetchStudents: vi.fn(),
  createStudent: vi.fn(),
  updateStudentProgress: vi.fn(),
}));

const mockedFetchStudents = vi.mocked(fetchStudents);
const mockedCreateStudent = vi.mocked(createStudent);
const mockedUpdateStudentProgress = vi.mocked(updateStudentProgress);

const buildStudentPayload = (overrides: Partial<Omit<Student, 'id'>> = {}): Omit<Student, 'id'> => ({
  studentId: overrides.studentId ?? '',
  firstName: overrides.firstName ?? 'Test',
  lastName: overrides.lastName ?? 'Student',
  dob: overrides.dob ?? '2010-01-01',
  subjects: overrides.subjects ?? ['Mathematics'],
  school: overrides.school ?? 'Test School',
  year: overrides.year ?? '10',
  progress: overrides.progress ?? 60,
  mode: overrides.mode ?? 'Online',
  notes: overrides.notes ?? 'Note',
  parentName: overrides.parentName ?? 'Parent Name',
  contactNumber: overrides.contactNumber ?? '0700000000',
  address: overrides.address ?? 'Test Address',
});

describe('store reducers and thunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(resetStudentState());
  });

  it('covers reducer actions and extra reducers', async () => {
    const beforeCount = store.getState().students.students.length;

    store.dispatch(addStudent(buildStudentPayload({ studentId: '' })));
    const generatedStudent = store.getState().students.students.at(-1);
    expect(generatedStudent?.studentId).toMatch(/^STU-/);

    store.dispatch(addStudent(buildStudentPayload({ studentId: 'STU-EXPLICIT' })));
    expect(store.getState().students.students.at(-1)?.studentId).toBe('STU-EXPLICIT');
    expect(store.getState().students.students.length).toBe(beforeCount + 2);

    const existingId = store.getState().students.students[0].id;
    const oldProgress = store.getState().students.students[0].progress;

    store.dispatch(updateProgress({ id: existingId, progress: oldProgress + 5 }));
    expect(store.getState().students.students[0].progress).toBe(oldProgress + 5);

    store.dispatch(updateProgress({ id: -999, progress: 42 }));
    expect(store.getState().students.students[0].progress).toBe(oldProgress + 5);

    store.dispatch(updateStudentDetails({ id: existingId, field: 'notes', value: 'Updated Notes' }));
    expect(store.getState().students.students[0].notes).toBe('Updated Notes');

    store.dispatch(updateStudentDetails({ id: -999, field: 'notes', value: 'Nope' }));
    expect(store.getState().students.students[0].notes).toBe('Updated Notes');

    store.dispatch(updatePaymentRecord({ studentId: -999, month: '2099-01', status: 'Paid', amountPaid: 120, notes: 'Missing' }));
    expect(store.getState().students.paymentRecords.some((record) => record.studentId === -999)).toBe(false);

    store.dispatch(loadStudents.pending('req-1', undefined));
    expect(store.getState().students.loading).toBe(true);

    store.dispatch(loadStudents.rejected(new Error('fail') as Error | null, 'req-1', undefined));
    expect(store.getState().students.loading).toBe(false);
  });

  it('covers async thunk success and fallback paths', async () => {
    const apiStudent: Student = { id: 999, ...buildStudentPayload({ studentId: 'STU-999999', firstName: 'Api', lastName: 'Student' }) };

    mockedFetchStudents.mockResolvedValueOnce([apiStudent]);
    await store.dispatch(loadStudents());
    expect(store.getState().students.students[0].id).toBe(999);

    mockedFetchStudents.mockRejectedValueOnce(new Error('network'));
    await store.dispatch(loadStudents());
    expect(store.getState().students.students.length).toBe(initialStudents.length);

    mockedCreateStudent.mockResolvedValueOnce({ id: 1200, ...buildStudentPayload({ studentId: 'STU-120000', firstName: 'Saved' }) });
    await store.dispatch(saveStudent(buildStudentPayload({ studentId: 'STU-120000', firstName: 'Saved' })));
    expect(store.getState().students.students.some((student) => student.id === 1200)).toBe(true);

    mockedCreateStudent.mockRejectedValueOnce(new Error('create failed'));
    await store.dispatch(saveStudent(buildStudentPayload({ firstName: 'Fallback' })));
    expect(store.getState().students.students.some((student) => student.firstName === 'Fallback')).toBe(true);

    store.dispatch(addStudent(buildStudentPayload({ studentId: 'STU-LOCAL', firstName: 'Local' })));

    const mergedStudent: Student = { id: 2000, ...buildStudentPayload({ studentId: 'STU-200000', firstName: 'Merged', lastName: 'Student' }) };
    mockedFetchStudents.mockResolvedValueOnce([mergedStudent]);
    await store.dispatch(loadStudents());
    expect(store.getState().students.students.some((student) => student.id === 2000)).toBe(true);

    mockedUpdateStudentProgress.mockResolvedValueOnce({ id: 1200, progress: 99 } as Student);
    await store.dispatch(updateStudent({ id: 1200, progress: 99 }));
    expect(store.getState().students.students.find((student) => student.id === 1200)?.progress).toBe(99);

    mockedUpdateStudentProgress.mockRejectedValueOnce(new Error('update failed'));
    await store.dispatch(updateStudent({ id: -12345, progress: 55 }));
    expect(store.getState().students.students.find((student) => student.id === -12345)).toBeUndefined();
  });
});
