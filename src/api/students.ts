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

/** POST /students/{id}/archive — move a student to Alumni (REQ-013). */
export const archiveStudent = (
    id: number,
    notes: string
): Promise<Student> =>
    apiRequest<Student>(`/students/${id}/archive`, {
        method: 'POST',
        body: { notes },
    })

/** POST /students/{id}/restore — return an alumnus to the active roster. */
export const restoreStudent = (id: number): Promise<Student> =>
    apiRequest<Student>(`/students/${id}/restore`, { method: 'POST' })
