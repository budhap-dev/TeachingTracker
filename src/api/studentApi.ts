import type { Student } from '../data/students'

const API_BASE_URL = '/api'

export const fetchStudents = async (): Promise<Student[]> => {
    const response = await fetch(`${API_BASE_URL}/students`)
    if (!response.ok) {
        throw new Error('Failed to fetch students')
    }
    return response.json()
}

export const createStudent = async (
    student: Omit<Student, 'id'>
): Promise<Student> => {
    const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
    })
    if (!response.ok) {
        throw new Error('Failed to create student')
    }
    return response.json()
}

export const updateStudentProgress = async (
    studentId: number,
    progress: number
): Promise<Student> => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
    })
    if (!response.ok) {
        throw new Error('Failed to update student')
    }
    return response.json()
}
