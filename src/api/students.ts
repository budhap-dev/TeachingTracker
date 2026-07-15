import type { Student } from '../data/students'
import { apiRequest } from './client'

/** Payload for creating/updating a student. `id` present => update, absent => create. */
export type StudentInput = Omit<Student, 'id'> & { id?: number }

/** GET /students — all students. */
export const fetchStudents = (): Promise<Student[]> =>
    apiRequest<Student[]>('/students')

/** GET /students/{id} — a single student. */
export const fetchStudent = (id: number): Promise<Student> =>
    apiRequest<Student>(`/students/${id}`)

/** POST /students — create or update a student (upsert). */
export const upsertStudent = (input: StudentInput): Promise<Student> =>
    apiRequest<Student>('/students', { method: 'POST', body: input })
